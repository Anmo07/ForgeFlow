import httpx
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional
from datetime import datetime, timedelta
import hashlib
import json
import secrets
from .repository import AuthRepository
from .schema import UserRegister, UserLogin, TokenResponse, UserResponse
from ..common.security import verify_password, get_password_hash, password_needs_rehash, create_access_token, create_refresh_token, decode_token
from ..common.config import TURNSTILE_SECRET_KEY, REFRESH_TOKEN_EXPIRE_DAYS
from . import password_reset, mfa, lockout
TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

def verify_turnstile_token(token: str, ip: Optional[str]=None) -> bool:
    payload = {'secret': TURNSTILE_SECRET_KEY, 'response': token}
    if ip:
        payload['remoteip'] = ip
    try:
        resp = httpx.post(TURNSTILE_VERIFY_URL, data=payload, timeout=10.0)
        result = resp.json()
        if not result.get('success', False):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Turnstile verification failed: {result.get('error-codes', ['unknown'])}")
        return True
    except httpx.HTTPError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail='Could not verify Turnstile token — Cloudflare API unreachable')

class AuthService:

    def __init__(self):
        self.repo = AuthRepository()

    def register_user(self, db: Session, user_in: UserRegister, ip_address: Optional[str]=None) -> UserResponse:
        verify_turnstile_token(user_in.turnstile_token, ip=ip_address)
        existing_user = self.repo.get_by_email(db, user_in.email)
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='User with this email already registered')
        user = self.repo.create(db, user_in)
        return UserResponse.model_validate(user)

    def authenticate_user(self, db: Session, login_in: UserLogin, user_agent: Optional[str]=None, ip_address: Optional[str]=None) -> TokenResponse:
        verify_turnstile_token(login_in.turnstile_token, ip=ip_address)
        user = self.repo.get_by_email(db, login_in.email)
        if not user or not verify_password(login_in.password, user.hashed_password):
            from app.common.metrics import LOGIN_FAILURE
            LOGIN_FAILURE.inc()
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Incorrect email or password', headers={'WWW-Authenticate': 'Bearer'})
        if not user.is_active:
            from app.common.metrics import LOGIN_FAILURE
            LOGIN_FAILURE.inc()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Inactive user')
        if password_needs_rehash(user.hashed_password):
            user.hashed_password = get_password_hash(login_in.password)
            db.commit()
            db.refresh(user)
        import hashlib
        refresh_token = create_refresh_token(data={'sub': str(user.id)})
        sid = hashlib.sha256(refresh_token.encode()).hexdigest()
        access_token = create_access_token(data={'sub': str(user.id)}, sid=sid)
        from ..sessions.service import SessionService
        from datetime import datetime, timedelta
        from ..common.config import REFRESH_TOKEN_EXPIRE_DAYS
        expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        SessionService().register_session(db, user_id=user.id, refresh_token=refresh_token, expires_at=expires_at, ua_string=user_agent, ip_address=ip_address)
        
        from app.common.metrics import LOGIN_SUCCESS
        LOGIN_SUCCESS.inc()
        return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=UserResponse.model_validate(user))

    def refresh_tokens(self, db: Session, refresh_token: str, user_agent: Optional[str]=None, ip_address: Optional[str]=None) -> TokenResponse:
        try:
            payload = decode_token(refresh_token)
            user_id: str = payload.get('sub')
            token_type: str = payload.get('type')
            if user_id is None or token_type != 'refresh':
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid refresh token')
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Could not validate credentials')
        user = self.repo.get_by_id(db, int(user_id))
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found or inactive')
        from ..sessions.service import SessionService
        session_service = SessionService()
        old_sess = session_service.get_session_by_token(db, refresh_token)
        if old_sess:
            session_service.revoke_session(db, old_sess.user_id, old_sess.id)
        import hashlib
        new_refresh_token = create_refresh_token(data={'sub': str(user.id)})
        new_sid = hashlib.sha256(new_refresh_token.encode()).hexdigest()
        access_token = create_access_token(data={'sub': str(user.id)}, sid=new_sid)
        from datetime import datetime, timedelta
        from ..common.config import REFRESH_TOKEN_EXPIRE_DAYS
        expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        session_service.register_session(db, user_id=user.id, refresh_token=new_refresh_token, expires_at=expires_at, ua_string=user_agent, ip_address=ip_address)
        return TokenResponse(access_token=access_token, refresh_token=new_refresh_token, user=UserResponse.model_validate(user))

    def send_verification_email(self, db: Session, email: str) -> None:
        raw_token, token_hash = password_reset.generate_reset_token()
        expires_at = datetime.utcnow() + timedelta(hours=24)
        user = self.repo.get_by_email(db, email)
        if not user:
            return
        from ..common.redis import redis_client
        redis_client.setex(f'verification_token:{email}', 86400, token_hash)
        redis_client.setex(f'verification_raw:{raw_token}', 86400, email)
        print(f'[DEV] Verification token for {email}: {raw_token}')

    def verify_email(self, db: Session, raw_token: str) -> UserResponse:
        from ..common.redis import redis_client
        email = redis_client.get(f'verification_raw:{raw_token}')
        if not email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid or expired verification token')
        email = email.decode() if isinstance(email, bytes) else email
        user = self.repo.get_by_email(db, email)
        if not user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='User not found')
        user.is_verified = True
        db.commit()
        db.refresh(user)
        redis_client.delete(f'verification_raw:{raw_token}')
        redis_client.delete(f'verification_token:{email}')
        return UserResponse.model_validate(user)

    def request_password_reset(self, db: Session, email: str) -> None:
        raw_token, token_hash = password_reset.generate_reset_token()
        expires_at = password_reset.get_reset_token_expiry()
        user = self.repo.get_by_email(db, email)
        if user:
            from .models import PasswordResetToken
            db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user.id, PasswordResetToken.used == False).update({PasswordResetToken.used: True})
            reset_token = PasswordResetToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
            db.add(reset_token)
            db.commit()
            print(f'[DEV] Reset token for {email}: {raw_token}')

    def reset_password(self, db: Session, raw_token: str, new_password: str) -> UserResponse:
        from .models import PasswordResetToken
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        reset_token = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == token_hash).first()
        if not reset_token or reset_token.used:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid or already-used reset token')
        if password_reset.is_token_expired(reset_token.expires_at):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Reset token has expired')
        user = self.repo.get_by_id(db, reset_token.user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
        user.hashed_password = get_password_hash(new_password)
        reset_token.used = True
        from ..sessions.service import SessionService
        SessionService().invalidate_user_sessions(db, user.id)
        db.commit()
        db.refresh(user)
        return UserResponse.model_validate(user)

    def check_account_lockout(self, user_id: int) -> None:
        is_locked, cooldown = lockout.is_account_locked(user_id)
        if is_locked:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=f'Account locked due to too many failed attempts. Try again in {cooldown} seconds.')

    def mfa_setup_start(self, user_id: int, db: Session) -> dict:
        user = self.repo.get_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
        secret = mfa.generate_totp_secret()
        provisioning_uri = mfa.get_totp_provisioning_uri(user.email, secret)
        from ..common.redis import redis_client
        redis_client.setex(f'mfa_setup_temp:{user_id}', 600, secret)
        return {'secret': secret, 'provisioning_uri': provisioning_uri}

    def mfa_setup_verify(self, user_id: int, code: str, db: Session) -> dict:
        from ..common.redis import redis_client
        temp_secret = redis_client.get(f'mfa_setup_temp:{user_id}')
        if not temp_secret:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='MFA setup not in progress. Start setup again.')
        temp_secret = temp_secret.decode() if isinstance(temp_secret, bytes) else temp_secret
        if not mfa.verify_totp_code(temp_secret, code):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid TOTP code')
        raw_codes, hashed_codes = mfa.generate_backup_codes(count=8)
        user = self.repo.get_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
        user.mfa_secret = temp_secret
        user.mfa_enabled = True
        user.mfa_backup_codes = json.dumps(hashed_codes)
        db.commit()
        db.refresh(user)
        redis_client.delete(f'mfa_setup_temp:{user_id}')
        return {'backup_codes': raw_codes, 'message': 'MFA enabled. Store your backup codes in a safe place.'}

    def authenticate_user_with_mfa(self, db: Session, login_in: UserLogin, user_agent: Optional[str]=None, ip_address: Optional[str]=None) -> dict:
        user_email = login_in.email
        user = self.repo.get_by_email(db, user_email)
        if user:
            self.check_account_lockout(user.id)
        verify_turnstile_token(login_in.turnstile_token, ip=ip_address)
        user = self.repo.get_by_email(db, user_email)
        if not user or not verify_password(login_in.password, user.hashed_password):
            if user:
                lockout.increment_failed_attempts(user.id)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Incorrect email or password')
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Inactive user')
        lockout.clear_failed_attempts(user.id)
        if password_needs_rehash(user.hashed_password):
            user.hashed_password = get_password_hash(login_in.password)
            db.commit()
            db.refresh(user)
        if not user.mfa_enabled:
            refresh_token = create_refresh_token(data={'sub': str(user.id)})
            sid = hashlib.sha256(refresh_token.encode()).hexdigest()
            access_token = create_access_token(data={'sub': str(user.id)}, sid=sid)
            from ..sessions.service import SessionService
            expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
            SessionService().register_session(db, user_id=user.id, refresh_token=refresh_token, expires_at=expires_at, ua_string=user_agent, ip_address=ip_address)
            return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=UserResponse.model_validate(user)).model_dump()
        from ..common.redis import redis_client
        temp_token = secrets.token_urlsafe(32)
        redis_client.setex(f'mfa_login_temp:{temp_token}', 300, str(user.id))
        return {'mfa_required': True, 'temp_token': temp_token, 'message': 'Enter your 2FA code to complete login'}

    def mfa_verify_login(self, db: Session, temp_token: str, code: str, user_agent: Optional[str]=None, ip_address: Optional[str]=None) -> TokenResponse:
        from ..common.redis import redis_client
        user_id_str = redis_client.get(f'mfa_login_temp:{temp_token}')
        if not user_id_str:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid or expired MFA session. Please login again.')
        user_id = int(user_id_str.decode() if isinstance(user_id_str, bytes) else user_id_str)
        user = self.repo.get_by_id(db, user_id)
        if not user or not user.mfa_enabled or (not user.mfa_secret):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='MFA not configured for this user')
        if mfa.verify_totp_code(user.mfa_secret, code):
            refresh_token = create_refresh_token(data={'sub': str(user.id)})
            sid = hashlib.sha256(refresh_token.encode()).hexdigest()
            access_token = create_access_token(data={'sub': str(user.id)}, sid=sid)
            from ..sessions.service import SessionService
            expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
            SessionService().register_session(db, user_id=user.id, refresh_token=refresh_token, expires_at=expires_at, ua_string=user_agent, ip_address=ip_address)
            redis_client.delete(f'mfa_login_temp:{temp_token}')
            return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=UserResponse.model_validate(user))
        if user.mfa_backup_codes and mfa.verify_backup_code(code, user.mfa_backup_codes):
            user.mfa_backup_codes = mfa.consume_backup_code(code, user.mfa_backup_codes)
            db.commit()
            refresh_token = create_refresh_token(data={'sub': str(user.id)})
            sid = hashlib.sha256(refresh_token.encode()).hexdigest()
            access_token = create_access_token(data={'sub': str(user.id)}, sid=sid)
            from ..sessions.service import SessionService
            expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
            SessionService().register_session(db, user_id=user.id, refresh_token=refresh_token, expires_at=expires_at, ua_string=user_agent, ip_address=ip_address)
            redis_client.delete(f'mfa_login_temp:{temp_token}')
            return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=UserResponse.model_validate(user))
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid 2FA code')
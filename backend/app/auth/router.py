from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..common.dependencies import get_db
from .schema import UserRegister, UserLogin, UserResponse, TokenResponse, ForgotPasswordRequest, ResetPasswordRequest, MFASetupResponse, MFAVerifyRequest, MFASetupCompleteResponse, MFAVerifyLoginRequest
from .service import AuthService
from . import csrf
from ..common.rate_limit import rate_limit_or_429, limiter
router = APIRouter()
auth_service = AuthService()

class RefreshRequest(BaseModel):
    refresh_token: str

class CSRFTokenResponse(BaseModel):
    csrf_token: str
    message: str = 'CSRF token generated. Include this token in X-CSRF-Token header for state-changing requests.'

@router.get('/csrf-token', response_model=CSRFTokenResponse)
def get_csrf_token(response: Response):
    token = csrf.generate_csrf_token()
    response.set_cookie(key='csrf_token', value=token, httponly=False, samesite='strict', max_age=3600, path='/')
    return {'csrf_token': token}

@router.post('/register', response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(req: UserRegister, request: Request, db: Session=Depends(get_db)):
    ip_address = request.client.host if request.client else None
    user = auth_service.register_user(db, req, ip_address=ip_address)
    try:
        auth_service.send_verification_email(db, user.email)
    except Exception as e:
        import logging
        logging.getLogger("forgeflow.api").warning(f"Failed to send verification email: {e}")
    return user

@router.get('/verify-email', response_model=UserResponse)
def verify_email(token: str, db: Session=Depends(get_db)):
    return auth_service.verify_email(db, token)

@router.post('/login', response_model=TokenResponse)
@limiter.limit("10/minute")
def login(req: UserLogin, request: Request, response: Response, db: Session=Depends(get_db)):
    ip_address = request.client.host if request.client else None
    if ip_address:
        rate_limit_or_429(f'rl:login:ip:{ip_address}', max_requests=10, window_seconds=60, detail='Too many login attempts from this IP. Please try again later.')
    if req.email:
        rate_limit_or_429(f'rl:login:email:{req.email}', max_requests=5, window_seconds=300, detail='Too many login attempts for this email. Please try again later.')
    user_agent = request.headers.get('user-agent')
    token_resp = auth_service.authenticate_user_with_mfa(db, req, user_agent=user_agent, ip_address=ip_address)
    if isinstance(token_resp, dict) and token_resp.get('mfa_required'):
        return token_resp
    response.set_cookie(key='access_token', value=token_resp.get("access_token"), httponly=True, samesite='strict', max_age=30 * 60, path='/')
    response.set_cookie(key='refresh_token', value=token_resp.get("refresh_token"), httponly=True, samesite='strict', max_age=30 * 24 * 60 * 60, path='/')
    return token_resp

@router.post('/forgot-password', status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
def forgot_password(req: ForgotPasswordRequest, request: Request, db: Session=Depends(get_db)):
    ip_address = request.client.host if request.client else None
    if ip_address:
        rate_limit_or_429(f'rl:forgot:ip:{ip_address}', max_requests=3, window_seconds=300, detail='Too many password reset requests. Please try again later.')
    auth_service.request_password_reset(db, req.email)
    return {'message': 'If an account exists with this email, a reset link has been sent.'}

@router.post('/reset-password', response_model=UserResponse)
@limiter.limit("5/minute")
def reset_password(req: ResetPasswordRequest, request: Request, db: Session=Depends(get_db)):
    ip_address = request.client.host if request.client else None
    if ip_address:
        rate_limit_or_429(f'rl:reset:ip:{ip_address}', max_requests=5, window_seconds=300, detail='Too many password reset attempts. Please try again later.')
    return auth_service.reset_password(db, req.token, req.new_password)

@router.post('/refresh', response_model=TokenResponse)
def refresh(req: RefreshRequest, request: Request, response: Response, db: Session=Depends(get_db)):
    user_agent = request.headers.get('user-agent')
    ip_address = request.client.host if request.client else None
    token_resp = auth_service.refresh_tokens(db, req.refresh_token, user_agent=user_agent, ip_address=ip_address)
    response.set_cookie(key='access_token', value=token_resp.access_token, httponly=True, samesite='strict', max_age=30 * 60, path='/')
    response.set_cookie(key='refresh_token', value=token_resp.refresh_token, httponly=True, samesite='strict', max_age=30 * 24 * 60 * 60, path='/')
    return token_resp

@router.post('/logout')
def logout(response: Response, request: Request, db: Session=Depends(get_db)):
    token_str = request.cookies.get('access_token')
    if token_str:
        try:
            from ..common.security import decode_token
            payload = decode_token(token_str)
            sid = payload.get('sid')
            if sid:
                from ..sessions.models import Session as UserSession
                db_sess = db.query(UserSession).filter(UserSession.refresh_token_hash == sid).first()
                if db_sess:
                    db_sess.revoked = True
                    db.commit()
        except Exception:
            pass
    response.delete_cookie('access_token', path='/')
    response.delete_cookie('refresh_token', path='/')
    return {'message': 'Logged out successfully'}

@router.post('/mfa/setup', response_model=MFASetupResponse)
def mfa_setup(request: Request, db: Session=Depends(get_db)):
    from ..common.security import decode_token
    token_str = request.cookies.get('access_token')
    if not token_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Not authenticated')
    try:
        payload = decode_token(token_str)
        user_id = int(payload.get('sub'))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')
    result = auth_service.mfa_setup_start(user_id, db)
    return MFASetupResponse(**result)

@router.post('/mfa/verify', response_model=MFASetupCompleteResponse)
@limiter.limit("10/minute")
def mfa_verify(req: MFAVerifyRequest, request: Request, db: Session=Depends(get_db)):
    from ..common.security import decode_token
    token_str = request.cookies.get('access_token')
    if not token_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Not authenticated')
    try:
        payload = decode_token(token_str)
        user_id = int(payload.get('sub'))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')
    result = auth_service.mfa_setup_verify(user_id, req.code, db)
    return MFASetupCompleteResponse(backup_codes=result['backup_codes'])

@router.post('/mfa/verify-login', response_model=TokenResponse)
@limiter.limit("10/minute")
def mfa_verify_login(req: MFAVerifyLoginRequest, request: Request, response: Response, db: Session=Depends(get_db)):
    ip_address = request.client.host if request.client else None
    if ip_address:
        rate_limit_or_429(f'rl:mfa:ip:{ip_address}', max_requests=10, window_seconds=60, detail='Too many MFA verification attempts. Please try again later.')
    user_agent = request.headers.get('user-agent')
    token_resp = auth_service.mfa_verify_login(db, req.temp_token, req.code, user_agent=user_agent, ip_address=ip_address)
    response.set_cookie(key='access_token', value=token_resp.access_token, httponly=True, samesite='strict', max_age=30 * 60, path='/')
    response.set_cookie(key='refresh_token', value=token_resp.refresh_token, httponly=True, samesite='strict', max_age=30 * 24 * 60 * 60, path='/')
    return token_resp
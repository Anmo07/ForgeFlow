import pytest
from fastapi.testclient import TestClient
import json
from datetime import datetime, timedelta
from backend.app.main import app
from backend.app.auth.models import User, PasswordResetToken
from backend.app.common.database import SessionLocal
from backend.app.auth.service import AuthService
from backend.app.common.redis import redis_client
from backend.app.auth import password_reset, mfa, lockout

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def db():
    connection = SessionLocal()
    yield connection
    connection.close()

@pytest.fixture
def test_user(db):
    from backend.app.common.security import get_password_hash
    user = User(email='testuser@example.com', hashed_password=get_password_hash('TestPassword123'), full_name='Test User', is_active=True, is_verified=False)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture(autouse=True)
def clear_redis():
    redis_client.flushdb()
    yield
    redis_client.flushdb()

class TestEmailVerification:

    def test_send_verification_email(self, db, test_user):
        service = AuthService()
        service.send_verification_email(db, test_user.email)
        token_key = redis_client.keys('verification_raw:*')
        assert len(token_key) > 0

    def test_verify_email_success(self, db, test_user):
        service = AuthService()
        raw_token, token_hash = password_reset.generate_reset_token()
        redis_client.setex(f'verification_raw:{raw_token}', 86400, test_user.email)
        result = service.verify_email(db, raw_token)
        assert result.is_verified is True
        assert redis_client.get(f'verification_raw:{raw_token}') is None

    def test_verify_email_invalid_token(self, db):
        service = AuthService()
        with pytest.raises(Exception):
            service.verify_email(db, 'invalid_token')

class TestPasswordReset:

    def test_forgot_password_generates_token(self, db, test_user):
        service = AuthService()
        service.request_password_reset(db, test_user.email)
        token = db.query(PasswordResetToken).filter(PasswordResetToken.user_id == test_user.id).first()
        assert token is not None
        assert token.used is False

    def test_forgot_password_invalid_email_returns_generic(self, db, test_user):
        service = AuthService()
        result = service.request_password_reset(db, 'nonexistent@example.com')
        assert result is None

    def test_reset_password_success(self, db, test_user):
        service = AuthService()
        raw_token, token_hash = password_reset.generate_reset_token()
        expires_at = password_reset.get_reset_token_expiry()
        reset_token = PasswordResetToken(user_id=test_user.id, token_hash=token_hash, expires_at=expires_at)
        db.add(reset_token)
        db.commit()
        new_password = 'NewPassword456'
        result = service.reset_password(db, raw_token, new_password)
        assert result.email == test_user.email
        reset_token = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == token_hash).first()
        assert reset_token.used is True

    def test_reset_password_expired_token(self, db, test_user):
        service = AuthService()
        raw_token, token_hash = password_reset.generate_reset_token()
        expires_at = datetime.utcnow() - timedelta(minutes=1)
        reset_token = PasswordResetToken(user_id=test_user.id, token_hash=token_hash, expires_at=expires_at)
        db.add(reset_token)
        db.commit()
        with pytest.raises(Exception) as exc_info:
            service.reset_password(db, raw_token, 'NewPassword456')
        assert 'expired' in str(exc_info.value).lower()

    def test_reset_password_one_time_use(self, db, test_user):
        service = AuthService()
        raw_token, token_hash = password_reset.generate_reset_token()
        expires_at = password_reset.get_reset_token_expiry()
        reset_token = PasswordResetToken(user_id=test_user.id, token_hash=token_hash, expires_at=expires_at)
        db.add(reset_token)
        db.commit()
        service.reset_password(db, raw_token, 'NewPassword456')
        with pytest.raises(Exception):
            service.reset_password(db, raw_token, 'AnotherPassword789')

class TestAccountLockout:

    def test_failed_attempts_increment(self, test_user):
        count, cooldown = lockout.increment_failed_attempts(test_user.id)
        assert count == 1
        assert cooldown == 0
        for _ in range(3):
            count, cooldown = lockout.increment_failed_attempts(test_user.id)
        assert count == 4
        assert cooldown == 0

    def test_lockout_after_max_failures(self, test_user):
        for _ in range(5):
            lockout.increment_failed_attempts(test_user.id)
        count, cooldown = lockout.increment_failed_attempts(test_user.id)
        assert count == 6
        assert cooldown > 0

    def test_exponential_backoff(self, test_user):
        for _ in range(5):
            lockout.increment_failed_attempts(test_user.id)
        _, cooldown = lockout.increment_failed_attempts(test_user.id)
        assert cooldown == 2
        lockout.clear_failed_attempts(test_user.id)
        for _ in range(10):
            lockout.increment_failed_attempts(test_user.id)
        count, cooldown = lockout.increment_failed_attempts(test_user.id)
        assert cooldown == 64

    def test_lockout_cooldown_capped(self, test_user):
        for _ in range(20):
            lockout.increment_failed_attempts(test_user.id)
        is_locked, remaining = lockout.is_account_locked(test_user.id)
        assert is_locked is True
        assert remaining <= 900

    def test_clear_failed_attempts(self, test_user):
        for _ in range(5):
            lockout.increment_failed_attempts(test_user.id)
        lockout.clear_failed_attempts(test_user.id)
        count = lockout.get_failed_attempts_count(test_user.id)
        assert count == 0

class TestMFA:

    def test_generate_totp_secret(self):
        secret = mfa.generate_totp_secret()
        assert len(secret) > 0
        assert isinstance(secret, str)

    def test_provisioning_uri(self):
        secret = mfa.generate_totp_secret()
        uri = mfa.get_totp_provisioning_uri('user@example.com', secret)
        assert 'otpauth://totp/' in uri
        assert 'user@example.com' in uri
        assert 'ForgeFlow' in uri

    def test_verify_totp_code(self):
        secret = mfa.generate_totp_secret()
        import pyotp
        totp = pyotp.TOTP(secret)
        code = totp.now()
        assert mfa.verify_totp_code(secret, code) is True
        assert mfa.verify_totp_code(secret, '000000') is False

    def test_generate_backup_codes(self):
        raw_codes, hashed_codes = mfa.generate_backup_codes(count=8)
        assert len(raw_codes) == 8
        assert len(hashed_codes) == 8
        for raw, hashed in zip(raw_codes, hashed_codes):
            assert raw != hashed

    def test_verify_backup_code(self):
        raw_codes, hashed_codes = mfa.generate_backup_codes(count=8)
        codes_json = json.dumps(hashed_codes)
        assert mfa.verify_backup_code(raw_codes[0], codes_json) is True
        assert mfa.verify_backup_code('INVALID00', codes_json) is False

    def test_consume_backup_code(self):
        raw_codes, hashed_codes = mfa.generate_backup_codes(count=8)
        codes_json = json.dumps(hashed_codes)
        updated_json = mfa.consume_backup_code(raw_codes[0], codes_json)
        assert mfa.verify_backup_code(raw_codes[0], updated_json) is False
        assert mfa.verify_backup_code(raw_codes[1], updated_json) is True

    def test_mfa_setup_flow(self, db, test_user):
        service = AuthService()
        setup_result = service.mfa_setup_start(test_user.id, db)
        assert 'secret' in setup_result
        assert 'provisioning_uri' in setup_result
        secret = setup_result['secret']
        import pyotp
        totp = pyotp.TOTP(secret)
        code = totp.now()
        complete_result = service.mfa_setup_verify(test_user.id, code, db)
        assert 'backup_codes' in complete_result
        assert len(complete_result['backup_codes']) == 8
        db.refresh(test_user)
        assert test_user.mfa_enabled is True
        assert test_user.mfa_secret is not None
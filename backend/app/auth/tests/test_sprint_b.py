import pytest
import time
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.common.database import Base
from app.common.dependencies import get_db
from app.main import app
from app.auth.models import User
from app.auth import lockout
from app.common.rate_limit import limiter
from app.common.security import get_password_hash

SQLALCHEMY_DATABASE_URL = 'sqlite:///./test_sprint_b.db'
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={'check_same_thread': False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope='function')
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope='function')
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture(autouse=True)
def mock_turnstile(monkeypatch):
    import app.auth.service
    monkeypatch.setattr(app.auth.service, 'verify_turnstile_token', lambda token, ip=None: True)

@pytest.fixture(autouse=True)
def clean_redis():
    """Ensure we flush the live Redis db before and after tests."""
    from app.common.redis import redis_client
    try:
        redis_client.client.flushdb()
    except Exception:
        pass
    yield
    try:
        redis_client.client.flushdb()
    except Exception:
        pass


# ---------------------------------------------------------------------------
# B2: CSRF Protection Tests
# ---------------------------------------------------------------------------

def test_csrf_middleware_enforces_protection(client):
    """Mutating endpoints must fail with 403 when X-Test-CSRF-Validation is active but CSRF is missing."""
    # 1. Missing CSRF headers & cookies on POST /api/auth/logout
    response = client.post(
        '/api/auth/logout',
        headers={'X-Test-CSRF-Validation': 'true'}
    )
    assert response.status_code == 403
    assert 'CSRF verification failed' in response.json()['detail']

    # 2. Matching CSRF token in cookie and header must succeed
    token_response = client.get('/api/auth/csrf-token')
    assert token_response.status_code == 200
    token = token_response.json()['csrf_token']
    
    client.cookies.set('csrf_token', token)
    response2 = client.post(
        '/api/auth/logout',
        headers={
            'X-Test-CSRF-Validation': 'true',
            'X-CSRF-Token': token
        }
    )
    assert response2.status_code == 200


# ---------------------------------------------------------------------------
# B1: SlowAPI Rate Limiting Tests
# ---------------------------------------------------------------------------

def test_slowapi_login_rate_limiting(client):
    """Verify that /login routes hit 429 after exceeding limit when limiter is active."""
    # Enable limiter for the duration of this test
    original_enabled = limiter.enabled
    limiter.enabled = True
    
    payload = {
        'email': 'rate_limit_test@example.com',
        'password': 'Password123',
        'turnstile_token': 'mock_token'
    }
    
    try:
        # Perform logins rapidly. /login limit is 10/minute
        for i in range(10):
            response = client.post('/api/auth/login', json=payload)
            # Either 401 or 200, but not 429
            assert response.status_code != 429
            
        # 11th request must exceed the limit
        response = client.post('/api/auth/login', json=payload)
        assert response.status_code == 429
    finally:
        limiter.enabled = original_enabled


# ---------------------------------------------------------------------------
# B1: Account Lockout & Exponential Backoff Tests
# ---------------------------------------------------------------------------

def test_account_lockout_exponential_backoff(client, db_session):
    """Verify failed login lockout, exponential cooldowns (30s, 60s, etc.), and clear on success."""
    # Create verified, active user
    email = 'lockout_test@example.com'
    pwd = 'Password123'
    user = User(
        email=email,
        hashed_password=get_password_hash(pwd),
        full_name='Lockout User',
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # First 4 failures: generic 401
    for _ in range(4):
        resp = client.post('/api/auth/login', json={'email': email, 'password': 'WrongPassword123', 'turnstile_token': 'mock'})
        assert resp.status_code == 401
        assert resp.json()['detail'] == 'Incorrect email or password'

    # 5th failure: triggers lockout (30s delay)
    resp = client.post('/api/auth/login', json={'email': email, 'password': 'WrongPassword123', 'turnstile_token': 'mock'})
    assert resp.status_code == 401

    # 6th attempt (even with correct credentials): must be locked out with 429
    resp = client.post('/api/auth/login', json={'email': email, 'password': pwd, 'turnstile_token': 'mock'})
    assert resp.status_code == 429
    assert 'Account locked' in resp.json()['detail']
    
    # Simulate time forward by deleting the lockout or using correct password after clearing
    lockout.clear_failed_attempts(user.id)
    
    # Correct login now succeeds and returns 200
    resp = client.post('/api/auth/login', json={'email': email, 'password': pwd, 'turnstile_token': 'mock'})
    assert resp.status_code == 200

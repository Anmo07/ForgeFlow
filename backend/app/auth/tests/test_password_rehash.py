import pytest
from passlib.context import CryptContext
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.auth.models import User
from app.common.database import Base
from app.common.dependencies import get_db
from app.main import app
SQLALCHEMY_DATABASE_URL = 'sqlite:///./test_legacy_rehash.db'
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

def test_legacy_bcrypt_rehashed_on_login(client, db_session):
    legacy_ctx = CryptContext(schemes=['bcrypt'], deprecated='auto')
    bcrypt_hash = legacy_ctx.hash('legacy-password')
    user = User(email='legacy@example.com', hashed_password=bcrypt_hash, full_name='Legacy User', is_active=True)
    db_session.add(user)
    db_session.commit()
    response = client.post('/api/auth/login', json={'email': 'legacy@example.com', 'password': 'legacy-password', 'turnstile_token': 'mock_token'})
    assert response.status_code == 200
    db_session.refresh(user)
    assert user.hashed_password.startswith('$argon2')
    assert not user.hashed_password.startswith('$2')
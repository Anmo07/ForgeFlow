import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.common.database import Base
from app.common.dependencies import get_db
from app.main import app
SQLALCHEMY_DATABASE_URL = 'sqlite:///./test.db'
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

def test_register_user(client):
    response = client.post('/api/auth/register', json={'email': 'testuser@example.com', 'password': 'strongpassword123', 'full_name': 'Test User', 'turnstile_token': 'mock_token'})
    assert response.status_code == 201
    data = response.json()
    assert data['email'] == 'testuser@example.com'
    assert data['full_name'] == 'Test User'
    assert 'id' in data
    assert data['is_active'] is True

def test_register_duplicate_user(client):
    payload = {'email': 'duplicate@example.com', 'password': 'strongpassword123', 'full_name': 'Duplicate User', 'turnstile_token': 'mock_token'}
    response1 = client.post('/api/auth/register', json=payload)
    assert response1.status_code == 201
    response2 = client.post('/api/auth/register', json=payload)
    assert response2.status_code == 400
    assert response2.json()['detail'] == 'User with this email already registered'

def test_login_user(client):
    client.post('/api/auth/register', json={'email': 'loginuser@example.com', 'password': 'secretpassword', 'full_name': 'Login User', 'turnstile_token': 'mock_token'})
    response = client.post('/api/auth/login', json={'email': 'loginuser@example.com', 'password': 'secretpassword', 'turnstile_token': 'mock_token'})
    assert response.status_code == 200
    data = response.json()
    assert 'access_token' in data
    assert 'refresh_token' in data
    assert data['token_type'] == 'bearer'

def test_login_user_incorrect_password(client):
    client.post('/api/auth/register', json={'email': 'wrongpwd@example.com', 'password': 'secretpassword', 'turnstile_token': 'mock_token'})
    response = client.post('/api/auth/login', json={'email': 'wrongpwd@example.com', 'password': 'wrongpassword', 'turnstile_token': 'mock_token'})
    assert response.status_code == 401
    assert response.json()['detail'] == 'Incorrect email or password'
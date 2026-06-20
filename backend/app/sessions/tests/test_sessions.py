import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
from app.common.database import Base
from app.common.dependencies import get_db, get_current_user
from app.auth.models import User
from app.sessions.models import Session as UserSession
from app.main import app
SQLALCHEMY_DATABASE_URL = 'sqlite:///./test_sessions_module.db'
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={'check_same_thread': False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope='function')
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    user = User(id=1, email='testsession@example.com', hashed_password='dummy_password_hash', full_name='Session User', is_active=True)
    db.add(user)
    db.commit()
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

    def override_get_current_user():
        return User(id=1, email='testsession@example.com', hashed_password='dummy_password_hash', full_name='Session User', is_active=True)
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield TestClient(app)
    app.dependency_overrides.clear()

def test_session_lifecycle(client, db_session):
    import hashlib
    ref_hash = hashlib.sha256('dummy_token'.encode()).hexdigest()
    db_sess = UserSession(user_id=1, refresh_token_hash=ref_hash, device_name='Chrome on macOS', expires_at=datetime.utcnow() + timedelta(days=30), revoked=False)
    db_session.add(db_sess)
    db_session.commit()
    db_session.refresh(db_sess)
    session_id = db_sess.id
    resp_list = client.get('/api/sessions/')
    assert resp_list.status_code == 200
    assert len(resp_list.json()) == 1
    assert resp_list.json()[0]['id'] == session_id
    resp_revoke = client.delete(f'/api/sessions/{session_id}')
    assert resp_revoke.status_code == 204
    resp_list_after = client.get('/api/sessions/')
    assert resp_list_after.status_code == 200
    assert len(resp_list_after.json()) == 0
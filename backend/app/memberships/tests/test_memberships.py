import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.common.database import Base
from app.common.dependencies import get_db, get_current_user
from app.auth.models import User
from app.main import app
SQLALCHEMY_DATABASE_URL = 'sqlite:///./test_memberships.db'
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={'check_same_thread': False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope='function')
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    user_admin = User(id=1, email='admin@example.com', hashed_password='dummy_admin_hash', full_name='Admin User', is_active=True)
    user_invited = User(id=2, email='invited@example.com', hashed_password='dummy_invited_hash', full_name='Invited User', is_active=True)
    db.add(user_admin)
    db.add(user_invited)
    from app.organizations.models import Organization
    from app.roles.models import Role
    org = Organization(id=1, name='Acme', slug='acme')
    role = Role(id=1, name='Admin', is_system=True)
    role_member = Role(id=2, name='Member', is_system=True)
    db.add(org)
    db.add(role)
    db.add(role_member)
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

    def override_get_current_user_admin():
        return User(id=1, email='admin@example.com', hashed_password='dummy_admin_hash', full_name='Admin User', is_active=True)
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user_admin
    yield TestClient(app)
    app.dependency_overrides.clear()

def test_membership_invite_and_role_change(client, db_session):
    resp_invite = client.post('/api/memberships/invite', json={'email': 'newuser@example.com', 'organization_id': 1, 'role_id': 2})
    assert resp_invite.status_code == 201
    data = resp_invite.json()
    assert data['status'] == 'invited'
    assert data['user']['email'] == 'newuser@example.com'
    membership_id = data['id']
    resp_role = client.put(f'/api/memberships/{membership_id}/role', json={'role_id': 1})
    assert resp_role.status_code == 200
    assert resp_role.json()['role_id'] == 1
    resp_list = client.get('/api/memberships/organization/1')
    assert resp_list.status_code == 200
    assert len(resp_list.json()) == 1
    assert any((m['id'] == membership_id for m in resp_list.json()))
    resp_del = client.delete(f'/api/memberships/{membership_id}')
    assert resp_del.status_code == 204

def test_membership_accept_invite(client, db_session):
    resp_invite = client.post('/api/memberships/invite', json={'email': 'invited@example.com', 'organization_id': 1, 'role_id': 2})
    membership_id = resp_invite.json()['id']

    def override_get_current_user_invited():
        return User(id=2, email='invited@example.com', hashed_password='dummy_invited_hash', full_name='Invited User', is_active=True)
    app.dependency_overrides[get_current_user] = override_get_current_user_invited
    resp_accept = client.post(f'/api/memberships/{membership_id}/accept')
    assert resp_accept.status_code == 200
    assert resp_accept.json()['status'] == 'active'
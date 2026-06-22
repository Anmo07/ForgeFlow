import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.common.database import Base
from app.common.dependencies import get_db, get_current_user
from app.auth.models import User
from app.main import app
SQLALCHEMY_DATABASE_URL = 'sqlite:///./test_apikeys.db'
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={'check_same_thread': False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope='function')
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    user = User(id=1, email='testapikey@example.com', hashed_password='dummy_apikey_hash', full_name='API Key Creator', is_active=True)
    db.add(user)
    from app.organizations.models import Organization
    org = Organization(id=1, name='Acme', slug='acme')
    db.add(org)
    from app.roles.models import Role
    admin_role = Role(id=1, name='Admin', description='Admin role')
    db.add(admin_role)
    from app.memberships.models import Membership
    mem = Membership(user_id=1, organization_id=1, role_id=1, status='active')
    db.add(mem)
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
        return User(id=1, email='testapikey@example.com', hashed_password='dummy_apikey_hash', full_name='API Key Creator', is_active=True)
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield TestClient(app)
    app.dependency_overrides.clear()

def test_api_key_lifecycle(client):
    resp_create = client.post('/api/api-keys/', json={'name': 'Live Web Client Key', 'organization_id': 1, 'permissions': ['project:create', 'project:view'], 'mode': 'live'})
    assert resp_create.status_code == 201
    data = resp_create.json()
    assert 'plain_key' in data
    assert data['key_prefix'] == 'ff_live_'
    assert data['name'] == 'Live Web Client Key'
    assert data['permissions'] == ['project:create', 'project:view']
    key_id = data['id']
    plain_key = data['plain_key']
    resp_rotate = client.post(f'/api/api-keys/{key_id}/rotate')
    assert resp_rotate.status_code == 200
    rotated_data = resp_rotate.json()
    assert 'plain_key' in rotated_data
    assert rotated_data['plain_key'] != plain_key
    assert 'Rotated' in rotated_data['name']
    resp_list = client.get('/api/api-keys/organization/1')
    assert resp_list.status_code == 200
    assert len(resp_list.json()) == 2
    new_key_id = rotated_data['id']
    resp_revoke = client.delete(f'/api/api-keys/{new_key_id}')
    assert resp_revoke.status_code == 204
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.common.database import Base
from app.common.dependencies import get_db
from app.main import app
SQLALCHEMY_DATABASE_URL = 'sqlite:///./test_roles.db'
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

def test_roles_and_permissions(client):
    p_resp = client.post('/api/permissions/', json={'name': 'project:create', 'description': 'Create projects'})
    assert p_resp.status_code == 201
    perm_id = p_resp.json()['id']
    r_resp = client.post('/api/roles/', json={'name': 'Custom PM', 'description': 'Custom project manager', 'organization_id': 1, 'permission_ids': [perm_id]})
    assert r_resp.status_code == 201
    role_id = r_resp.json()['id']
    assert r_resp.json()['name'] == 'Custom PM'
    assert len(r_resp.json()['permissions']) == 1
    assert r_resp.json()['permissions'][0]['name'] == 'project:create'
    update_resp = client.put(f'/api/roles/{role_id}', json={'name': 'Senior PM'})
    assert update_resp.status_code == 200
    assert update_resp.json()['name'] == 'Senior PM'
    del_resp = client.delete(f'/api/roles/{role_id}')
    assert del_resp.status_code == 204

def test_system_role_protection(client):
    from app.roles.models import Role
    db = TestingSessionLocal()
    sys_role = Role(name='Owner', description='Owner', is_system=True)
    db.add(sys_role)
    db.commit()
    db.refresh(sys_role)
    role_id = sys_role.id
    db.close()
    r1 = client.put(f'/api/roles/{role_id}', json={'name': 'New Owner'})
    assert r1.status_code == 400
    assert 'Cannot modify system roles' in r1.json()['detail']
    r2 = client.delete(f'/api/roles/{role_id}')
    assert r2.status_code == 400
    assert 'Cannot delete system roles' in r2.json()['detail']
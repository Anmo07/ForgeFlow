import pytest
from fastapi import APIRouter, Depends
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.common.database import Base
from app.common.dependencies import get_db, get_current_user
from app.common.tenant import get_current_tenant, require_permission, TenantContext
from app.auth.models import User
from app.organizations.models import Organization
from app.memberships.models import Membership
from app.roles.models import Role
from app.permissions.models import Permission
from app.main import app
test_router = APIRouter()

@test_router.get('/test-tenant')
def get_tenant_endpoint(tenant: TenantContext=Depends(get_current_tenant)):
    return {'org_id': tenant.organization_id, 'user_id': tenant.user_id}

@test_router.get('/test-permission')
def get_permission_endpoint(tenant: TenantContext=Depends(require_permission('project:create'))):
    return {'success': True}
app.include_router(test_router, prefix='/api/test-only')
SQLALCHEMY_DATABASE_URL = 'sqlite:///./test_tenant_mw.db'
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={'check_same_thread': False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope='function')
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    user = User(id=1, email='tenantuser@example.com', hashed_password='dummy_tenant_hash', full_name='Tenant Member', is_active=True)
    db.add(user)
    org = Organization(id=1, name='Tenant Org', slug='tenant-org')
    db.add(org)
    perm = Permission(id=1, name='project:create', description='Create projects')
    db.add(perm)
    role = Role(id=1, name='Admin', is_system=True)
    role.permissions.append(perm)
    db.add(role)
    mem = Membership(id=1, user_id=1, organization_id=1, role_id=1, status='active')
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
        return User(id=1, email='tenantuser@example.com', hashed_password='dummy_tenant_hash', full_name='Tenant Member', is_active=True)
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield TestClient(app)
    app.dependency_overrides.clear()

def test_tenant_extraction_header_success(client):
    response = client.get('/api/test-only/test-tenant', headers={'X-Organization-ID': '1'})
    assert response.status_code == 200
    assert response.json()['org_id'] == 1
    assert response.json()['user_id'] == 1

def test_tenant_extraction_missing_header(client):
    response = client.get('/api/test-only/test-tenant')
    assert response.status_code == 400
    assert 'Missing organization context' in response.json()['detail']

def test_tenant_extraction_not_member(client):
    response = client.get('/api/test-only/test-tenant', headers={'X-Organization-ID': '999'})
    assert response.status_code == 403
    assert 'active membership' in response.json()['detail']

def test_permission_required_success(client):
    response = client.get('/api/test-only/test-permission', headers={'X-Organization-ID': '1'})
    assert response.status_code == 200
    assert response.json()['success'] is True

def test_permission_required_failure(client, db_session):
    from app.roles.models import Role
    db_session.add(Role(id=2, name='Viewer', is_system=True))
    db_session.query(Membership).filter(Membership.id == 1).update({'role_id': 2})
    db_session.commit()
    response = client.get('/api/test-only/test-permission', headers={'X-Organization-ID': '1'})
    assert response.status_code == 403
    assert 'Missing required permission' in response.json()['detail']
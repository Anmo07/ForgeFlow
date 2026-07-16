import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.auth.models import User
from app.organizations.models import Organization
from app.memberships.models import Membership
from app.projects.models import Project
from app.roles.models import Role
from app.common.database import SessionLocal, Base, engine
from app.auth import csrf
from app.memberships import invite_token
from app.common.redis import redis_client

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    connection = SessionLocal()
    yield connection
    connection.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(autouse=True)
def clear_redis():
    redis_client.flushdb()
    yield
    redis_client.flushdb()

@pytest.fixture
def org_a(db):
    org = Organization(name='Org A', slug='org-a')
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

@pytest.fixture
def org_b(db):
    org = Organization(name='Org B', slug='org-b')
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

@pytest.fixture
def user_a(db, org_a):
    from app.common.security import get_password_hash
    user = User(email='usera@example.com', hashed_password=get_password_hash('Password123'), full_name='User A', is_active=True, is_verified=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    admin_role = db.query(Role).first()
    if not admin_role:
        admin_role = Role(id=1, name='Admin', is_system=True)
        db.add(admin_role)
        db.commit()
    mem = Membership(user_id=user.id, organization_id=org_a.id, role_id=admin_role.id, status='active')
    db.add(mem)
    db.commit()
    return user

@pytest.fixture
def user_b(db, org_b):
    from app.common.security import get_password_hash
    user = User(email='userb@example.com', hashed_password=get_password_hash('Password123'), full_name='User B', is_active=True, is_verified=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    admin_role = db.query(Role).first()
    if not admin_role:
        admin_role = Role(id=1, name='Admin', is_system=True)
        db.add(admin_role)
        db.commit()
    mem = Membership(user_id=user.id, organization_id=org_b.id, role_id=admin_role.id, status='active')
    db.add(mem)
    db.commit()
    return user

class TestCSRFProtection:

    def test_csrf_token_generation(self, client):
        response = client.get('/api/auth/csrf-token')
        assert response.status_code == 200
        assert 'csrf_token' in response.json()
        assert len(response.json()['csrf_token']) > 20

    def test_csrf_token_cookie_set(self, client):
        response = client.get('/api/auth/csrf-token')
        assert response.status_code == 200
        cookies = response.cookies
        assert 'csrf_token' in cookies

    def test_csrf_token_validation(self):
        token = csrf.generate_csrf_token()
        assert len(token) > 20
        assert csrf.validate_csrf_token(token) is True
        assert csrf.validate_csrf_token('') is False
        assert csrf.validate_csrf_token('short') is False

class TestTenantIsolation:

    def test_user_cannot_access_other_org_projects(self, db, user_a, user_b, org_a, org_b):
        from app.projects.repository import ProjectRepository
        project_b = Project(organization_id=org_b.id, name='Org B Project', description='Should not be visible to User A')
        db.add(project_b)
        db.commit()
        db.refresh(project_b)
        repo = ProjectRepository()
        projects = repo.list_by_org(db, org_id=org_a.id)
        assert len(projects) == 0
        projects_b = repo.list_by_org(db, org_id=org_b.id)
        assert len(projects_b) == 1

    def test_tenant_context_extraction(self, db, user_a, org_a):
        from app.common.tenant import get_tenant_context
        context = get_tenant_context(db, user_a, org_a.id)
        assert context == org_a.id

    def test_tenant_context_prevents_cross_org_access(self, db, user_a, org_a, org_b):
        from app.common.tenant import get_tenant_context
        try:
            context = get_tenant_context(db, user_a, org_b.id)
            assert False, 'Should have raised HTTPException'
        except Exception as e:
            assert '403' in str(e) or 'Forbidden' in str(e) or 'Access denied' in str(e)

class TestInviteTokens:

    def test_generate_invite_token(self):
        raw_token, token_hash = invite_token.generate_invite_token()
        assert len(raw_token) > 20
        assert len(token_hash) == 64
        assert raw_token != token_hash

    def test_store_and_validate_invite_token(self):
        raw_token, token_hash = invite_token.generate_invite_token()
        invite_token.store_invite_token(token_hash=token_hash, org_id=1, invited_email='test@example.com', role_id=1, invited_by_user_id=1)
        metadata = invite_token.validate_invite_token(raw_token)
        assert metadata is not None
        assert metadata['email'] == 'test@example.com'
        assert int(metadata['org_id']) == 1
        assert int(metadata['role_id']) == 1

    def test_invite_token_expiry(self):
        raw_token, token_hash = invite_token.generate_invite_token()
        invite_token.store_invite_token(token_hash=token_hash, org_id=1, invited_email='test@example.com', role_id=1, invited_by_user_id=1, ttl_seconds=1)
        metadata = invite_token.validate_invite_token(raw_token)
        assert metadata is not None
        import time
        time.sleep(2)
        metadata = invite_token.validate_invite_token(raw_token)
        assert metadata is None

    def test_invite_token_one_time_use(self):
        raw_token, token_hash = invite_token.generate_invite_token()
        invite_token.store_invite_token(token_hash=token_hash, org_id=1, invited_email='test@example.com', role_id=1, invited_by_user_id=1)
        invite_token.consume_invite_token(raw_token)
        metadata = invite_token.validate_invite_token(raw_token)
        assert metadata is None

    def test_has_pending_invite(self):
        raw_token, token_hash = invite_token.generate_invite_token()
        assert invite_token.has_pending_invite('test@example.com', 1) is False
        invite_token.store_invite_token(token_hash=token_hash, org_id=1, invited_email='test@example.com', role_id=1, invited_by_user_id=1)
        assert invite_token.has_pending_invite('test@example.com', 1) is True
        assert invite_token.has_pending_invite('test@example.com', 2) is False

class TestInviteEndpoints:

    def test_send_invite_returns_generic_response(self, client, user_a, org_a):
        login_response = client.post('/api/auth/login', json={'email': user_a.email, 'password': 'Password123', 'turnstile_token': '1x0000000000000000000000000000000AA'})
        assert login_response.status_code == 200
        invite_response = client.post('/api/memberships/send-invite', json={'email': 'nonexistent@example.com', 'organization_id': org_a.id, 'role_id': 1})
        assert invite_response.status_code == 200
        assert invite_response.json()['invite_sent'] is True
        assert 'exist' in invite_response.json()['message'].lower() or 'sent' in invite_response.json()['message'].lower()
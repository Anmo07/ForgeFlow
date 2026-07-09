import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import MagicMock
from app.common.database import Base, engine, set_postgresql_rls_context
from app.common.dependencies import get_db
from app.main import app
from app.auth.models import User
from app.organizations.models import Organization
from app.memberships.models import Membership
from app.roles.models import Role
from app.projects.models import Project, Task
from app.crm.models import Client, Lead, Deal
from app.invoices.models import Invoice
from app.common.security import get_password_hash
from datetime import date

SQLALCHEMY_DATABASE_URL = 'sqlite:///./test_sprint_d.db'
test_engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={'check_same_thread': False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope='function')
def db_session():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    
    # Initialize basic Roles
    admin_role = Role(id=1, name='Admin', is_system=True)
    
    from app.permissions.models import Permission
    p1 = Permission(id=1, name='project:update')
    p2 = Permission(id=2, name='client:update')
    p3 = Permission(id=3, name='invoice:create')
    
    admin_role.permissions.append(p1)
    admin_role.permissions.append(p2)
    admin_role.permissions.append(p3)
    
    db.add(admin_role)
    db.commit()
    
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)

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
def reset_context_vars():
    from app.common.tenant_filtering import current_org_id, current_is_external, show_deleted
    current_org_id.set(None)
    current_is_external.set(False)
    show_deleted.set(False)
    yield
    current_org_id.set(None)
    current_is_external.set(False)
    show_deleted.set(False)


# ---------------------------------------------------------------------------
# D1: Row-Level Security Listener Unit Test
# ---------------------------------------------------------------------------

def test_postgresql_rls_context_setter():
    """Verify that SET LOCAL app.current_org_id is called on PostgreSQL connections."""
    mock_conn = MagicMock()
    mock_conn.dialect.name = 'postgresql'
    
    from app.common.tenant_filtering import current_org_id
    current_org_id.set(999)
    
    set_postgresql_rls_context(None, None, mock_conn)
    
    # Assert connection executed SET LOCAL query
    assert mock_conn.execute.called
    called_sql = str(mock_conn.execute.call_args[0][0])
    assert "SET LOCAL app.current_org_id" in called_sql
    assert mock_conn.execute.call_args[0][1]["org_id"] == "999"


# ---------------------------------------------------------------------------
# D2: Version-Based Optimistic Locking Tests
# ---------------------------------------------------------------------------

def test_task_optimistic_locking(client, db_session):
    """Verify that Task updates check and increment the version, raising 409 on mismatch."""
    # 1. Setup user, org, project, and task
    email = 'locking_user@example.com'
    pwd = 'Password123'
    user = User(email=email, hashed_password=get_password_hash(pwd), full_name='Locker', is_active=True, is_verified=True)
    db_session.add(user)
    db_session.commit()

    org = Organization(name='Lock Org', slug='lock-org')
    db_session.add(org)
    db_session.commit()

    mem = Membership(user_id=user.id, organization_id=org.id, role_id=1, status='active')
    db_session.add(mem)
    
    proj = Project(organization_id=org.id, name='Test Proj')
    db_session.add(proj)
    db_session.commit()

    task = Task(project_id=proj.id, title='Test Task', version=1)
    db_session.add(task)
    db_session.commit()

    # Log in
    login_resp = client.post('/api/auth/login', json={'email': email, 'password': pwd, 'turnstile_token': 'mock'})
    assert login_resp.status_code == 200
    
    print("USER ID:", user.id)
    print("ORG ID:", org.id)
    print("MEMBERSHIP:", mem.user_id, mem.organization_id, mem.status)
    
    # 2. Update task with correct version (1) -> should succeed and bump to 2
    headers = {'X-Organization-ID': str(org.id)}
    resp = client.put(
        f'/api/v1/projects/{proj.id}/tasks/{task.id}',
        json={'title': 'Updated Title', 'version': 1},
        headers=headers
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()['version'] == 2

    # 3. Update task with outdated version (1 again) -> should return 409 conflict
    resp = client.put(
        f'/api/v1/projects/{proj.id}/tasks/{task.id}',
        json={'title': 'Stale Title Update', 'version': 1},
        headers=headers
    )
    assert resp.status_code == 409
    assert "Conflict" in resp.json()['detail']


def test_deal_optimistic_locking(client, db_session):
    """Verify that Deal updates check and increment the version, raising 409 on mismatch."""
    email = 'crm_locker@example.com'
    pwd = 'Password123'
    user = User(email=email, hashed_password=get_password_hash(pwd), full_name='CRM Locker', is_active=True, is_verified=True)
    db_session.add(user)
    db_session.commit()

    org = Organization(name='CRM Lock Org', slug='crm-lock-org')
    db_session.add(org)
    db_session.commit()

    mem = Membership(user_id=user.id, organization_id=org.id, role_id=1, status='active')
    db_session.add(mem)
    
    c = Client(organization_id=org.id, name='Test Client')
    db_session.add(c)
    db_session.commit()

    lead = Lead(organization_id=org.id, client_id=c.id, value=100.0)
    db_session.add(lead)
    db_session.commit()

    deal = Deal(organization_id=org.id, lead_id=lead.id, name='Test Deal', version=1)
    db_session.add(deal)
    db_session.commit()

    # Log in
    client.post('/api/auth/login', json={'email': email, 'password': pwd, 'turnstile_token': 'mock'})

    # Update with correct version
    headers = {'X-Organization-ID': str(org.id)}
    resp = client.put(f'/api/crm/deals/{deal.id}', json={'name': 'Updated Deal', 'version': 1}, headers=headers)
    assert resp.status_code == 200, resp.text
    assert resp.json()['version'] == 2

    # Update with outdated version (1)
    resp = client.put(f'/api/crm/deals/{deal.id}', json={'name': 'Outdated Deal', 'version': 1}, headers=headers)
    assert resp.status_code == 409


# ---------------------------------------------------------------------------
# D3: Invoice Idempotency Key Tests
# ---------------------------------------------------------------------------

def test_invoice_idempotency(client, db_session):
    """Verify that duplicate invoice creation requests with same Idempotency-Key return cached result."""
    email = 'inv_user@example.com'
    pwd = 'Password123'
    user = User(email=email, hashed_password=get_password_hash(pwd), full_name='Invoice Admin', is_active=True, is_verified=True)
    db_session.add(user)
    db_session.commit()

    org = Organization(name='Invoice Org', slug='invoice-org')
    db_session.add(org)
    db_session.commit()

    mem = Membership(user_id=user.id, organization_id=org.id, role_id=1, status='active')
    db_session.add(mem)
    db_session.commit()

    # Log in
    client.post('/api/auth/login', json={'email': email, 'password': pwd, 'turnstile_token': 'mock'})

    invoice_payload = {
        "invoice_number": "INV-2026-001",
        "issue_date": str(date.today()),
        "due_date": str(date.today()),
        "subtotal": 100.0,
        "tax_rate": 0.1,
        "tax_amount": 10.0,
        "total": 110.0,
        "line_items": [
            {
                "description": "Consulting Services",
                "quantity": 1.0,
                "unit_price": 100.0,
                "amount": 100.0
            }
        ]
    }
    
    headers = {
        'X-Organization-ID': str(org.id),
        'Idempotency-Key': 'unique_key_123'
    }

    # 1. First request
    resp1 = client.post('/api/invoices', json=invoice_payload, headers=headers)
    assert resp1.status_code == 201, resp1.text
    invoice_id = resp1.json()['id']

    # 2. Second request with same idempotency key
    resp2 = client.post('/api/invoices', json=invoice_payload, headers=headers)
    assert resp2.status_code == 201, resp2.text
    assert resp2.json()['id'] == invoice_id

    # Verify only 1 invoice exists in the DB
    invoices = db_session.query(Invoice).filter(Invoice.organization_id == org.id).all()
    assert len(invoices) == 1


# ---------------------------------------------------------------------------
# D4: strict Pagination Limit Tests
# ---------------------------------------------------------------------------

def test_pagination_limit_enforced(client, db_session):
    """Verify that requests requesting a page size (limit) > 100 return 400 Bad Request."""
    email = 'pagination_user@example.com'
    pwd = 'Password123'
    user = User(email=email, hashed_password=get_password_hash(pwd), full_name='Paginator', is_active=True, is_verified=True)
    db_session.add(user)
    db_session.commit()

    org = Organization(name='Pagination Org', slug='pagination-org')
    db_session.add(org)
    db_session.commit()

    mem = Membership(user_id=user.id, organization_id=org.id, role_id=1, status='active')
    db_session.add(mem)
    db_session.commit()

    # Log in
    client.post('/api/auth/login', json={'email': email, 'password': pwd, 'turnstile_token': 'mock'})

    # Request limit > 100
    headers = {'X-Organization-ID': str(org.id)}
    resp = client.get('/api/projects?limit=101', headers=headers)
    assert resp.status_code == 400, resp.text
    assert "Maximum page size is 100" in resp.json()['detail']

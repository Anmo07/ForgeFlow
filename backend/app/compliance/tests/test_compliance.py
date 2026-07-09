import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.common.database import Base
from app.common.dependencies import get_db
from app.main import app
from app.auth.models import User
from app.organizations.models import Organization
from app.memberships.models import Membership
from app.roles.models import Role
from app.activity_logs.models import ActivityLog
from app.common.security import get_password_hash
from unittest.mock import patch

SQLALCHEMY_DATABASE_URL = 'sqlite:///./test_compliance.db'
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={'check_same_thread': False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope='function')
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Initialize basic Roles
    admin_role = Role(id=1, name='Admin', is_system=True)
    member_role = Role(id=2, name='Member', is_system=True)
    db.add(admin_role)
    db.add(member_role)
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
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture(autouse=True)
def mock_turnstile(monkeypatch):
    import app.auth.service
    monkeypatch.setattr(app.auth.service, 'verify_turnstile_token', lambda token, ip=None: True)


# ---------------------------------------------------------------------------
# C2: Audit Log Immutability Tests
# ---------------------------------------------------------------------------

def test_activity_log_immutability(db_session):
    """Verify that update or delete operations on ActivityLog raise a RuntimeError."""
    log_entry = ActivityLog(
        action="test_action",
        entity_type="user",
        entity_id=1,
        ip_address="127.0.0.1"
    )
    db_session.add(log_entry)
    db_session.commit()
    db_session.refresh(log_entry)

    # 1. Test Update throws error
    log_entry.action = "updated_action"
    with pytest.raises(RuntimeError) as exc:
        db_session.commit()
    assert "immutable and cannot be updated" in str(exc.value)
    
    db_session.rollback()

    # 2. Test Delete throws error
    db_session.delete(log_entry)
    with pytest.raises(RuntimeError) as exc:
        db_session.commit()
    assert "immutable and cannot be deleted" in str(exc.value)


# ---------------------------------------------------------------------------
# C3: User & Organization Data Export Tests
# ---------------------------------------------------------------------------

def test_export_endpoints(client, db_session):
    """Test user and org data export compliance routes."""
    # 1. Setup user, org, and membership
    email = 'compliance_user@example.com'
    pwd = 'Password123'
    user = User(
        email=email,
        hashed_password=get_password_hash(pwd),
        full_name='Compliance User',
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()

    org = Organization(name='Compliance Org', slug='compliance-org')
    db_session.add(org)
    db_session.commit()

    mem = Membership(user_id=user.id, organization_id=org.id, role_id=1, status='active')
    db_session.add(mem)
    db_session.commit()

    # 2. Login to obtain session cookies
    login_resp = client.post('/api/auth/login', json={'email': email, 'password': pwd, 'turnstile_token': 'mock'})
    assert login_resp.status_code == 200

    # 3. User Export
    user_export = client.get('/api/v1/compliance/export/user')
    assert user_export.status_code == 200
    u_data = user_export.json()
    assert u_data['email'] == email
    assert len(u_data['memberships']) == 1
    assert u_data['memberships'][0]['role'] == 'Admin'

    # 4. Organization Export (requires X-Organization-ID header)
    org_export = client.get(
        '/api/v1/compliance/export/organization',
        headers={'X-Organization-ID': str(org.id)}
    )
    assert org_export.status_code == 200
    o_data = org_export.json()
    assert o_data['name'] == 'Compliance Org'
    assert len(o_data['memberships']) == 1


# ---------------------------------------------------------------------------
# C4: Anonymization Tests
# ---------------------------------------------------------------------------

def test_user_pii_anonymization(client, db_session):
    """Verify that anonymizing a user wipes identifying fields but retains the database record."""
    email = 'anonymize_me@example.com'
    pwd = 'Password123'
    user = User(
        email=email,
        hashed_password=get_password_hash(pwd),
        full_name='To Be Anonymized',
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()

    # Log in
    login_resp = client.post('/api/auth/login', json={'email': email, 'password': pwd, 'turnstile_token': 'mock'})
    assert login_resp.status_code == 200

    # Request Account Anonymization (Closure)
    resp = client.post('/api/v1/compliance/user/anonymize')
    assert resp.status_code == 200
    assert "successfully closed and anonymized" in resp.json()['message']

    # Query DB to check changes
    db_session.refresh(user)
    assert user.email == f"anonymized_{user.id}@forgeflow.internal"
    assert user.full_name == "Anonymized User"
    assert user.hashed_password == "ANONYMIZED_PASSWORD_HASH"
    assert user.is_active is False
    assert user.is_verified is False


# ---------------------------------------------------------------------------
# C5: Breach Incident Reporting Tests
# ---------------------------------------------------------------------------

@patch('app.common.celery_tasks.notify_breach_task.delay')
def test_breach_incident_reporting(mock_celery_delay, client, db_session):
    """Verify that submitting a breach report schedules the Celery notification task."""
    email = 'admin@example.com'
    pwd = 'Password123'
    user = User(
        email=email,
        hashed_password=get_password_hash(pwd),
        full_name='Admin Compliance User',
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()

    org = Organization(name='Breach Org', slug='breach-org')
    db_session.add(org)
    db_session.commit()

    mem = Membership(user_id=user.id, organization_id=org.id, role_id=1, status='active')
    db_session.add(mem)
    db_session.commit()

    # Log in
    login_resp = client.post('/api/auth/login', json={'email': email, 'password': pwd, 'turnstile_token': 'mock'})
    assert login_resp.status_code == 200

    # Submit breach report
    payload = {
        "incident_description": "Suspected breach due to data anomaly in logs.",
        "affected_organizations": [org.id]
    }
    resp = client.post(
        '/api/v1/compliance/breach-report',
        json=payload,
        headers={'X-Organization-ID': str(org.id)}
    )
    assert resp.status_code == 200
    assert "submitted" in resp.json()['message']
    
    # Assert Celery task was scheduled
    mock_celery_delay.assert_called_once_with([org.id], "Suspected breach due to data anomaly in logs.")

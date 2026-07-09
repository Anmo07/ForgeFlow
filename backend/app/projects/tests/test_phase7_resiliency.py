import pytest
import os
import hmac
import hashlib
import json
import base64
import subprocess
from datetime import date, datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.common.database import Base
from app.common.dependencies import get_db, get_current_user
from app.common.tenant import get_current_tenant, TenantContext
from app.common.tenant_filtering import current_org_id, current_is_external, show_deleted
from app.auth.models import User
from app.auth.sso_models import SSOConfiguration
from app.organizations.models import Organization
from app.memberships.models import Membership
from app.roles.models import Role
from app.permissions.models import Permission
from app.projects.models import Project, Task
from app.invoices.models import Invoice, InvoiceLineItem
from app.attachments.models import Attachment
from app.events.models import EventOutbox
from app.notifications.models import Notification
from app.security.models import SecurityEvent
from app.billing.models import BillingContract, TaskTimeLog, ContractType
from app.billing.service import BillingService
from app.ingress.tasks import process_inbound_email_task
from app.common.celery_app import celery_app
from app.main import app

from app.common.database import Base, engine, SessionLocal

# Configure Celery in eager mode for synchronous execution in tests
celery_app.conf.task_always_eager = True

@pytest.fixture(autouse=True)
def mock_minio(monkeypatch):
    """Autouse fixture to mock MinIO client methods during tests."""
    from unittest.mock import MagicMock
    from app.common.minio import minio_client
    
    mock_client = MagicMock()
    monkeypatch.setattr(minio_client, "_client", mock_client)
    monkeypatch.setattr(minio_client, "upload_bytes", MagicMock(return_value=True))
    monkeypatch.setattr(minio_client, "delete_file", MagicMock(return_value=True))

@pytest.fixture(scope='function')
def db_session():
    # Setup test DB tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Initialize basic orgs
    # MSP Org
    msp_org = Organization(id=1, name='MSP Provider', slug='msp-provider')
    # Client Orgs
    client_a = Organization(id=2, name='Client A Corp', slug='client-a')
    client_b = Organization(id=3, name='Client B Corp', slug='client-b')
    db.add_all([msp_org, client_a, client_b])
    
    # Initialize users
    msp_user = User(id=1, email='staff@msp.com', hashed_password='dummy', full_name='MSP Admin', is_active=True, is_external=False)
    client_a_user = User(id=2, email='user@client-a.com', hashed_password='dummy', full_name='Client A Contact', is_active=True, is_external=True)
    client_b_user = User(id=3, email='user@client-b.com', hashed_password='dummy', full_name='Client B Contact', is_active=True, is_external=True)
    db.add_all([msp_user, client_a_user, client_b_user])
    
    # Assign memberships
    p_create = Permission(id=1, name='project:create', description='Create')
    p_read = Permission(id=2, name='project:read', description='Read')
    db.add_all([p_create, p_read])
    
    role = Role(id=1, name='Role Lead', is_system=True)
    role.permissions.extend([p_create, p_read])
    db.add(role)
    
    mem_msp = Membership(id=1, user_id=1, organization_id=1, role_id=1, status='active', is_external=False)
    mem_client_a = Membership(id=2, user_id=2, organization_id=2, role_id=1, status='active', is_external=True)
    mem_client_b = Membership(id=3, user_id=3, organization_id=3, role_id=1, status='active', is_external=True)
    db.add_all([mem_msp, mem_client_a, mem_client_b])
    
    db.commit()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope='function')
def client(db_session):
    # Setup FastAPI client with overrides
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
    
    # Reset context vars
    current_org_id.set(None)
    current_is_external.set(False)
    show_deleted.set(False)


def test_client_isolation(client, db_session):
    """Assert external client user queries are isolated by client_organization_id,
    and internal MSP staff can view all projects in their tenant.
    """
    # Create test projects
    p_msp = Project(organization_id=1, client_organization_id=None, name="Internal MSP Project")
    p_client_a = Project(organization_id=1, client_organization_id=2, name="Client A Project")
    p_client_b = Project(organization_id=1, client_organization_id=3, name="Client B Project")
    db_session.add_all([p_msp, p_client_a, p_client_b])
    db_session.commit()

    # Case 1: MSP Staff (Internal)
    current_org_id.set(1)
    current_is_external.set(False)
    projects = db_session.query(Project).all()
    # Internal staff should see all projects owned by organization_id == 1
    assert len(projects) == 3
    assert any(p.name == "Internal MSP Project" for p in projects)
    assert any(p.name == "Client A Project" for p in projects)
    assert any(p.name == "Client B Project" for p in projects)

    # Case 2: Client A (External)
    current_org_id.set(2)
    current_is_external.set(True)
    projects_a = db_session.query(Project).all()
    # External client user from org 2 should only see projects where client_organization_id == 2
    assert len(projects_a) == 1
    assert projects_a[0].name == "Client A Project"

    # Case 3: Client B (External)
    current_org_id.set(3)
    current_is_external.set(True)
    projects_b = db_session.query(Project).all()
    # External client user from org 3 should only see projects where client_organization_id == 3
    assert len(projects_b) == 1
    assert projects_b[0].name == "Client B Project"


def test_soft_deletes_filtering(client, db_session):
    """Verify deleted records are hidden by default from queries,
    but visible when overriding the filter using show_deleted.
    """
    p_active = Project(organization_id=1, name="Active Project")
    p_deleted = Project(organization_id=1, name="Deleted Project", deleted_at=datetime.utcnow())
    db_session.add_all([p_active, p_deleted])
    db_session.commit()

    # By default, deleted_at IS NULL applies
    current_org_id.set(1)
    current_is_external.set(False)
    show_deleted.set(False)
    
    projects = db_session.query(Project).all()
    assert len(projects) == 1
    assert projects[0].name == "Active Project"

    # When show_deleted is overridden to True
    show_deleted.set(True)
    all_projects = db_session.query(Project).all()
    assert len(all_projects) == 2
    assert any(p.name == "Deleted Project" for p in all_projects)


def test_billing_calculations(db_session):
    """Assert dynamic seat counts and aggregated time logs produce
    the exact expected subtotal and line items on the billing engine.
    """
    # Define Billing Contracts
    # 1. Fixed Retainer
    contract_fixed = BillingContract(
        organization_id=1,
        client_organization_id=2,
        contract_type=ContractType.FIXED_RETAINER,
        rate=1200.0,
        is_active=True
    )
    
    # 2. Per Seat
    contract_per_seat = BillingContract(
        organization_id=1,
        client_organization_id=2,
        contract_type=ContractType.PER_SEAT,
        rate=50.0,
        is_active=True
    )
    
    # 3. Time & Material
    contract_tm = BillingContract(
        organization_id=1,
        client_organization_id=2,
        contract_type=ContractType.TIME_AND_MATERIAL,
        rate=100.0,
        is_active=True,
        billing_cycle_start=date.today() - timedelta(days=7),
        billing_cycle_end=date.today() + timedelta(days=7)
    )
    db_session.add_all([contract_fixed, contract_per_seat, contract_tm])
    db_session.commit()

    # Add Task & TaskTimeLogs for Client A (client_organization_id = 2)
    proj = Project(organization_id=1, client_organization_id=2, name="Billing Project")
    db_session.add(proj)
    db_session.commit()
    
    task = Task(project_id=proj.id, client_organization_id=2, title="Billing Task")
    db_session.add(task)
    db_session.commit()
    
    # Log billable hours
    log1 = TaskTimeLog(task_id=task.id, user_id=1, hours=4.5, description="Work part 1")
    log2 = TaskTimeLog(task_id=task.id, user_id=1, hours=3.5, description="Work part 2")
    db_session.add_all([log1, log2])
    db_session.commit()

    billing_service = BillingService()

    # Verify FIXED_RETAINER
    res_fixed = billing_service.calculate_contract_billing(db_session, contract_fixed)
    assert res_fixed["subtotal"] == 1200.0
    assert res_fixed["quantity"] == 1.0

    # Verify PER_SEAT (Client A has 1 active external membership in db_session setup: User ID 2)
    res_seat = billing_service.calculate_contract_billing(db_session, contract_per_seat)
    assert res_seat["quantity"] == 1.0  # User ID 2 is external
    assert res_seat["subtotal"] == 50.0

    # Verify TIME_AND_MATERIAL (4.5 + 3.5 = 8 hours logged)
    res_tm = billing_service.calculate_contract_billing(db_session, contract_tm)
    assert res_tm["quantity"] == 8.0
    assert res_tm["subtotal"] == 800.0

    # Generate draft invoices
    invoice_count = billing_service.run_billing_cycle(db_session)
    assert invoice_count == 3
    
    # Verify invoice drafted in DB
    invoices = db_session.query(Invoice).filter(Invoice.client_organization_id == 2).all()
    assert len(invoices) == 3
    draft_invoice = db_session.query(Invoice).filter(
        Invoice.client_organization_id == 2,
        Invoice.subtotal == 800.0
    ).first()
    assert draft_invoice is not None
    assert len(draft_invoice.line_items) == 1
    assert draft_invoice.line_items[0].unit_price == 100.0


def test_ingress_email_webhook(client, db_session, monkeypatch):
    """Test cryptographic signature validation and Inbound Email webhook routing."""
    secret = "test_webhook_secret"
    os.environ["INGRESS_EMAIL_SECRET"] = secret

    # Mock the scan & promotion task to prevent synchronous execution during this test
    from unittest.mock import MagicMock
    mock_scan_task = MagicMock()
    monkeypatch.setattr("app.attachments.tasks.scan_and_promote_attachment_task.delay", mock_scan_task)

    payload = {
        "from": "Support Ticket <tickets@client-a.com>",
        "subject": "Email Ingress Outage",
        "text": "The main email ingress pipeline is down.",
        "attachments": [
            {
                "filename": "logs.pdf",
                "content": base64.b64encode(b"Traceback log content").decode("utf-8"),
                "content_type": "application/pdf"
            }
        ]
    }
    body = json.dumps(payload).encode("utf-8")
    
    # 1. Send with invalid signature
    response_invalid = client.post(
        "/api/v1/ingress/email",
        content=body,
        headers={"X-Signature": "invalid_sig", "Content-Type": "application/json"}
    )
    assert response_invalid.status_code == 401

    # 2. Send with valid signature
    sig = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    response_valid = client.post(
        "/api/v1/ingress/email",
        content=body,
        headers={"X-Signature": sig, "Content-Type": "application/json"}
    )
    assert response_valid.status_code == 202
    assert response_valid.json()["status"] == "accepted"

    # 3. Assert that task and quarantined attachments are correctly spawned
    # Inbound email domain is "client-a.com" which matches Organization "client-a" (ID = 2)
    # Organization 2 defaults to MSP Owner (ID = 1)
    # Confirm "Inbound Support" project was provisioned
    proj = db_session.query(Project).filter(
        Project.client_organization_id == 2,
        Project.name == "Inbound Support"
    ).first()
    assert proj is not None

    # Confirm Task was spawned
    task = db_session.query(Task).filter(
        Task.project_id == proj.id,
        Task.title == "Email Ingress Outage"
    ).first()
    assert task is not None
    assert task.status == "todo"

    # Confirm Attachment was saved
    attachment = db_session.query(Attachment).filter(
        Attachment.task_id == task.id,
        Attachment.filename == "logs.pdf"
    ).first()
    assert attachment is not None
    assert attachment.status == "quarantined"
    
    # Verify the scan task was triggered with the correct attachment ID
    mock_scan_task.assert_called_once_with(attachment.id)


def test_alembic_upgrades_cleanly():
    """Confirm Alembic upgrades/downgrades run cleanly without database constraints conflicts."""
    db_file = "test_alembic_test.db"
    if os.path.exists(db_file):
        os.remove(db_file)
        
    env = os.environ.copy()
    env["DATABASE_URL"] = f"sqlite:///./{db_file}"
    env["JWT_SECRET_KEY"] = "alembic_secret"
    env["FIELD_ENCRYPTION_KEY"] = "dH5oTGdheFJZWjRmdnpqVlh6ZnpzUGZqcnM0cmphc3M="

    alembic_bin = ".venv/bin/alembic" if os.path.exists(".venv/bin/alembic") else "alembic"
    alembic_ini = "backend/alembic.ini" if os.path.exists("backend/alembic.ini") else "alembic.ini"
    res_up = subprocess.run([alembic_bin, "-c", alembic_ini, "upgrade", "head"], env=env)
    assert res_up.returncode == 0

    # Clean up
    if os.path.exists(db_file):
        os.remove(db_file)

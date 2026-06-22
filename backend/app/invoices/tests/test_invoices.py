import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date
from app.common.database import Base
from app.common.dependencies import get_db, get_current_user
from app.auth.models import User
from app.organizations.models import Organization
from app.memberships.models import Membership
from app.roles.models import Role
from app.permissions.models import Permission
from app.crm.models import Client
from app.invoices.models import Invoice, InvoiceLineItem
from app.main import app
SQLALCHEMY_DATABASE_URL = 'sqlite:///./test_invoices_module.db'
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={'check_same_thread': False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope='function')
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    user = User(id=1, email='invoiceuser@example.com', hashed_password='dummy_hash', full_name='Billing Agent', is_active=True)
    db.add(user)
    org = Organization(id=1, name='Test Billing Org', slug='test-billing-org')
    db.add(org)
    p_create = Permission(id=1, name='invoice:create', description='Create invoices')
    p_update = Permission(id=2, name='invoice:update', description='Update invoices')
    p_delete = Permission(id=3, name='invoice:delete', description='Delete invoices')
    db.add(p_create)
    db.add(p_update)
    db.add(p_delete)
    role = Role(id=1, name='Billing Admin', is_system=True)
    role.permissions.extend([p_create, p_update, p_delete])
    db.add(role)
    mem = Membership(id=1, user_id=1, organization_id=1, role_id=1, status='active')
    db.add(mem)
    c = Client(id=1, organization_id=1, name='Acme Corp', email='acme@example.com')
    db.add(c)
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
        return User(id=1, email='invoiceuser@example.com', hashed_password='dummy_hash', full_name='Billing Agent', is_active=True)

    from app.common.tenant import TenantContext, get_current_tenant
    from app.common.tenant_filtering import current_org_id, current_is_external

    def override_get_current_tenant():
        current_org_id.set(1)
        current_is_external.set(False)
        return TenantContext(
            organization_id=1,
            user_id=1,
            role_id=1,
            permissions=['invoice:create', 'invoice:update', 'invoice:delete'],
            is_external=False
        )

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_current_tenant] = override_get_current_tenant
    yield TestClient(app)
    app.dependency_overrides.clear()

def test_create_invoice(client):
    response = client.post('/api/invoices', json={'client_id': 1, 'issue_date': '2026-06-20', 'due_date': '2026-07-20', 'tax_rate': 10.0, 'notes': 'Payment terms: net 30', 'line_items': [{'description': 'Consulting services', 'quantity': 10.0, 'unit_price': 150.0}, {'description': 'Deployment support', 'quantity': 2.0, 'unit_price': 200.0}]}, headers={'X-Organization-ID': '1'})
    assert response.status_code == 201
    data = response.json()
    assert data['client_id'] == 1
    assert data['tax_rate'] == 10.0
    assert data['subtotal'] == 1900.0
    assert data['tax_amount'] == 190.0
    assert data['total'] == 2090.0
    assert len(data['line_items']) == 2
    assert 'INV-' in data['invoice_number']

def test_list_invoices(client, db_session):
    inv = Invoice(organization_id=1, client_id=1, invoice_number='INV-2026-001', issue_date=date(2026, 6, 20), due_date=date(2026, 7, 20), status='draft', subtotal=100.0, tax_rate=0.0, tax_amount=0.0, total=100.0)
    db_session.add(inv)
    db_session.commit()
    response = client.get('/api/invoices', headers={'X-Organization-ID': '1'})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]['invoice_number'] == 'INV-2026-001'
    assert data[0]['client_name'] == 'Acme Corp'

def test_get_invoice(client, db_session):
    inv = Invoice(organization_id=1, client_id=1, invoice_number='INV-2026-002', issue_date=date(2026, 6, 20), due_date=date(2026, 7, 20), status='sent', subtotal=200.0, tax_rate=5.0, tax_amount=10.0, total=210.0)
    db_session.add(inv)
    db_session.commit()
    response = client.get(f'/api/invoices/{inv.id}', headers={'X-Organization-ID': '1'})
    assert response.status_code == 200
    data = response.json()
    assert data['invoice_number'] == 'INV-2026-002'
    assert data['total'] == 210.0

def test_update_invoice_status(client, db_session):
    inv = Invoice(organization_id=1, client_id=1, invoice_number='INV-2026-003', issue_date=date(2026, 6, 20), due_date=date(2026, 7, 20), status='sent', subtotal=100.0, tax_rate=0.0, tax_amount=0.0, total=100.0)
    db_session.add(inv)
    db_session.commit()
    response = client.put(f'/api/invoices/{inv.id}/status', json={'status': 'paid'}, headers={'X-Organization-ID': '1'})
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'paid'

def test_get_metrics(client, db_session):
    inv1 = Invoice(organization_id=1, client_id=1, invoice_number='INV-2026-004', issue_date=date(2026, 6, 20), due_date=date(2026, 7, 20), status='paid', subtotal=100.0, tax_rate=0.0, tax_amount=0.0, total=100.0)
    inv2 = Invoice(organization_id=1, client_id=1, invoice_number='INV-2026-005', issue_date=date(2026, 6, 20), due_date=date(2026, 7, 20), status='overdue', subtotal=300.0, tax_rate=0.0, tax_amount=0.0, total=300.0)
    inv3 = Invoice(organization_id=1, client_id=1, invoice_number='INV-2026-006', issue_date=date(2026, 6, 20), due_date=date(2026, 7, 20), status='sent', subtotal=50.0, tax_rate=0.0, tax_amount=0.0, total=50.0)
    db_session.add_all([inv1, inv2, inv3])
    db_session.commit()
    response = client.get('/api/invoices/metrics', headers={'X-Organization-ID': '1'})
    assert response.status_code == 200
    data = response.json()
    assert data['total_billed'] == 450.0
    assert data['total_collected'] == 100.0
    assert data['total_outstanding'] == 50.0
    assert data['total_overdue'] == 300.0
    assert data['invoice_count'] == 3

def test_download_invoice_pdf(client, db_session):
    inv = Invoice(organization_id=1, client_id=1, invoice_number='INV-2026-007', issue_date=date(2026, 6, 20), due_date=date(2026, 7, 20), status='sent', subtotal=100.0, tax_rate=0.0, tax_amount=0.0, total=100.0)
    db_session.add(inv)
    db_session.commit()
    item = InvoiceLineItem(invoice_id=inv.id, description='Some work', quantity=1.0, unit_price=100.0, amount=100.0)
    db_session.add(item)
    db_session.commit()
    response = client.get(f'/api/invoices/{inv.id}/pdf', headers={'X-Organization-ID': '1'})
    assert response.status_code == 200
    assert response.headers['content-type'] == 'application/pdf'
    assert len(response.content) > 0
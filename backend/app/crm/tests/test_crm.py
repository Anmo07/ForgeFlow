import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.common.database import Base
from app.common.dependencies import get_db, get_current_user
from app.auth.models import User
from app.organizations.models import Organization
from app.memberships.models import Membership
from app.roles.models import Role
from app.permissions.models import Permission
from app.crm.models import Client, Lead, Deal
from app.main import app
SQLALCHEMY_DATABASE_URL = 'sqlite:///./test_crm_module.db'
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={'check_same_thread': False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope='function')
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    user = User(id=1, email='crmuser@example.com', hashed_password='dummy_hash', full_name='CRM Manager', is_active=True)
    db.add(user)
    org = Organization(id=1, name='Test CRM Org', slug='test-crm-org')
    db.add(org)
    p_create = Permission(id=1, name='client:create', description='Create clients')
    p_update = Permission(id=2, name='client:update', description='Update clients')
    p_delete = Permission(id=3, name='client:delete', description='Delete clients')
    db.add(p_create)
    db.add(p_update)
    db.add(p_delete)
    role = Role(id=1, name='CRM Admin', is_system=True)
    role.permissions.extend([p_create, p_update, p_delete])
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
        return User(id=1, email='crmuser@example.com', hashed_password='dummy_hash', full_name='CRM Manager', is_active=True)

    def override_get_current_tenant():
        from app.common.tenant import TenantContext
        return TenantContext(organization_id=1, user_id=1, role_id=1, permissions=['client:create', 'client:update', 'client:delete'])
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    from app.common.tenant import get_current_tenant
    app.dependency_overrides[get_current_tenant] = override_get_current_tenant
    yield TestClient(app)
    app.dependency_overrides.clear()

def test_create_client(client):
    response = client.post('/api/crm/clients', json={'name': 'Jane Doe', 'email': 'jane@example.com', 'phone': '123-456-7890', 'company': 'Jane Corp'}, headers={'X-Organization-ID': '1'})
    assert response.status_code == 201
    data = response.json()
    assert data['name'] == 'Jane Doe'
    assert data['email'] == 'jane@example.com'
    assert data['company'] == 'Jane Corp'

def test_list_clients(client, db_session):
    c = Client(organization_id=1, name='Existing Client', email='exist@example.com')
    db_session.add(c)
    db_session.commit()
    response = client.get('/api/crm/clients', headers={'X-Organization-ID': '1'})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]['name'] == 'Existing Client'

def test_create_lead(client, db_session):
    c = Client(organization_id=1, name='Lead Client', email='lead@example.com')
    db_session.add(c)
    db_session.commit()
    response = client.post('/api/crm/leads', json={'client_id': c.id, 'status': 'new', 'value': 5000.0, 'source': 'website'}, headers={'X-Organization-ID': '1'})
    assert response.status_code == 201
    data = response.json()
    assert data['client_id'] == c.id
    assert data['value'] == 5000.0
    assert data['source'] == 'website'

def test_create_deal(client, db_session):
    c = Client(organization_id=1, name='Deal Client')
    db_session.add(c)
    db_session.commit()
    l = Lead(organization_id=1, client_id=c.id, status='qualified', value=10000.0)
    db_session.add(l)
    db_session.commit()
    response = client.post('/api/crm/deals', json={'lead_id': l.id, 'name': 'Big Contract Deal', 'value': 12000.0, 'status': 'discovery'}, headers={'X-Organization-ID': '1'})
    assert response.status_code == 201
    data = response.json()
    assert data['lead_id'] == l.id
    assert data['name'] == 'Big Contract Deal'
    assert data['value'] == 12000.0
    assert data['status'] == 'discovery'

def test_get_metrics(client, db_session):
    c1 = Client(organization_id=1, name='Client 1')
    c2 = Client(organization_id=1, name='Client 2')
    db_session.add_all([c1, c2])
    db_session.commit()
    l1 = Lead(organization_id=1, client_id=c1.id, status='new', value=5000.0)
    l2 = Lead(organization_id=1, client_id=c2.id, status='won', value=10000.0)
    db_session.add_all([l1, l2])
    db_session.commit()
    d1 = Deal(organization_id=1, lead_id=l2.id, name='Deal 1', value=10000.0, status='closed_won')
    d2 = Deal(organization_id=1, lead_id=l1.id, name='Deal 2', value=4000.0, status='proposal')
    db_session.add_all([d1, d2])
    db_session.commit()
    response = client.get('/api/crm/metrics', headers={'X-Organization-ID': '1'})
    assert response.status_code == 200
    data = response.json()
    assert data['total_clients'] == 2
    assert data['conversion_rate'] == 50.0
    assert data['deals_won_value'] == 10000.0
    assert data['pipeline_value'] == 5000.0

def test_deal_closed_won_syncs_lead_to_won(client, db_session):
    c = Client(organization_id=1, name='Test Client')
    db_session.add(c)
    db_session.commit()
    l = Lead(organization_id=1, client_id=c.id, status='qualified', value=10000.0)
    db_session.add(l)
    db_session.commit()
    d = Deal(organization_id=1, lead_id=l.id, name='Big Deal', value=12000.0, status='proposal')
    db_session.add(d)
    db_session.commit()
    response = client.put(f'/api/crm/deals/{d.id}', json={'status': 'closed_won'}, headers={'X-Organization-ID': '1'})
    assert response.status_code == 200
    deal_data = response.json()
    assert deal_data['status'] == 'closed_won'
    assert deal_data['closed_at'] is not None
    db_session.refresh(l)
    assert l.status == 'won'

def test_deal_closed_lost_syncs_lead_to_lost(client, db_session):
    c = Client(organization_id=1, name='Test Client')
    db_session.add(c)
    db_session.commit()
    l = Lead(organization_id=1, client_id=c.id, status='negotiation', value=5000.0)
    db_session.add(l)
    db_session.commit()
    d = Deal(organization_id=1, lead_id=l.id, name='Lost Deal', value=5000.0, status='negotiation')
    db_session.add(d)
    db_session.commit()
    response = client.put(f'/api/crm/deals/{d.id}', json={'status': 'closed_lost'}, headers={'X-Organization-ID': '1'})
    assert response.status_code == 200
    deal_data = response.json()
    assert deal_data['status'] == 'closed_lost'
    assert deal_data['closed_at'] is not None
    db_session.refresh(l)
    assert l.status == 'lost'

def test_deal_reopen_reverts_lead_status(client, db_session):
    c = Client(organization_id=1, name='Test Client')
    db_session.add(c)
    db_session.commit()
    l = Lead(organization_id=1, client_id=c.id, status='won', value=10000.0)
    db_session.add(l)
    db_session.commit()
    from datetime import timezone
    d = Deal(organization_id=1, lead_id=l.id, name='Reopened Deal', value=10000.0, status='closed_won', closed_at=datetime.now(timezone.utc))
    db_session.add(d)
    db_session.commit()
    response = client.put(f'/api/crm/deals/{d.id}', json={'status': 'negotiation'}, headers={'X-Organization-ID': '1'})
    assert response.status_code == 200
    deal_data = response.json()
    assert deal_data['status'] == 'negotiation'
    assert deal_data['closed_at'] is None
    db_session.refresh(l)
    assert l.status == 'negotiation'

def test_deal_non_status_update_does_not_sync_lead(client, db_session):
    c = Client(organization_id=1, name='Test Client')
    db_session.add(c)
    db_session.commit()
    l = Lead(organization_id=1, client_id=c.id, status='qualified', value=5000.0)
    db_session.add(l)
    db_session.commit()
    d = Deal(organization_id=1, lead_id=l.id, name='Deal', value=5000.0, status='discovery')
    db_session.add(d)
    db_session.commit()
    response = client.put(f'/api/crm/deals/{d.id}', json={'value': 7500.0}, headers={'X-Organization-ID': '1'})
    assert response.status_code == 200
    deal_data = response.json()
    assert deal_data['value'] == 7500.0
    db_session.refresh(l)
    assert l.status == 'qualified'

def test_deal_from_won_to_lost_syncs_lead(client, db_session):
    c = Client(organization_id=1, name='Test Client')
    db_session.add(c)
    db_session.commit()
    l = Lead(organization_id=1, client_id=c.id, status='won', value=10000.0)
    db_session.add(l)
    db_session.commit()
    from datetime import timezone
    d = Deal(organization_id=1, lead_id=l.id, name='Changed Deal', value=10000.0, status='closed_won', closed_at=datetime.now(timezone.utc))
    db_session.add(d)
    db_session.commit()
    response = client.put(f'/api/crm/deals/{d.id}', json={'status': 'closed_lost'}, headers={'X-Organization-ID': '1'})
    assert response.status_code == 200
    deal_data = response.json()
    assert deal_data['status'] == 'closed_lost'
    db_session.refresh(l)
    assert l.status == 'lost'
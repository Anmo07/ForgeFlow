import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.common.database import Base
from app.common.dependencies import get_db
from app.main import app
SQLALCHEMY_DATABASE_URL = 'sqlite:///./test_orgs.db'
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

def test_create_organization(client):
    response = client.post('/api/organizations/', json={'name': 'Acme Agency', 'slug': 'acme-agency', 'industry': 'Marketing', 'company_size': '11-50', 'website': 'https://acme.agency', 'description': 'Acme agency marketing'})
    assert response.status_code == 201
    data = response.json()
    assert data['name'] == 'Acme Agency'
    assert data['slug'] == 'acme-agency'
    assert 'uuid' in data
    assert data['is_active'] is True

def test_create_organization_duplicate_slug(client):
    payload = {'name': 'Acme Agency', 'slug': 'acme-agency'}
    r1 = client.post('/api/organizations/', json=payload)
    assert r1.status_code == 201
    r2 = client.post('/api/organizations/', json=payload)
    assert r2.status_code == 400
    assert r2.json()['detail'] == 'Organization slug already exists'

def test_get_organization(client):
    r1 = client.post('/api/organizations/', json={'name': 'Org 1', 'slug': 'org-1'})
    org_id = r1.json()['id']
    r2 = client.get(f'/api/organizations/{org_id}')
    assert r2.status_code == 200
    assert r2.json()['name'] == 'Org 1'

def test_update_organization(client):
    r1 = client.post('/api/organizations/', json={'name': 'Org 1', 'slug': 'org-1'})
    org_id = r1.json()['id']
    r2 = client.put(f'/api/organizations/{org_id}', json={'name': 'Updated Org', 'industry': 'Software'})
    assert r2.status_code == 200
    assert r2.json()['name'] == 'Updated Org'
    assert r2.json()['industry'] == 'Software'

def test_delete_organization(client):
    r1 = client.post('/api/organizations/', json={'name': 'Org 1', 'slug': 'org-1'})
    org_id = r1.json()['id']
    r2 = client.delete(f'/api/organizations/{org_id}')
    assert r2.status_code == 204
    r3 = client.get(f'/api/organizations/{org_id}')
    assert r3.status_code == 404
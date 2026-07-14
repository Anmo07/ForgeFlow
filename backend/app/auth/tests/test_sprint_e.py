"""Tests for Sprint E — SSO/OIDC and Granular Custom Roles."""

import pytest
import secrets
from unittest.mock import patch, MagicMock
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.common.database import Base
from app.common.dependencies import get_db
from app.common.tenant import TenantContext, get_current_tenant
from app.main import app
from app.organizations.models import Organization
from app.roles.models import Role
from app.permissions.models import Permission
from app.memberships.models import Membership
from app.auth.models import User

SQLALCHEMY_DATABASE_URL = 'sqlite:///./test_sprint_e.db'
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={'check_same_thread': False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Use override tenant context for custom role management tests
mock_tenant = TenantContext(
    organization_id=1,
    user_id=101,
    role_id=1,  # Owner
    permissions=["settings:update"],
    is_external=False
)

def override_get_current_tenant():
    return mock_tenant

@pytest.fixture(scope='function')
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        # Seed basic permissions & roles
        owner_role = Role(id=1, name='Owner', is_system=True)
        member_role = Role(id=4, name='member', is_system=True)
        db.add_all([owner_role, member_role])
        db.commit()
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
    app.dependency_overrides[get_current_tenant] = override_get_current_tenant
    yield TestClient(app)
    app.dependency_overrides.clear()


# ===========================================================================
# E1 — SSO / OIDC Tests
# ===========================================================================

def test_google_sso_init(client, db_session):
    # Test without org_slug (global fallback)
    resp = client.get('/api/auth/sso/google/init', follow_redirects=False)
    assert resp.status_code == 307
    assert 'accounts.google.com' in resp.headers['location']
    assert 'client_id=mock-google-client-id' in resp.headers['location']
    assert 'sso_state' in resp.cookies

    # Test with org_slug
    org = Organization(id=1, name='Acme Corp', slug='acme-corp', sso_enabled=True, sso_client_id='acme-google-client-id')
    db_session.add(org)
    db_session.commit()

    resp = client.get('/api/auth/sso/google/init?org_slug=acme-corp', follow_redirects=False)
    assert resp.status_code == 307
    assert 'client_id=acme-google-client-id' in resp.headers['location']
    assert resp.cookies['sso_org_id'] == '1'


@patch('httpx.AsyncClient.post')
@patch('jwt.decode')
@patch('jwt.PyJWKClient')
def test_google_sso_callback(mock_jwks, mock_decode, mock_post, client, db_session):
    # Configure mock responses
    mock_post.return_value = MagicMock(status_code=200, json=lambda: {"id_token": "mock-id-token"})
    mock_decode.return_value = {
        "email": "owner@acme-corp.com",
        "sub": "google-sub-12345",
        "name": "Acme Owner"
    }

    # Setup organization
    from app.common.encryption import encrypt_field
    org = Organization(
        id=1,
        name='Acme Corp',
        slug='acme-corp',
        sso_enabled=True,
        sso_client_id='acme-google-client-id',
        sso_client_secret=encrypt_field('some_encrypted_secret')
    )
    db_session.add(org)
    db_session.commit()

    # Callback fails without state cookie
    resp = client.get('/api/auth/sso/google/callback?code=123&state=abc')
    assert resp.status_code == 400

    # Set initial state cookie
    client.cookies.set('sso_state', 'abc')
    client.cookies.set('sso_org_id', '1')

    resp = client.get('/api/auth/sso/google/callback?code=123&state=abc', follow_redirects=False)
    assert resp.status_code == 307
    assert '/dashboard' in resp.headers['location']
    assert 'access_token' in resp.cookies
    assert 'refresh_token' in resp.cookies


def test_get_and_update_org_sso(client, db_session):
    org = Organization(id=1, name='Acme Corp', slug='acme-corp', is_active=True)
    db_session.add(org)
    db_session.commit()

    # Get settings
    resp = client.get('/api/organizations/1/sso')
    assert resp.status_code == 200
    data = resp.json()
    assert data['sso_enabled'] is False
    assert data['sso_client_secret_configured'] is False

    # Update settings
    resp = client.put('/api/organizations/1/sso', json={
        "sso_enabled": True,
        "sso_provider": "google",
        "sso_client_id": "test-client-id",
        "sso_client_secret": "test-secret-value",
        "sso_issuer_url": "https://accounts.google.com"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data['sso_enabled'] is True
    assert data['sso_client_secret_configured'] is True

    # Re-fetch Org directly to verify encrypted secret storage
    db_session.expire_all()
    updated_org = db_session.query(Organization).get(1)
    assert updated_org.sso_client_secret.startswith('v')  # Has encryption version prefix


# ===========================================================================
# E2 — Custom Roles Tests
# ===========================================================================

def test_custom_roles_crud(client, db_session):
    # Setup test organization and permissions
    org = Organization(id=1, name='Acme Corp', slug='acme-corp', is_active=True)
    perm = Permission(id=1, name='project:create', description='Create projects')
    db_session.add_all([org, perm])
    db_session.commit()

    # 1. Create custom role
    resp = client.post('/api/organizations/1/roles', json={
        "name": "Custom Manager",
        "description": "Custom role for project management",
        "permission_ids": [1]
    })
    assert resp.status_code == 201
    role_data = resp.json()
    assert role_data['name'] == "Custom Manager"
    assert role_data['is_system'] is False
    assert len(role_data['permissions']) == 1

    role_id = role_data['id']

    # 2. Update custom role
    resp = client.put(f'/api/organizations/1/roles/{role_id}', json={
        "name": "Senior Custom Manager",
        "description": "Updated custom role"
    })
    assert resp.status_code == 200
    assert resp.json()['name'] == "Senior Custom Manager"

    # 3. Prevent deletion if assigned to active member
    user = User(id=5, email="member@acme.com", hashed_password="dummy")
    db_session.add(user)
    db_session.commit()
    
    membership = Membership(user_id=5, organization_id=1, role_id=role_id, status="active")
    db_session.add(membership)
    db_session.commit()

    resp = client.delete(f'/api/organizations/1/roles/{role_id}')
    assert resp.status_code == 409
    assert "affected_members" in resp.json()['detail']

    # 4. Success delete when unassigned (delete membership)
    db_session.delete(membership)
    db_session.commit()

    resp = client.delete(f'/api/organizations/1/roles/{role_id}')
    assert resp.status_code == 204

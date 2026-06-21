"""Tests for Phase 5 — Enterprise SSO Scaffolding."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.common.database import Base
from app.common.dependencies import get_db
from app.main import app

SQLALCHEMY_DATABASE_URL = 'sqlite:///./test_sso.db'
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={'check_same_thread': False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

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
    from fastapi.testclient import TestClient

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def _seed_org_and_role(db):
    """Create a test organization and a system 'member' role."""
    from app.organizations.models import Organization
    from app.roles.models import Role

    org = Organization(name='Acme Corp', slug='acme-corp', is_active=True)
    db.add(org)
    db.commit()
    db.refresh(org)

    role = Role(name='member', is_system=True, organization_id=org.id)
    db.add(role)
    db.commit()
    db.refresh(role)

    return org, role


def _seed_sso_config(db, org, role, provider_type='saml'):
    """Create a test SSO configuration."""
    from app.auth.sso_models import SSOConfiguration

    config = SSOConfiguration(
        organization_id=org.id,
        provider_type=provider_type,
        entity_id='https://idp.acme.com/entity',
        sso_url='https://idp.acme.com/sso/login',
        email_domain='acme.com',
        default_role_id=role.id,
        is_active=True,
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestSSOUserAssertionModel:

    def test_valid_assertion(self):
        from app.auth.sso import SSOUserAssertion

        assertion = SSOUserAssertion(
            email='jane@acme.com',
            name='Jane Doe',
            external_id='ext-123',
            domain='acme.com',
            groups=['engineering', 'admin'],
            raw_attributes={'role': 'engineer'},
        )
        assert assertion.email == 'jane@acme.com'
        assert assertion.domain == 'acme.com'
        assert len(assertion.groups) == 2

    def test_minimal_assertion(self):
        from app.auth.sso import SSOUserAssertion

        assertion = SSOUserAssertion(
            email='bob@acme.com',
            domain='acme.com',
        )
        assert assertion.name is None
        assert assertion.external_id is None
        assert assertion.groups == []
        assert assertion.raw_attributes == {}

    def test_invalid_email_raises(self):
        from app.auth.sso import SSOUserAssertion
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            SSOUserAssertion(email='not-an-email', domain='acme.com')


class TestSSOProcessLoginCreatesUser:

    def test_creates_new_user(self, db_session):
        org, role = _seed_org_and_role(db_session)
        config = _seed_sso_config(db_session, org, role)

        from app.auth.sso import SSOService, SSOUserAssertion

        sso = SSOService()
        assertion = SSOUserAssertion(
            email='newuser@acme.com',
            name='New SSO User',
            domain='acme.com',
        )
        token_resp = sso.process_sso_login(db_session, assertion, config)

        assert token_resp.access_token
        assert token_resp.refresh_token
        assert token_resp.user.email == 'newuser@acme.com'

        # Verify user was persisted
        from app.auth.models import User
        user = db_session.query(User).filter(User.email == 'newuser@acme.com').first()
        assert user is not None
        assert user.is_verified is True

        # Verify membership was created
        from app.memberships.models import Membership
        membership = db_session.query(Membership).filter(
            Membership.user_id == user.id,
            Membership.organization_id == org.id,
        ).first()
        assert membership is not None
        assert membership.role_id == role.id
        assert membership.status == 'active'


class TestSSOProcessLoginExistingUser:

    def test_existing_user_gets_session(self, db_session):
        org, role = _seed_org_and_role(db_session)
        config = _seed_sso_config(db_session, org, role)

        # Pre-create the user
        from app.auth.models import User
        from app.common.security import get_password_hash
        user = User(
            email='existing@acme.com',
            hashed_password=get_password_hash('dummy'),
            full_name='Existing User',
            is_active=True,
            is_verified=True,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        from app.auth.sso import SSOService, SSOUserAssertion

        sso = SSOService()
        assertion = SSOUserAssertion(
            email='existing@acme.com',
            name='Existing User',
            domain='acme.com',
        )
        token_resp = sso.process_sso_login(db_session, assertion, config)

        assert token_resp.access_token
        assert token_resp.user.email == 'existing@acme.com'

        # Verify no duplicate user was created
        users = db_session.query(User).filter(User.email == 'existing@acme.com').all()
        assert len(users) == 1


class TestSSODomainToTenantMapping:

    def test_domain_resolves_to_org(self, db_session):
        org, role = _seed_org_and_role(db_session)
        config = _seed_sso_config(db_session, org, role)

        from app.auth.sso import SSOService

        sso = SSOService()
        resolved = sso.resolve_config_by_domain(db_session, 'acme.com')
        assert resolved is not None
        assert resolved.organization_id == org.id

    def test_unknown_domain_returns_none(self, db_session):
        _seed_org_and_role(db_session)

        from app.auth.sso import SSOService

        sso = SSOService()
        resolved = sso.resolve_config_by_domain(db_session, 'unknown.com')
        assert resolved is None


class TestSSOProviderFactory:

    def test_saml_provider(self, db_session):
        org, role = _seed_org_and_role(db_session)
        config = _seed_sso_config(db_session, org, role, provider_type='saml')

        from app.auth.sso import SSOService, SAMLProvider

        sso = SSOService()
        provider = sso.get_provider(config)
        assert isinstance(provider, SAMLProvider)

    def test_oidc_provider(self, db_session):
        org, role = _seed_org_and_role(db_session)
        config = _seed_sso_config(db_session, org, role, provider_type='oidc')

        from app.auth.sso import SSOService, OIDCProvider

        sso = SSOService()
        provider = sso.get_provider(config)
        assert isinstance(provider, OIDCProvider)

    def test_unknown_provider_raises(self, db_session):
        org, role = _seed_org_and_role(db_session)
        config = _seed_sso_config(db_session, org, role, provider_type='saml')
        config.provider_type = 'kerberos'

        from app.auth.sso import SSOService
        from fastapi import HTTPException

        sso = SSOService()
        with pytest.raises(HTTPException) as exc_info:
            sso.get_provider(config)
        assert exc_info.value.status_code == 400


class TestSSOCallbackReturnsTokens:

    def test_saml_callback_flow(self, db_session):
        """Mock a SAML callback with email/name payload → verify token response."""
        org, role = _seed_org_and_role(db_session)
        config = _seed_sso_config(db_session, org, role, provider_type='saml')

        from app.auth.sso import SSOService

        sso = SSOService()
        provider = sso.get_provider(config)

        # Simulate a SAML callback payload
        payload = {
            'SAMLResponse': 'base64-encoded-xml-stub',
            'email': 'samluser@acme.com',
            'name': 'SAML User',
            'nameID': 'saml-ext-id',
        }
        assertion = provider.process_callback(payload)
        assert assertion.email == 'samluser@acme.com'
        assert assertion.domain == 'acme.com'

        token_resp = sso.process_sso_login(db_session, assertion, config)
        assert token_resp.access_token
        assert token_resp.refresh_token
        assert token_resp.user.email == 'samluser@acme.com'


class TestSSOLoginEndpoint:

    def test_get_login_url(self, db_session):
        org, role = _seed_org_and_role(db_session)
        config = _seed_sso_config(db_session, org, role, provider_type='saml')

        from app.auth.sso import SSOService

        sso = SSOService()
        provider = sso.get_provider(config)
        url = provider.get_login_url(state='test-state-token')
        assert 'test-state-token' in url
        assert config.sso_url in url

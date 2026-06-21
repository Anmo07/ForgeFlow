"""
Enterprise SSO service layer.

Provides a vendor-agnostic abstraction for SAML 2.0 and OpenID Connect
identity providers.  The design is modular — administrators configure
metadata URLs, entity IDs, and certificates per-tenant, and the service
layer routes incoming assertions to the correct organisation and RBAC tier.

This module contains:
- ``SSOUserAssertion`` — normalised claim model from any IdP.
- ``SSOProvider`` — abstract base class for IdP integrations.
- ``SAMLProvider`` / ``OIDCProvider`` — concrete (skeleton) implementations.
- ``SSOService`` — orchestrator that maps assertions to ForgeFlow tenants.
"""

import hashlib
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from ..common.security import (
    create_access_token,
    create_refresh_token,
)
from ..common.config import REFRESH_TOKEN_EXPIRE_DAYS
from .schema import TokenResponse, UserResponse
from .sso_models import SSOConfiguration


# ---------------------------------------------------------------------------
# Normalised assertion model
# ---------------------------------------------------------------------------

class SSOUserAssertion(BaseModel):
    """Normalised user claim extracted from an IdP assertion.

    Both SAML and OIDC providers must produce an instance of this model
    after processing the raw IdP response.
    """

    email: EmailStr = Field(..., description='User email from the IdP assertion')
    name: Optional[str] = Field(None, description='Full name (displayName)')
    external_id: Optional[str] = Field(
        None, description='Unique user identifier from the IdP (nameID / sub)',
    )
    domain: str = Field(..., description='Email domain (e.g. "acme.com")')
    groups: List[str] = Field(
        default_factory=list,
        description='Group / role claims from the IdP (optional)',
    )
    raw_attributes: Dict[str, Any] = Field(
        default_factory=dict,
        description='Full raw attribute map from the IdP for audit / debugging',
    )


# ---------------------------------------------------------------------------
# Abstract provider
# ---------------------------------------------------------------------------

class SSOProvider(ABC):
    """Interface contract for SSO identity-provider integrations."""

    def __init__(self, config: SSOConfiguration) -> None:
        self.config = config

    @abstractmethod
    def get_login_url(self, state: str) -> str:
        """Return the redirect URL for the IdP login page.

        Parameters:
            state: An opaque, CSRF-safe state token that the IdP should echo
                   back in the callback.
        """
        ...

    @abstractmethod
    def process_callback(self, payload: Dict[str, Any]) -> SSOUserAssertion:
        """Parse and validate the IdP callback payload.

        Parameters:
            payload: The raw form/query data or JSON body from the IdP callback.

        Returns:
            A normalised ``SSOUserAssertion`` on success.

        Raises:
            HTTPException(401/400) if the assertion is invalid.
        """
        ...


# ---------------------------------------------------------------------------
# SAML 2.0 provider (skeleton)
# ---------------------------------------------------------------------------

class SAMLProvider(SSOProvider):
    """SAML 2.0 identity-provider integration (structural scaffold).

    .. warning::
        This is a **skeleton implementation**.  Production use requires a
        real SAML library (e.g. ``python3-saml``, ``pysaml2``) for XML
        signature verification, assertion decryption, and audience
        restriction validation.
    """

    def get_login_url(self, state: str) -> str:
        """Build an SP-initiated SAML AuthnRequest redirect URL.

        In production this would construct a proper ``<AuthnRequest>`` XML
        document, deflate-encode it, and append it to ``self.config.sso_url``.
        """
        # TODO: Build real AuthnRequest with deflate + base64
        return f'{self.config.sso_url}?RelayState={state}'

    def process_callback(self, payload: Dict[str, Any]) -> SSOUserAssertion:
        """Parse a SAML Response and extract the user assertion.

        Validation hooks (to be completed for production):
        1. Base64-decode the SAMLResponse from ``payload``.
        2. Verify the XML signature against ``self.config.certificate``.
        3. Validate audience restriction matches our SP entity ID.
        4. Validate ``NotBefore`` / ``NotOnOrAfter`` time conditions.
        5. Extract ``NameID``, attributes, and group claims.
        """
        saml_response = payload.get('SAMLResponse')
        if not saml_response:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Missing SAMLResponse in callback payload',
            )

        # --- Structural validation hooks (stubs) ---
        # self._verify_xml_signature(saml_response, self.config.certificate)
        # self._validate_audience(saml_response, expected_audience)
        # self._validate_conditions(saml_response)

        # --- Extract claims (stub — replace with real XML parsing) ---
        email = payload.get('email', '')
        name = payload.get('name', '')
        external_id = payload.get('nameID', '')

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='SAML assertion missing required email attribute',
            )

        domain = email.split('@')[-1] if '@' in email else ''

        return SSOUserAssertion(
            email=email,
            name=name or None,
            external_id=external_id or None,
            domain=domain,
            groups=payload.get('groups', []),
            raw_attributes=payload,
        )


# ---------------------------------------------------------------------------
# OIDC provider (skeleton)
# ---------------------------------------------------------------------------

class OIDCProvider(SSOProvider):
    """OpenID Connect identity-provider integration (structural scaffold).

    .. warning::
        This is a **skeleton implementation**.  Production use requires
        JWKS-based ``id_token`` signature verification, ``nonce``
        validation, and proper ``token`` endpoint exchange.
    """

    def get_login_url(self, state: str) -> str:
        """Build an OIDC Authorization Code redirect URL."""
        params = (
            f'client_id={self.config.entity_id}'
            f'&response_type=code'
            f'&scope=openid+email+profile'
            f'&state={state}'
            f'&redirect_uri=PLACEHOLDER_REDIRECT_URI'
        )
        return f'{self.config.sso_url}?{params}'

    def process_callback(self, payload: Dict[str, Any]) -> SSOUserAssertion:
        """Exchange the authorisation code for tokens and extract claims.

        Validation hooks (to be completed for production):
        1. Exchange ``code`` for ``access_token`` and ``id_token`` at the
           token endpoint.
        2. Fetch the IdP's JWKS and verify the ``id_token`` signature.
        3. Validate ``iss``, ``aud``, ``exp``, ``nonce`` claims.
        4. Extract ``sub``, ``email``, ``name``, and group claims.
        """
        code = payload.get('code')
        if not code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Missing authorisation code in OIDC callback',
            )

        # --- Token exchange stub ---
        # tokens = self._exchange_code(code)
        # id_token_claims = self._verify_id_token(tokens['id_token'])

        # --- Extract claims (stub — replace with real token exchange) ---
        email = payload.get('email', '')
        name = payload.get('name', '')
        external_id = payload.get('sub', '')

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='OIDC callback missing required email claim',
            )

        domain = email.split('@')[-1] if '@' in email else ''

        return SSOUserAssertion(
            email=email,
            name=name or None,
            external_id=external_id or None,
            domain=domain,
            groups=payload.get('groups', []),
            raw_attributes=payload,
        )


# ---------------------------------------------------------------------------
# SSO service (orchestrator)
# ---------------------------------------------------------------------------

class SSOService:
    """Orchestrates SSO login flows — provider selection, user/tenant
    mapping, and session creation."""

    # Provider registry
    _PROVIDERS = {
        'saml': SAMLProvider,
        'oidc': OIDCProvider,
    }

    def get_provider(self, config: SSOConfiguration) -> SSOProvider:
        """Instantiate the correct provider for the given SSO configuration."""
        provider_cls = self._PROVIDERS.get(config.provider_type)
        if not provider_cls:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'Unsupported SSO provider type: {config.provider_type}',
            )
        return provider_cls(config)

    def get_config_by_org_slug(
        self, db: Session, org_slug: str,
    ) -> SSOConfiguration:
        """Look up the active SSO configuration for an organisation slug."""
        from ..organizations.models import Organization

        org = (
            db.query(Organization)
            .filter(Organization.slug == org_slug, Organization.is_active == True)
            .first()
        )
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Organisation not found',
            )

        config = (
            db.query(SSOConfiguration)
            .filter(
                SSOConfiguration.organization_id == org.id,
                SSOConfiguration.is_active == True,
            )
            .first()
        )
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='SSO is not configured for this organisation',
            )
        return config

    def resolve_config_by_domain(
        self, db: Session, email_domain: str,
    ) -> Optional[SSOConfiguration]:
        """Resolve an SSO configuration by email domain."""
        return (
            db.query(SSOConfiguration)
            .filter(
                SSOConfiguration.email_domain == email_domain,
                SSOConfiguration.is_active == True,
            )
            .first()
        )

    def process_sso_login(
        self,
        db: Session,
        assertion: SSOUserAssertion,
        config: SSOConfiguration,
    ) -> TokenResponse:
        """Map an SSO assertion to a ForgeFlow user and create a session.

        Steps:
        1. Find or create the ``User`` record by email.
        2. Find or create a ``Membership`` linking the user to the tenant
           organisation with the configured default role.
        3. Create access/refresh tokens and a session.
        """
        from .repository import AuthRepository
        from ..memberships.models import Membership

        repo = AuthRepository()

        # --- Step 1: Find or create user ---
        user = repo.get_by_email(db, assertion.email)
        if not user:
            from .models import User
            from ..common.security import get_password_hash
            import secrets

            # SSO users get a random, unusable password
            random_pw = secrets.token_urlsafe(64)
            user = User(
                email=assertion.email,
                hashed_password=get_password_hash(random_pw),
                full_name=assertion.name,
                is_active=True,
                is_verified=True,  # SSO-authenticated = verified
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # --- Step 2: Ensure membership ---
        membership = (
            db.query(Membership)
            .filter(
                Membership.user_id == user.id,
                Membership.organization_id == config.organization_id,
            )
            .first()
        )
        if not membership:
            membership = Membership(
                user_id=user.id,
                organization_id=config.organization_id,
                role_id=config.default_role_id or self._get_default_member_role_id(db),
                status='active',
            )
            db.add(membership)
            db.commit()

        # --- Step 3: Create session & tokens ---
        refresh_token = create_refresh_token(data={'sub': str(user.id)})
        sid = hashlib.sha256(refresh_token.encode()).hexdigest()
        access_token = create_access_token(data={'sub': str(user.id)}, sid=sid)

        from ..sessions.service import SessionService

        expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        SessionService().register_session(
            db,
            user_id=user.id,
            refresh_token=refresh_token,
            expires_at=expires_at,
            ua_string='SSO Login',
            ip_address=None,
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user),
        )

    @staticmethod
    def _get_default_member_role_id(db: Session) -> int:
        """Fall back to the system 'member' role if no default is configured."""
        from ..roles.models import Role

        role = db.query(Role).filter(Role.name == 'member', Role.is_system == True).first()
        if role:
            return role.id
        # Ultimate fallback — first available role
        role = db.query(Role).first()
        if role:
            return role.id
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='No roles exist in the system. Cannot provision SSO user.',
        )

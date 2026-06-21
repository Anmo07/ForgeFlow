"""
Enterprise SSO database models.

Per-tenant SSO / IdP configuration for SAML 2.0 and OpenID Connect.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..common.database import Base


class SSOConfiguration(Base):
    """Stores the SSO / IdP settings for an organization (tenant).

    Each row represents one identity-provider binding.  The ``email_domain``
    column is the primary lookup key — when a user attempts SSO login, we
    resolve their email domain to the correct ``SSOConfiguration`` and thus
    to the correct ``organization_id``.
    """

    __tablename__ = 'sso_configurations'

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(
        Integer,
        ForeignKey('organizations.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    provider_type = Column(
        String(10),
        nullable=False,
        comment='Provider type: "saml" or "oidc"',
    )
    entity_id = Column(
        String,
        nullable=False,
        comment='IdP Entity ID (SAML) or Client ID (OIDC)',
    )
    metadata_url = Column(
        String,
        nullable=True,
        comment='IdP metadata URL for auto-configuration',
    )
    sso_url = Column(
        String,
        nullable=False,
        comment='IdP login / authorization endpoint URL',
    )
    certificate = Column(
        Text,
        nullable=True,
        comment='PEM-encoded certificate for SAML signature validation',
    )
    client_secret_encrypted = Column(
        String,
        nullable=True,
        comment='Encrypted OIDC client secret (Fernet, versioned)',
    )
    default_role_id = Column(
        Integer,
        ForeignKey('roles.id', ondelete='SET NULL'),
        nullable=True,
        comment='Default role assigned to SSO-provisioned users',
    )
    email_domain = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
        comment='Email domain to match for this SSO config (e.g. "acme.com")',
    )
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    organization = relationship('Organization', backref='sso_configurations')
    default_role = relationship('Role')

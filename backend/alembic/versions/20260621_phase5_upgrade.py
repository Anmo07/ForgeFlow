"""Phase 5 — Enterprise SSO configuration table.

Revision ID: 20260621_phase5
Revises: 20260620_phase1_auth
Create Date: 2026-06-21 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260621_phase5'
down_revision = '20260620_phase4_indexing'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create sso_configurations table
    op.create_table(
        'sso_configurations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column(
            'provider_type',
            sa.String(10),
            nullable=False,
            comment='Provider type: "saml" or "oidc"',
        ),
        sa.Column(
            'entity_id',
            sa.String(),
            nullable=False,
            comment='IdP Entity ID (SAML) or Client ID (OIDC)',
        ),
        sa.Column(
            'metadata_url',
            sa.String(),
            nullable=True,
            comment='IdP metadata URL for auto-configuration',
        ),
        sa.Column(
            'sso_url',
            sa.String(),
            nullable=False,
            comment='IdP login / authorization endpoint URL',
        ),
        sa.Column(
            'certificate',
            sa.Text(),
            nullable=True,
            comment='PEM-encoded certificate for SAML signature validation',
        ),
        sa.Column(
            'client_secret_encrypted',
            sa.String(),
            nullable=True,
            comment='Encrypted OIDC client secret (Fernet, versioned)',
        ),
        sa.Column(
            'default_role_id',
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            'email_domain',
            sa.String(),
            nullable=False,
            comment='Email domain to match for this SSO config (e.g. "acme.com")',
        ),
        sa.Column(
            'is_active',
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(
            ['organization_id'],
            ['organizations.id'],
            ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['default_role_id'],
            ['roles.id'],
            ondelete='SET NULL',
        ),
        sa.UniqueConstraint('email_domain', name='uq_sso_configurations_email_domain'),
    )
    op.create_index(
        'ix_sso_configurations_organization_id',
        'sso_configurations',
        ['organization_id'],
    )
    op.create_index(
        'ix_sso_configurations_email_domain',
        'sso_configurations',
        ['email_domain'],
    )


def downgrade() -> None:
    op.drop_index('ix_sso_configurations_email_domain', table_name='sso_configurations')
    op.drop_index('ix_sso_configurations_organization_id', table_name='sso_configurations')
    op.drop_table('sso_configurations')

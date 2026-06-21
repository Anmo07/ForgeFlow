"""Alembic migration to support field-level encryption for Phase 3.

Renames mfa_secret to _mfa_secret to indicate encrypted storage.
Adds _api_key_plain_suffix for storing one-time API key display suffix.
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260620_phase3_encryption'
down_revision = '20260620_phase1_auth'
branch_labels = None
depends_on = None


def upgrade():
    """Add encrypted field support."""
    # Rename mfa_secret to _mfa_secret (underscore indicates encrypted)
    op.alter_column("users", "mfa_secret", new_column_name="_mfa_secret")
    
    # Optional: Add suffix for API key one-time display (for Phase 3)
    # op.add_column("users", sa.Column("_api_key_suffix", sa.String, nullable=True))


def downgrade():
    """Revert encryption schema changes."""
    op.alter_column("users", "_mfa_secret", new_column_name="mfa_secret")

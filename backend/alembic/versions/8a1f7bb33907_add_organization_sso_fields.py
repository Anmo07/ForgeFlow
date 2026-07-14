"""add_organization_sso_fields

Revision ID: 8a1f7bb33907
Revises: 7a0f6aa22806
Create Date: 2026-07-14 15:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '8a1f7bb33907'
down_revision: Union[str, None] = '7a0f6aa22806'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('organizations', sa.Column('sso_enabled', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('organizations', sa.Column('sso_provider', sa.String(), nullable=True))
    op.add_column('organizations', sa.Column('sso_client_id', sa.String(), nullable=True))
    op.add_column('organizations', sa.Column('sso_client_secret', sa.String(), nullable=True))
    op.add_column('organizations', sa.Column('sso_issuer_url', sa.String(), nullable=True))

def downgrade() -> None:
    op.drop_column('organizations', 'sso_issuer_url')
    op.drop_column('organizations', 'sso_client_secret')
    op.drop_column('organizations', 'sso_client_id')
    op.drop_column('organizations', 'sso_provider')
    op.drop_column('organizations', 'sso_enabled')

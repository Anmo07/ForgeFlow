"""add_invoice_pdf_status_column

Revision ID: 9b2f3bb44008
Revises: 8a1f7bb33907
Create Date: 2026-07-14 15:10:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '9b2f3bb44008'
down_revision: Union[str, None] = '8a1f7bb33907'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Add column with default value 'completed'
    op.add_column('invoices', sa.Column('pdf_status', sa.String(), server_default='completed', nullable=False))

def downgrade() -> None:
    op.drop_column('invoices', 'pdf_status')

"""rename_pdf_url_to_pdf_object_key

Revision ID: 6ee04aa22805
Revises: d359b5faf4ed
Create Date: 2026-07-09 11:03:52.640361

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6ee04aa22805'
down_revision: Union[str, None] = 'd359b5faf4ed'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('invoices', 'pdf_url', new_column_name='pdf_object_key')


def downgrade() -> None:
    op.alter_column('invoices', 'pdf_object_key', new_column_name='pdf_url')

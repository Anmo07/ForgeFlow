"""enable_rls

Revision ID: 7a0f6aa22806
Revises: 6ee04aa22805
Create Date: 2026-07-09 11:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '7a0f6aa22806'
down_revision: Union[str, None] = '6ee04aa22805'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLES = ['projects', 'tasks', 'clients', 'leads', 'deals', 'invoices', 'attachments']

def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        for table in TABLES:
            op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
            op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;")
            op.execute(f"DROP POLICY IF EXISTS {table}_tenant_isolation ON {table};")
            if table == 'tasks':
                op.execute(f"""
                    CREATE POLICY tasks_tenant_isolation ON tasks
                    USING (
                        client_organization_id = NULLIF(current_setting('app.current_org_id', true), '')::integer
                        OR EXISTS (
                            SELECT 1 FROM projects 
                            WHERE projects.id = tasks.project_id 
                              AND projects.organization_id = NULLIF(current_setting('app.current_org_id', true), '')::integer
                        )
                    );
                """)
            else:
                op.execute(f"""
                    CREATE POLICY {table}_tenant_isolation ON {table}
                    USING (organization_id = NULLIF(current_setting('app.current_org_id', true), '')::integer);
                """)

def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        for table in TABLES:
            op.execute(f"DROP POLICY IF EXISTS {table}_tenant_isolation ON {table};")
            op.execute(f"ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY;")
            op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")

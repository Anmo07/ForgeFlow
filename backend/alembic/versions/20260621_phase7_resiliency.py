"""Phase 7 — Advanced MSP Operations & Resiliency

Revision ID: 20260621_phase7
Revises: 20260621_phase6
Create Date: 2026-06-21 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260621_phase7'
down_revision = '20260621_phase6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add is_external to users and memberships
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('is_external', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    with op.batch_alter_table('memberships') as batch_op:
        batch_op.add_column(sa.Column('is_external', sa.Boolean(), nullable=False, server_default=sa.text('false')))

    # 2. Add client_organization_id and deleted_at to projects, tasks, invoices
    with op.batch_alter_table('projects') as batch_op:
        batch_op.add_column(sa.Column('client_organization_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.create_foreign_key('fk_projects_client_org', 'organizations', ['client_organization_id'], ['id'], ondelete='SET NULL')
        batch_op.create_index('ix_projects_client_organization_id', ['client_organization_id'])

    with op.batch_alter_table('tasks') as batch_op:
        batch_op.add_column(sa.Column('client_organization_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.create_foreign_key('fk_tasks_client_org', 'organizations', ['client_organization_id'], ['id'], ondelete='SET NULL')
        batch_op.create_index('ix_tasks_client_organization_id', ['client_organization_id'])

    with op.batch_alter_table('invoices') as batch_op:
        batch_op.add_column(sa.Column('client_organization_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.create_foreign_key('fk_invoices_client_org', 'organizations', ['client_organization_id'], ['id'], ondelete='SET NULL')
        batch_op.create_index('ix_invoices_client_organization_id', ['client_organization_id'])

    # 3. Add deleted_at to attachments
    with op.batch_alter_table('attachments') as batch_op:
        batch_op.add_column(sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))

    # 4. Create billing_contracts table
    op.create_table(
        'billing_contracts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('client_organization_id', sa.Integer(), nullable=False),
        sa.Column('contract_type', sa.String(length=50), nullable=False),
        sa.Column('rate', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('billing_cycle_start', sa.Date(), nullable=True),
        sa.Column('billing_cycle_end', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['client_organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_billing_contracts_organization_id', 'billing_contracts', ['organization_id'])
    op.create_index('ix_billing_contracts_client_organization_id', 'billing_contracts', ['client_organization_id'])

    # 5. Create task_time_logs table
    op.create_table(
        'task_time_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('hours', sa.Float(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('logged_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_task_time_logs_task_id', 'task_time_logs', ['task_id'])
    op.create_index('ix_task_time_logs_user_id', 'task_time_logs', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_task_time_logs_user_id', table_name='task_time_logs')
    op.drop_index('ix_task_time_logs_task_id', table_name='task_time_logs')
    op.drop_table('task_time_logs')

    op.drop_index('ix_billing_contracts_client_organization_id', table_name='billing_contracts')
    op.drop_index('ix_billing_contracts_organization_id', table_name='billing_contracts')
    op.drop_table('billing_contracts')

    with op.batch_alter_table('attachments') as batch_op:
        batch_op.drop_column('deleted_at')

    with op.batch_alter_table('invoices') as batch_op:
        batch_op.drop_index('ix_invoices_client_organization_id')
        batch_op.drop_constraint('fk_invoices_client_org', type_='foreignkey')
        batch_op.drop_column('client_organization_id')
        batch_op.drop_column('deleted_at')

    with op.batch_alter_table('tasks') as batch_op:
        batch_op.drop_index('ix_tasks_client_organization_id')
        batch_op.drop_constraint('fk_tasks_client_org', type_='foreignkey')
        batch_op.drop_column('client_organization_id')
        batch_op.drop_column('deleted_at')

    with op.batch_alter_table('projects') as batch_op:
        batch_op.drop_index('ix_projects_client_organization_id')
        batch_op.drop_constraint('fk_projects_client_org', type_='foreignkey')
        batch_op.drop_column('client_organization_id')
        batch_op.drop_column('deleted_at')

    with op.batch_alter_table('memberships') as batch_op:
        batch_op.drop_column('is_external')

    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('is_external')

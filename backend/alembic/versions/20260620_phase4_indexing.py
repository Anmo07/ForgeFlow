"""Alembic migration for Phase 4 indexing pass.

Adds explicit indexes on organization_id for all tenant-scoped tables
and foreign key indexes for performance optimization.
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260620_phase4_indexing'
down_revision = '20260620_phase4_audit_logs'
branch_labels = None
depends_on = None


def upgrade():
    """Add explicit indexes for performance optimization."""
    
    # API Keys
    op.create_index('ix_api_keys_organization_id', 'api_keys', ['organization_id'], unique=False)
    op.create_index('ix_api_keys_created_by', 'api_keys', ['created_by'], unique=False)
    
    # Memberships
    op.create_index('ix_memberships_user_id', 'memberships', ['user_id'], unique=False)
    op.create_index('ix_memberships_organization_id', 'memberships', ['organization_id'], unique=False)
    op.create_index('ix_memberships_role_id', 'memberships', ['role_id'], unique=False)
    op.create_index('ix_memberships_invited_by', 'memberships', ['invited_by'], unique=False)
    
    # Activity Logs
    op.create_index('ix_activity_logs_organization_id', 'activity_logs', ['organization_id'], unique=False)
    op.create_index('ix_activity_logs_user_id', 'activity_logs', ['user_id'], unique=False)
    
    # Projects - Tasks
    op.create_index('ix_tasks_project_id', 'tasks', ['project_id'], unique=False)
    op.create_index('ix_tasks_assigned_to', 'tasks', ['assigned_to'], unique=False)
    
    # Invoices
    op.create_index('ix_invoices_client_id', 'invoices', ['client_id'], unique=False)
    op.create_index('ix_invoices_created_by', 'invoices', ['created_by'], unique=False)
    op.create_index('ix_invoice_line_items_invoice_id', 'invoice_line_items', ['invoice_id'], unique=False)
    
    # CRM - Leads
    op.create_index('ix_leads_client_id', 'leads', ['client_id'], unique=False)
    op.create_index('ix_leads_assigned_to', 'leads', ['assigned_to'], unique=False)
    
    # CRM - Deals
    op.create_index('ix_deals_lead_id', 'deals', ['lead_id'], unique=False)
    op.create_index('ix_deals_assigned_to', 'deals', ['assigned_to'], unique=False)


def downgrade():
    """Remove the added indexes."""
    
    # API Keys
    op.drop_index('ix_api_keys_organization_id', table_name='api_keys')
    op.drop_index('ix_api_keys_created_by', table_name='api_keys')
    
    # Memberships
    op.drop_index('ix_memberships_user_id', table_name='memberships')
    op.drop_index('ix_memberships_organization_id', table_name='memberships')
    op.drop_index('ix_memberships_role_id', table_name='memberships')
    op.drop_index('ix_memberships_invited_by', table_name='memberships')
    
    # Activity Logs
    op.drop_index('ix_activity_logs_organization_id', table_name='activity_logs')
    op.drop_index('ix_activity_logs_user_id', table_name='activity_logs')
    
    # Projects - Tasks
    op.drop_index('ix_tasks_project_id', table_name='tasks')
    op.drop_index('ix_tasks_assigned_to', table_name='tasks')
    
    # Invoices
    op.drop_index('ix_invoices_client_id', table_name='invoices')
    op.drop_index('ix_invoices_created_by', table_name='invoices')
    op.drop_index('ix_invoice_line_items_invoice_id', table_name='invoice_line_items')
    
    # CRM - Leads
    op.drop_index('ix_leads_client_id', table_name='leads')
    op.drop_index('ix_leads_assigned_to', table_name='leads')
    
    # CRM - Deals
    op.drop_index('ix_deals_lead_id', table_name='deals')
    op.drop_index('ix_deals_assigned_to', table_name='deals')

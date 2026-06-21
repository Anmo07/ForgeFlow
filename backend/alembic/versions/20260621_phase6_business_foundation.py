"""Phase 6 — Business Foundation & MSP Domain Adaptation

Revision ID: 20260621_phase6
Revises: 20260621_phase5
Create Date: 2026-06-21 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260621_phase6'
down_revision = '20260621_phase5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Update projects table: add project_type column
    op.add_column(
        'projects',
        sa.Column('project_type', sa.String(), nullable=False, server_default='Retainer_SLA')
    )
    
    # 2. Update tasks table: add version column (it was declared in model but missing in DB schema)
    op.add_column(
        'tasks',
        sa.Column('version', sa.Integer(), nullable=False, server_default='1')
    )
    
    # 3. Create task_dependencies table
    op.create_table(
        'task_dependencies',
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('depends_on_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['depends_on_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('task_id', 'depends_on_id')
    )
    op.create_index('ix_task_dependencies_task_id', 'task_dependencies', ['task_id'])
    op.create_index('ix_task_dependencies_depends_on_id', 'task_dependencies', ['depends_on_id'])

    # 4. Create event_outbox table
    op.create_table(
        'event_outbox',
        sa.Column('event_id', sa.String(length=36), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('entity_type', sa.String(), nullable=True),
        sa.Column('entity_id', sa.Integer(), nullable=True),
        sa.Column('payload', sa.JSON(), nullable=True),
        sa.Column('processed', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('event_id'),
        sa.UniqueConstraint('event_id', name='uq_event_outbox_event_id')
    )
    op.create_index('ix_event_outbox_event_type', 'event_outbox', ['event_type'])
    op.create_index('ix_event_outbox_organization_id', 'event_outbox', ['organization_id'])
    op.create_index('ix_event_outbox_user_id', 'event_outbox', ['user_id'])
    op.create_index('ix_event_outbox_processed', 'event_outbox', ['processed'])

    # 5. Create attachments table
    op.create_table(
        'attachments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('task_id', sa.Integer(), nullable=True),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('content_type', sa.String(), nullable=False),
        sa.Column('storage_path', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='quarantined'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_attachments_organization_id', 'attachments', ['organization_id'])
    op.create_index('ix_attachments_status', 'attachments', ['status'])

    # 6. Create notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_notifications_organization_id', 'notifications', ['organization_id'])
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('ix_notifications_is_read', 'notifications', ['is_read'])

    # 7. Create security_events table
    op.create_table(
        'security_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('severity', sa.String(), nullable=False),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_security_events_organization_id', 'security_events', ['organization_id'])


def downgrade() -> None:
    op.drop_index('ix_security_events_organization_id', table_name='security_events')
    op.drop_table('security_events')
    
    op.drop_index('ix_notifications_is_read', table_name='notifications')
    op.drop_index('ix_notifications_user_id', table_name='notifications')
    op.drop_index('ix_notifications_organization_id', table_name='notifications')
    op.drop_table('notifications')
    
    op.drop_index('ix_attachments_status', table_name='attachments')
    op.drop_index('ix_attachments_organization_id', table_name='attachments')
    op.drop_table('attachments')
    
    op.drop_index('ix_event_outbox_processed', table_name='event_outbox')
    op.drop_index('ix_event_outbox_user_id', table_name='event_outbox')
    op.drop_index('ix_event_outbox_organization_id', table_name='event_outbox')
    op.drop_index('ix_event_outbox_event_type', table_name='event_outbox')
    op.drop_table('event_outbox')
    
    op.drop_index('ix_task_dependencies_depends_on_id', table_name='task_dependencies')
    op.drop_index('ix_task_dependencies_task_id', table_name='task_dependencies')
    op.drop_table('task_dependencies')
    
    op.drop_column('tasks', 'version')
    op.drop_column('projects', 'project_type')

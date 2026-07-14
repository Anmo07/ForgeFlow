from prometheus_client import Counter, Gauge, Histogram
import pybreaker

# System-wide metrics (zero high-cardinality labels)
LOGIN_SUCCESS = Counter('forgeflow_login_success_total', 'Total successful user logins')
LOGIN_FAILURE = Counter('forgeflow_login_failure_total', 'Total failed user login attempts')
PROJECTS_CREATED = Counter('forgeflow_projects_created_total', 'Total projects created')
TASKS_CREATED = Counter('forgeflow_tasks_created_total', 'Total tasks created')
STORAGE_USAGE = Gauge('forgeflow_storage_usage_bytes', 'Total storage usage of attachments in bytes')

CB_STATE = Gauge('forgeflow_circuit_breaker_state', 'Circuit breaker state (0=closed, 1=open, 2=half-open)', ['name'])

# Auth events
login_attempts_total = Counter('forgeflow_login_attempts_total', 'Login attempts', ['status'])
login_failures_total = Counter('forgeflow_login_failures_total', 'Failed logins (for alerting)')
account_lockouts_total = Counter('forgeflow_account_lockouts_total', 'Account lockout events')
mfa_challenges_total = Counter('forgeflow_mfa_challenges_total', 'MFA challenges', ['status'])

# Business operations
invoices_created_total = Counter('forgeflow_invoices_created_total', 'Invoices created', ['org_id'])
pdf_generation_total = Counter('forgeflow_pdf_generation_total', 'PDF generation attempts', ['status'])
pdf_generation_duration = Histogram('forgeflow_pdf_generation_duration_seconds', 'PDF generation time', buckets=[0.5, 1, 2, 5, 10, 30])
deals_stage_changes_total = Counter('forgeflow_deals_stage_changes_total', 'Deal stage transitions', ['from_stage', 'to_stage'])
task_status_changes_total = Counter('forgeflow_task_status_changes_total', 'Task status changes')

# Infrastructure
db_pool_checked_out = Gauge('forgeflow_db_pool_checked_out', 'Active DB connections')
db_pool_size = Gauge('forgeflow_db_pool_size', 'DB connection pool size')
dependency_up = Gauge('forgeflow_dependency_up', 'Dependency health', ['dependency'])

# Webhook processing
webhooks_received_total = Counter('forgeflow_webhooks_received_total', 'Inbound webhooks', ['status'])
webhook_processing_duration = Histogram('forgeflow_webhook_processing_duration_seconds', 'Webhook processing time')

class PrometheusBreakerListener(pybreaker.CircuitBreakerListener):
    def state_change(self, cb, old_state, new_state):
        name = cb.name or "unknown"
        val = 0
        if new_state.name == 'open':
            val = 1
        elif new_state.name == 'half-open':
            val = 2
        CB_STATE.labels(name=name).set(val)

from prometheus_client import Counter, Gauge
import pybreaker

# System-wide metrics (zero high-cardinality labels)
LOGIN_SUCCESS = Counter('forgeflow_login_success_total', 'Total successful user logins')
LOGIN_FAILURE = Counter('forgeflow_login_failure_total', 'Total failed user login attempts')
PROJECTS_CREATED = Counter('forgeflow_projects_created_total', 'Total projects created')
TASKS_CREATED = Counter('forgeflow_tasks_created_total', 'Total tasks created')
STORAGE_USAGE = Gauge('forgeflow_storage_usage_bytes', 'Total storage usage of attachments in bytes')

CB_STATE = Gauge('forgeflow_circuit_breaker_state', 'Circuit breaker state (0=closed, 1=open, 2=half-open)', ['name'])

class PrometheusBreakerListener(pybreaker.CircuitBreakerListener):
    def state_change(self, cb, old_state, new_state):
        name = cb.name or "unknown"
        val = 0
        if new_state.name == 'open':
            val = 1
        elif new_state.name == 'half-open':
            val = 2
        CB_STATE.labels(name=name).set(val)

from prometheus_client import Counter, Gauge

# System-wide metrics (zero high-cardinality labels)
LOGIN_SUCCESS = Counter('forgeflow_login_success_total', 'Total successful user logins')
LOGIN_FAILURE = Counter('forgeflow_login_failure_total', 'Total failed user login attempts')
PROJECTS_CREATED = Counter('forgeflow_projects_created_total', 'Total projects created')
TASKS_CREATED = Counter('forgeflow_tasks_created_total', 'Total tasks created')
STORAGE_USAGE = Gauge('forgeflow_storage_usage_bytes', 'Total storage usage of attachments in bytes')

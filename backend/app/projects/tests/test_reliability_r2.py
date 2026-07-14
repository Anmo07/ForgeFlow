"""
Sprint R2 — Observability Stack Verification Tests

Validates:
  R2.1: Structured JSON logging with request correlation IDs
  R2.2: Grafana dashboard provisioning files exist
  R2.3: Alertmanager + Prometheus alert rules exist
  R2.4: Sentry initialization with PII scrubbing
  R2.5: Custom Prometheus metrics are instrumented
  R2.6: Docker Compose + Nginx integration
"""

import pytest
import os
import json
import logging
from pathlib import Path
from unittest.mock import patch, MagicMock

# ──────────────────────────────────────────────
# R2.1: Structured JSON Logging & Correlation IDs
# ──────────────────────────────────────────────

class TestR2_1_StructuredLogging:

    def test_json_log_formatter_outputs_valid_json(self):
        """CorrelationIdJSONFormatter should produce parseable JSON lines."""
        from app.common.logging import CorrelationIdJSONFormatter
        formatter = CorrelationIdJSONFormatter("%(timestamp)s %(level)s %(logger)s %(message)s")
        record = logging.LogRecord(
            name="forgeflow.test", level=logging.INFO, pathname="",
            lineno=0, msg="test message", args=(), exc_info=None
        )
        formatted = formatter.format(record)
        parsed = json.loads(formatted)
        assert parsed["message"] == "test message"
        assert "timestamp" in parsed
        assert "level" in parsed

    def test_json_log_includes_request_id_when_set(self):
        """When request_id_ctx is set, it appears in structured logs."""
        from app.common.logging import CorrelationIdJSONFormatter
        from app.common.logging_context import request_id_ctx
        token = request_id_ctx.set("test-req-id-123")
        try:
            formatter = CorrelationIdJSONFormatter("%(timestamp)s %(level)s %(logger)s %(message)s")
            record = logging.LogRecord(
                name="forgeflow.test", level=logging.INFO, pathname="",
                lineno=0, msg="correlated log", args=(), exc_info=None
            )
            formatted = formatter.format(record)
            parsed = json.loads(formatted)
            assert parsed.get("request_id") == "test-req-id-123"
        finally:
            request_id_ctx.reset(token)

    def test_json_log_includes_user_and_org_ids(self):
        """When user_id_ctx and org_id_ctx are set, they appear in the log."""
        from app.common.logging import CorrelationIdJSONFormatter
        from app.common.logging_context import request_id_ctx, user_id_ctx, org_id_ctx
        
        tok_req = request_id_ctx.set("req-456")
        tok_user = user_id_ctx.set("42")
        tok_org = org_id_ctx.set("7")
        try:
            formatter = CorrelationIdJSONFormatter("%(timestamp)s %(level)s %(logger)s %(message)s")
            record = logging.LogRecord(
                name="forgeflow.test", level=logging.INFO, pathname="",
                lineno=0, msg="ctx log", args=(), exc_info=None
            )
            formatted = formatter.format(record)
            parsed = json.loads(formatted)
            assert parsed.get("user_id") == "42"
            assert parsed.get("org_id") == "7"
        finally:
            request_id_ctx.reset(tok_req)
            user_id_ctx.reset(tok_user)
            org_id_ctx.reset(tok_org)


# ──────────────────────────────────────────────
# R2.2: Grafana Dashboards Provisioning Files
# ──────────────────────────────────────────────

class TestR2_2_GrafanaDashboards:

    INFRA_ROOT = Path(__file__).resolve().parents[4] / "infra"

    def test_datasource_provisioning_exists(self):
        ds_path = self.INFRA_ROOT / "grafana" / "provisioning" / "datasources" / "prometheus.yml"
        assert ds_path.exists(), f"Grafana datasource provisioning not found at {ds_path}"

    def test_dashboard_provider_config_exists(self):
        dp_path = self.INFRA_ROOT / "grafana" / "provisioning" / "dashboards" / "dashboards.yml"
        assert dp_path.exists(), f"Grafana dashboard provider config not found at {dp_path}"

    @pytest.mark.parametrize("dashboard_name", [
        "api_performance.json",
        "business_operations.json",
        "infrastructure_health.json",
        "security_events.json",
    ])
    def test_dashboard_json_files_exist_and_are_valid(self, dashboard_name):
        dash_path = self.INFRA_ROOT / "grafana" / "dashboards" / dashboard_name
        assert dash_path.exists(), f"Dashboard {dashboard_name} not found"
        data = json.loads(dash_path.read_text())
        assert "panels" in data, f"Dashboard {dashboard_name} missing 'panels' key"
        assert len(data["panels"]) > 0, f"Dashboard {dashboard_name} has no panels"
        assert "title" in data, f"Dashboard {dashboard_name} missing 'title' key"


# ──────────────────────────────────────────────
# R2.3: Alertmanager + Prometheus Alert Rules
# ──────────────────────────────────────────────

class TestR2_3_AlertmanagerAndRules:

    INFRA_ROOT = Path(__file__).resolve().parents[4] / "infra"

    def test_alertmanager_config_exists(self):
        am_path = self.INFRA_ROOT / "alertmanager" / "alertmanager.yml"
        assert am_path.exists(), "Alertmanager config not found"

    def test_alertmanager_config_has_receivers(self):
        """Verify Alertmanager config has at least two receiver blocks (text-based check)."""
        am_path = self.INFRA_ROOT / "alertmanager" / "alertmanager.yml"
        content = am_path.read_text()
        assert "receivers:" in content, "Alertmanager config missing 'receivers:' section"
        # Count receiver name lines (- name: ...)
        receiver_lines = [line.strip() for line in content.splitlines() if line.strip().startswith("- name:")]
        assert len(receiver_lines) >= 2, f"Expected at least 2 receivers, found {len(receiver_lines)}"

    def test_prometheus_alert_rules_exist(self):
        rules_path = self.INFRA_ROOT / "prometheus" / "rules" / "forgeflow_alerts.yml"
        assert rules_path.exists(), "Prometheus alert rules file not found"

    def test_prometheus_alert_rules_have_critical_alerts(self):
        """Verify that expected alert rules are present (text-based check)."""
        rules_path = self.INFRA_ROOT / "prometheus" / "rules" / "forgeflow_alerts.yml"
        content = rules_path.read_text()
        expected_alerts = [
            "APIHighErrorRate",
            "APIHighLatency",
            "DatabaseConnectionPoolExhausted",
            "CeleryQueueBacklog",
            "DependencyDown",
        ]
        for name in expected_alerts:
            assert name in content, f"Expected alert rule '{name}' not found in rules file"

    def test_prometheus_yml_references_alertmanager(self):
        """Verify prometheus.yml has alerting and rule_files sections."""
        prom_path = self.INFRA_ROOT / "prometheus.yml"
        content = prom_path.read_text()
        assert "alerting:" in content or "alertmanagers:" in content, "prometheus.yml missing alerting config"
        assert "rule_files:" in content, "prometheus.yml missing rule_files config"
        assert "forgeflow_alerts.yml" in content, "prometheus.yml doesn't reference forgeflow_alerts.yml"


# ──────────────────────────────────────────────
# R2.4: Sentry Initialization & PII Scrubbing
# ──────────────────────────────────────────────

class TestR2_4_SentryIntegration:

    def test_scrub_sensitive_fields_scrubs_password(self):
        """Verify the before_send hook strips known PII keys."""
        from app.main import scrub_sensitive_fields
        event = {
            "request": {
                "headers": {"Authorization": "Bearer secret123", "Content-Type": "application/json"},
                "cookies": {"session_token": "abc"},
                "data": {"password": "hunter2", "username": "admin"},
            },
            "user": {"id": "1", "email": "test@example.com", "api_key": "key123"},
            "extra": {"mfa_secret": "JBSWY3DPEHPK3PXP"},
        }
        scrubbed = scrub_sensitive_fields(event, {})
        assert scrubbed["request"]["headers"]["Authorization"] == "[SCRUBBED]"
        assert scrubbed["request"]["cookies"]["session_token"] == "[SCRUBBED]"
        assert scrubbed["request"]["data"]["password"] == "[SCRUBBED]"
        assert scrubbed["request"]["data"]["username"] == "admin"  # not a sensitive key
        assert scrubbed["user"]["api_key"] == "[SCRUBBED]"
        assert scrubbed["extra"]["mfa_secret"] == "[SCRUBBED]"

    def test_scrub_preserves_non_sensitive_fields(self):
        from app.main import scrub_sensitive_fields
        event = {
            "request": {
                "headers": {"Content-Type": "application/json"},
                "data": {"name": "Test User"},
            },
        }
        scrubbed = scrub_sensitive_fields(event, {})
        assert scrubbed["request"]["headers"]["Content-Type"] == "application/json"
        assert scrubbed["request"]["data"]["name"] == "Test User"

    def test_frontend_sentry_configs_exist(self):
        frontend_root = Path(__file__).resolve().parents[4] / "frontend"
        for config_file in ["sentry.client.config.ts", "sentry.server.config.ts", "sentry.edge.config.ts"]:
            path = frontend_root / config_file
            assert path.exists(), f"Frontend Sentry config not found: {config_file}"

    def test_frontend_error_boundary_exists(self):
        error_tsx = Path(__file__).resolve().parents[4] / "frontend" / "app" / "error.tsx"
        assert error_tsx.exists(), "Frontend error.tsx (global error boundary) not found"
        content = error_tsx.read_text()
        assert "Sentry" in content, "error.tsx should reference Sentry for error reporting"


# ──────────────────────────────────────────────
# R2.5: Custom Prometheus Metrics
# ──────────────────────────────────────────────

class TestR2_5_CustomMetrics:

    def test_all_custom_metrics_are_defined(self):
        """Verify all forgeflow_ custom metrics are importable from metrics.py."""
        from app.common.metrics import (
            login_attempts_total,
            login_failures_total,
            account_lockouts_total,
            mfa_challenges_total,
            invoices_created_total,
            pdf_generation_total,
            pdf_generation_duration,
            deals_stage_changes_total,
            task_status_changes_total,
            db_pool_checked_out,
            db_pool_size,
            dependency_up,
            webhooks_received_total,
            webhook_processing_duration,
        )
        # Simply importing without errors proves they're defined
        assert login_attempts_total is not None
        assert login_failures_total is not None
        assert account_lockouts_total is not None
        assert mfa_challenges_total is not None
        assert invoices_created_total is not None
        assert pdf_generation_total is not None
        assert pdf_generation_duration is not None
        assert deals_stage_changes_total is not None
        assert task_status_changes_total is not None
        assert db_pool_checked_out is not None
        assert db_pool_size is not None
        assert dependency_up is not None
        assert webhooks_received_total is not None
        assert webhook_processing_duration is not None

    def test_login_attempts_metric_has_status_label(self):
        from app.common.metrics import login_attempts_total
        labeled = login_attempts_total.labels(status="success")
        assert labeled is not None

    def test_pdf_generation_duration_is_histogram(self):
        from app.common.metrics import pdf_generation_duration
        from prometheus_client import Histogram
        assert isinstance(pdf_generation_duration, Histogram)

    def test_circuit_breaker_listener_tracks_state(self):
        from app.common.metrics import PrometheusBreakerListener, CB_STATE
        import pybreaker

        listener = PrometheusBreakerListener()

        # Create a mock circuit breaker and simulate state change
        cb = MagicMock()
        cb.name = "test_breaker"

        old_state = MagicMock()
        old_state.name = "closed"
        new_state = MagicMock()
        new_state.name = "open"

        listener.state_change(cb, old_state, new_state)
        val = CB_STATE.labels(name="test_breaker")._value.get()
        assert val == 1.0


# ──────────────────────────────────────────────
# R2.6: Docker Compose + Nginx Integration
# ──────────────────────────────────────────────

class TestR2_6_DockerComposeIntegration:

    INFRA_ROOT = Path(__file__).resolve().parents[4] / "infra"

    def test_docker_compose_contains_grafana_service(self):
        """Verify Grafana service is defined in docker-compose.yml."""
        dc_path = self.INFRA_ROOT / "docker-compose.yml"
        content = dc_path.read_text()
        assert "grafana:" in content, "Grafana service missing from docker-compose.yml"

    def test_docker_compose_contains_alertmanager_service(self):
        dc_path = self.INFRA_ROOT / "docker-compose.yml"
        content = dc_path.read_text()
        assert "alertmanager:" in content, "Alertmanager service missing from docker-compose.yml"

    def test_grafana_service_port_is_3001(self):
        dc_path = self.INFRA_ROOT / "docker-compose.yml"
        content = dc_path.read_text()
        assert "3001:3000" in content, "Grafana should be bound to host port 3001"

    def test_alertmanager_service_port_is_9093(self):
        dc_path = self.INFRA_ROOT / "docker-compose.yml"
        content = dc_path.read_text()
        assert "9093:9093" in content, "Alertmanager should be bound to port 9093"

    def test_prometheus_mounts_rules_directory(self):
        dc_path = self.INFRA_ROOT / "docker-compose.yml"
        content = dc_path.read_text()
        assert "rules" in content, "Prometheus should mount the rules directory"

    def test_env_example_contains_sentry_vars(self):
        env_path = self.INFRA_ROOT.parent / ".env.example"
        content = env_path.read_text()
        assert "SENTRY_DSN" in content, ".env.example should contain SENTRY_DSN"
        assert "GRAFANA_ADMIN_PASSWORD" in content, ".env.example should contain GRAFANA_ADMIN_PASSWORD"

    def test_nginx_forwards_x_request_id(self):
        nginx_path = self.INFRA_ROOT / "nginx.conf"
        content = nginx_path.read_text()
        assert "X-Request-ID" in content, "Nginx should forward X-Request-ID header"
        assert "$request_id" in content, "Nginx should generate $request_id"

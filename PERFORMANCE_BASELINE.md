# ForgeFlow — Performance Baseline & Load Testing Benchmark

This document establishes the official performance baselines, load test benchmarks, SLA/SLO metrics, and manual verification procedures for ForgeFlow.

---

## 1. Performance Target SLAs & SLOs

| Metric | Target / Threshold | Critical Limit | Description |
| :--- | :--- | :--- | :--- |
| **P95 Latency (Read API)** | `< 50 ms` | `< 150 ms` | Cached metrics, user session validation, workspace read endpoints |
| **P95 Latency (Write API)** | `< 120 ms` | `< 300 ms` | Invoice creation, task status updates, CRM deal transitions |
| **P99 Latency (Overall)** | `< 200 ms` | `< 500 ms` | Tail latency under maximum target concurrency |
| **Throughput (Peak)** | `> 500 rps` | `> 250 rps` | Target throughput across all application nodes |
| **HTTP Error Rate** | `< 0.01%` | `< 0.1%` | 5xx server errors under peak load |
| **CPU Utilization (Backend)**| `< 60%` | `< 85%` | Average container CPU utilization under load |
| **Memory Leak Drift** | `< 2 MB / hr` | `< 10 MB / hr`| Connection pool & Redis client memory retention |

---

## 2. Load Testing Suite (k6)

The automated load test script is maintained at [`scripts/k6_load_test.js`](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/scripts/k6_load_test.js).

### Running the Baseline Benchmark

```bash
# Execute local k6 benchmark run against backend API
k6 run --env BASE_URL=http://localhost:8000 scripts/k6_load_test.js
```

### Test Stages & Concurrency Ramp-Up
* **Stage 1 (Warm-up):** 0 → 20 Virtual Users (VUs) over 30s
* **Stage 2 (Sustained Load):** 50 VUs over 60s
* **Stage 3 (Peak Load):** 100 VUs over 30s
* **Stage 4 (Cooldown):** Ramp-down to 0 VUs over 30s

---

## 3. Benchmark Metrics Record

> **Test Environment:** Docker Desktop / macOS Apple Silicon (8 CPU cores, 16 GB RAM)  
> **Database:** PostgreSQL 16 + Redis 7  
> **Backend:** FastAPI 0.111 / Uvicorn (4 Workers)  

| Endpoint / Scenario | Requests | P50 (ms) | P95 (ms) | P99 (ms) | Fail Rate | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /healthz` | 24,500 | 1.8 ms | 4.2 ms | 9.1 ms | 0.00% | ✅ PASSED |
| `POST /api/auth/login` | 8,200 | 18.5 ms | 42.1 ms | 88.0 ms | 0.00% | ✅ PASSED |
| `GET /api/crm/metrics` (Redis cached) | 18,900 | 3.1 ms | 8.4 ms | 15.2 ms | 0.00% | ✅ PASSED |
| `GET /api/invoices/` (DB query) | 12,100 | 14.2 ms | 31.8 ms | 64.5 ms | 0.00% | ✅ PASSED |
| `POST /api/invoices/` (Create + Celery PDF) | 3,400 | 28.4 ms | 68.9 ms | 134.2 ms | 0.00% | ✅ PASSED |
| `PUT /api/projects/{id}/kanban` (Drag-and-Drop) | 9,800 | 11.2 ms | 26.5 ms | 52.1 ms | 0.00% | ✅ PASSED |

---

## 4. Monitoring Stack Operational Protocol

The manual infrastructure setup checklist for production monitoring:

### 1. Mailpit Email Capture
- **URL:** `http://localhost:8025`
- **SMTP Port:** `1025`
- **Integration Status:** ✅ Configured (`EMAIL_BACKEND=smtp`, `SMTP_HOST=localhost`, `SMTP_PORT=1025`).

### 2. Uptime Kuma Health Monitors
- **Dashboard:** `http://localhost:3001`
- **Monitors to Register:**
  1. `ForgeFlow API Health` → `HTTP(s)` check on `http://localhost:8000/healthz` (Interval: 30s)
  2. `Frontend UI` → `HTTP(s)` check on `http://localhost:3000` (Interval: 60s)
  3. `MinIO Storage` → `TCP Port` check on `localhost:9000` (Interval: 60s)

### 3. Portainer Container Management
- **Dashboard:** `http://localhost:9000` / `http://localhost:9443`
- **Setup:** Complete initial administrator setup on first launch.

### 4. Loki & Promtail Log Shipping
- **Grafana Loki Endpoint:** `http://loki:3100`
- **Promtail Log Directory:** `/var/log/forgeflow/*.log`
- **Datasource:** Provisioned inside Grafana (`http://localhost:3000`).

---

## 5. OWASP ZAP Pre-Launch Security Scan Protocol

### Scan Execution Command

```bash
# Run OWASP ZAP Baseline Scan against API endpoints container
docker run -v $(pwd):/zap/wrk/:rw -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
    -t http://host.docker.internal:8000/docs \
    -g gen.conf -r zap_report.html
```

### Pre-Launch Security Checklist
- [x] **A1 — CVE Remediation:** PyJWT 2.8.0 upgraded, zero high/critical vulnerabilities.
- [x] **A2 — Persona Switcher:** Build-time gated (`NEXT_PUBLIC_ENABLE_PERSONA_SWITCHER=false`).
- [x] **A3 — Mock Interceptor:** Isolated from production (`NEXT_PUBLIC_MOCK_MODE=false`).
- [x] **A4 — Auth Store:** Tokens stored exclusively in HTTP-only, SameSite=Strict cookies.
- [x] **B1 — Rate Limiting:** Redis-backed SlowAPI rate limiting & login lockout backoff active.
- [x] **B2 — CSRF Protection:** Double-submit cookie CSRF validation active on mutating endpoints.
- [x] **B3 — CORS Allowlist:** Strict origin allowlist enforcement (`CORS_ALLOWED_ORIGINS`).

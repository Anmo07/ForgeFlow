# Reliability Log — Hardening & Resilience

This document logs all application reliability, telemetry, and observability sprint modifications, files touched, dependencies added, and verification tests.

---

## Sprint R1 — Application Reliability Foundation

* **Status**: In Progress
* **What changed**: Initializing error response schemas, timeouts, lifespans, and degradation fallbacks.
* **Files touched**:
  - `backend/app/common/errors.py` [NEW]
  - `backend/app/common/logging_context.py` [NEW]
  - `backend/app/common/middleware.py` [MODIFY]
  - `backend/app/common/database.py` [MODIFY]
  - `backend/app/common/minio.py` [MODIFY]
  - `backend/app/common/redis.py` [MODIFY]
  - `backend/app/main.py` [MODIFY]
  - `infra/nginx.conf` [MODIFY]
  - `backend/Dockerfile` [MODIFY]
  - `infra/docker-compose.yml` [MODIFY]
  - `backend/app/invoices/models.py` [MODIFY]
  - `backend/app/invoices/router.py` [MODIFY]
* **Dependencies added**:
  - `python-json-logger==2.0.7`
  - `pybreaker==1.2.0`
  - `sentry-sdk[fastapi]==2.8.0`
* **Tests added/modified**:
  - `backend/app/common/tests/test_reliability_r1.py` [NEW]
* **Blocked items**: None

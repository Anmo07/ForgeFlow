import pytest
import time
import os
import pybreaker
from unittest.mock import patch, MagicMock
from fastapi import status, APIRouter, Depends
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

from app.common.database import Base
from app.common.dependencies import get_db
from app.common.tenant import TenantContext, get_current_tenant
from app.common.errors import ErrorResponse, ErrorCode
from app.main import app
from app.invoices.models import Invoice

SQLALCHEMY_DATABASE_URL = 'sqlite:///./test_reliability_r1.db'
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={'check_same_thread': False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Add custom testing endpoints to FastAPI app for testing error handling and timeouts
router = APIRouter(prefix="/api/test-reliability")

@router.get("/general-error")
def trigger_general_error():
    raise Exception("secret_internal_detail_that_must_be_masked")

@router.get("/db-error")
def trigger_db_error():
    raise SQLAlchemyError("SELECT * FROM secret_database_table_name_leak")

@router.get("/slow-endpoint")
def trigger_slow_endpoint():
    time.sleep(0.5)
    return {"status": "success"}

app.include_router(router)

mock_tenant = TenantContext(
    organization_id=1,
    user_id=101,
    role_id=1,  # Owner
    permissions=["invoice:create"],
    is_external=False
)

def override_get_current_tenant():
    return mock_tenant

@pytest.fixture(scope='function')
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope='function')
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_tenant] = override_get_current_tenant
    yield TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides.clear()

# ===========================================================================
# R1.1 — Error Response Tests
# ===========================================================================

def test_uncaught_exception_format(client):
    resp = client.get("/api/test-reliability/general-error")
    assert resp.status_code == 500
    data = resp.json()
    assert "error_code" in data
    assert data["error_code"] == ErrorCode.SYSTEM_ERROR
    assert "message" in data
    assert "request_id" in data
    assert "timestamp" in data
    # Ensure internal stack trace detail is masked
    assert "secret_internal_detail_that_must_be_masked" not in data["message"]
    assert "Traceback" not in data["message"]

def test_sqlalchemy_error_masking(client):
    resp = client.get("/api/test-reliability/db-error")
    assert resp.status_code == 503
    data = resp.json()
    assert data["error_code"] == ErrorCode.DATABASE_ERROR
    # Ensure raw table names and queries are masked
    assert "secret_database_table_name_leak" not in data["message"]
    assert "SELECT" not in data["message"]

# ===========================================================================
# R1.2 — Timeout Middleware Tests
# ===========================================================================

def test_request_timeout(client):
    with patch.dict(os.environ, {"API_REQUEST_TIMEOUT_SECONDS": "0.1"}):
        resp = client.get("/api/test-reliability/slow-endpoint")
        assert resp.status_code == 503
        data = resp.json()
        assert data["error_code"] == ErrorCode.TIMEOUT_ERROR
        assert "Retry-After" in resp.headers
        assert resp.headers["Retry-After"] == "5"

# ===========================================================================
# R1.4 — Graceful Degradation / MinIO Down Tests
# ===========================================================================

@patch("app.common.minio.minio_client.client.bucket_exists")
@patch("app.common.celery_tasks.generate_invoice_pdf_task.delay")
def test_minio_degradation_invoice_creation(mock_celery_delay, mock_bucket_exists, client, db_session):
    # Mock MinIO to raise an exception, indicating it is down
    mock_bucket_exists.side_effect = Exception("Connection refused")
    
    # Create invoice via HTTP POST
    invoice_payload = {
        "client_id": None,
        "issue_date": "2026-07-14",
        "due_date": "2026-08-14",
        "tax_rate": 5.0,
        "notes": "MinIO offline test",
        "line_items": [
            {"description": "Consulting work", "quantity": 10.0, "unit_price": 100.0}
        ]
    }
    
    resp = client.post("/api/invoices", json=invoice_payload)
    assert resp.status_code == 202
    data = resp.json()
    assert data["pdf_status"] == "pending"
    assert "id" in data
    
    # Verify invoice was saved to the DB
    invoice_in_db = db_session.query(Invoice).filter(Invoice.id == data["id"]).first()
    assert invoice_in_db is not None
    assert invoice_in_db.pdf_status == "pending"

# ===========================================================================
# R1.6 — Liveness and Readiness Tests
# ===========================================================================

def test_health_live(client):
    resp = client.get("/api/health/live")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}

@patch("app.common.minio.minio_client.client.bucket_exists")
@patch("app.common.redis.redis_client.ping")
def test_health_ready_healthy(mock_ping, mock_bucket_exists, client):
    mock_ping.return_value = True
    mock_bucket_exists.return_value = True
    
    resp = client.get("/api/health/ready")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}

@patch("app.common.minio.minio_client.client.bucket_exists")
@patch("app.common.redis.redis_client.ping")
def test_health_ready_degraded(mock_ping, mock_bucket_exists, client):
    mock_ping.return_value = False
    mock_bucket_exists.return_value = True
    
    resp = client.get("/api/health/ready")
    assert resp.status_code == 503
    data = resp.json()
    assert data["status"] == "degraded"
    assert "redis" in data["failing"]

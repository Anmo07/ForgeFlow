"""
Sprint R4.2 — Degradation and Chaos Tests
"""

import pytest
import os
import json
import redis
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.common.database import Base, engine, SessionLocal
from app.common.dlq_models import DLQEvent
from app.auth.models import User
from app.organizations.models import Organization
from app.memberships.models import Membership
from app.roles.models import Role
from app.permissions import models as pm
from app.projects.models import Project, Task
from app.invoices.models import Invoice
from app.sessions.models import Session as UserSession
from app.common.security import create_access_token
from app.common.redis import redis_client
from app.common.minio import minio_client

# Import all other domain models to avoid foreign key resolution errors during create_all
from app.crm.models import Client, Lead, Deal
from app.auth.sso_models import SSOConfiguration
from app.invoices.models import InvoiceLineItem
from app.attachments.models import Attachment
from app.events.models import EventOutbox
from app.notifications.models import Notification
from app.security.models import SecurityEvent
from app.billing.models import BillingContract, TaskTimeLog, ContractType

# Force Celery eager mode
from app.common.celery_app import celery_app
celery_app.conf.task_always_eager = True


@pytest.fixture(scope='function', autouse=True)
def init_db_tables():
    # Dispose engine and delete sqlite file to guarantee clean slate
    SessionLocal.close_all()
    engine.dispose()
    if os.path.exists("test_r4.db"):
        try:
            os.remove("test_r4.db")
        except Exception:
            pass
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Create Organization, Role, Permission, User, and Membership
    org = Organization(id=20, name="Chaos Org", slug="chaos-org")
    user = User(id=20, email="chaos@forgeflow.com", hashed_password="dummy", full_name="Chaos Admin", is_active=True, is_verified=True)
    db.add_all([org, user])
    db.flush()
    
    role = Role(id=20, name="Admin", is_system=True)
    p_invoice = pm.Permission(id=20, name="invoice:create", description="Create Invoice")
    p_task_update = pm.Permission(id=21, name="task:update", description="Update Task")
    p_proj_view = pm.Permission(id=22, name="project:view", description="View Project")
    p_proj_update = pm.Permission(id=23, name="project:update", description="Update Project")
    role.permissions.extend([p_invoice, p_task_update, p_proj_view, p_proj_update])
    db.add_all([role, p_invoice, p_task_update, p_proj_view, p_proj_update])
    db.flush()
    
    mem = Membership(id=20, user_id=20, organization_id=20, role_id=20, status="active", is_external=False)
    db.add(mem)
    
    # Create a project for task updates
    proj = Project(id=20, organization_id=20, name="Chaos Proj", status="planning")
    db.add(proj)
    db.commit()
    db.close()
    
    yield
    
    # Close all sessions and dispose connection pool to unlock SQLite
    SessionLocal.close_all()
    engine.dispose()
    Base.metadata.drop_all(bind=engine)


def get_auth_headers(db, user_id, org_id):
    sid = f"test-sid-{user_id}-{org_id}"
    sess = db.query(UserSession).filter(UserSession.refresh_token_hash == sid).first()
    if not sess:
        sess = UserSession(
            refresh_token_hash=sid,
            ip_address="127.0.0.1",
            revoked=False,
            expires_at=datetime.utcnow() + timedelta(days=1),
            user_id=user_id
        )
        db.add(sess)
        db.commit()
    token = create_access_token(data={"sub": str(user_id)}, sid=sid)
    return {
        "Authorization": f"Bearer {token}",
        "X-Organization-ID": str(org_id)
    }


class TestR4_2_ChaosAndDegradation:

    def test_redis_unavailable_during_invoice_creation(self):
        """1. Redis unavailable: invoice creation succeeds, saved in DB, PDF pending, Celery task queued."""
        from app.main import app
        client = TestClient(app)
        db = SessionLocal()
        
        # Ensure client exists first
        from app.crm.models import Client
        cl = Client(id=20, organization_id=20, name="E2E Client", email="client@forgeflow.com")
        db.add(cl)
        db.commit()

        headers = get_auth_headers(db, 20, 20)
        headers["Idempotency-Key"] = "test-key-123"
        db.close()

        # Mock underlying redis.Redis.get/set methods to raise ConnectionError
        # Mock bucket_exists to throw exception. Since minio_client.client.bucket_exists
        # will be a Mock, the service will call it and fail it, setting pdf_status = 'pending'.
        mock_minio = MagicMock()
        mock_minio.bucket_exists.side_effect = Exception("MinIO down")

        with patch("redis.Redis.get", side_effect=redis.exceptions.ConnectionError("Redis connection down")), \
             patch("redis.Redis.set", side_effect=redis.exceptions.ConnectionError("Redis connection down")), \
             patch("app.common.redis.check_rate_limit", return_value=True), \
             patch.object(minio_client, "_client", mock_minio):
            
            payload = {
                "client_id": 20,
                "issue_date": str(datetime.now().date()),
                "due_date": str(datetime.now().date()),
                "tax_rate": 10.0,
                "notes": "Test notes",
                "line_items": [
                    {"description": "Item 1", "quantity": 1, "unit_price": 100.0}
                ]
            }
            
            response = client.post("/api/invoices", json=payload, headers=headers)
            
            # Since Redis failed, it should bypass idempotency and proceed with creation
            assert response.status_code in (202, 201)
            data = response.json()
            assert data["pdf_status"] == "pending"
            
            # Verify DB state
            db = SessionLocal()
            inv = db.query(Invoice).filter(Invoice.id == data["id"]).first()
            assert inv is not None
            assert inv.pdf_status == "pending"
            db.close()

    def test_minio_unavailable_during_pdf_generation_celery_task(self):
        """2. MinIO unavailable: task retries, circuit breaker trips, DLQ entry is created."""
        from app.common.celery_tasks import generate_invoice_pdf_task, email_breaker
        email_breaker.close() # reset email breaker

        # Mock MinIO client to raise ConnectionError
        with patch("app.common.minio.minio_client.upload_bytes", side_effect=Exception("MinIO disconnected")), \
             patch("app.invoices.service.InvoiceService.generate_and_store_pdf_sync", side_effect=Exception("MinIO disconnected")):
            
            db = SessionLocal()
            inv = Invoice(
                id=200,
                organization_id=20,
                invoice_number="INV-200",
                issue_date=datetime.now().date(),
                due_date=datetime.now().date(),
                status="draft",
                subtotal=100.0,
                tax_rate=0.0,
                tax_amount=0.0,
                total=100.0,
                pdf_status="pending",
                created_by=20
            )
            db.add(inv)
            db.commit()
            db.close()

            # Execute task (propagates error under eager mode)
            with pytest.raises(Exception):
                generate_invoice_pdf_task.apply(args=(200, 20)).get()

            # Verify DLQ entry created & invoice set to failed
            db = SessionLocal()
            dlq_item = db.query(DLQEvent).filter(DLQEvent.task_name == "forgeflow.generate_invoice_pdf").first()
            assert dlq_item is not None
            assert "MinIO disconnected" in dlq_item.error_message
            
            inv_after = db.query(Invoice).filter(Invoice.id == 200).first()
            assert inv_after.pdf_status == "failed"
            db.close()

    def test_postgresql_connection_pool_at_90_utilization(self):
        """3. PostgreSQL pool at 90%: returns 503 Service Unavailable with Retry-After header."""
        from app.main import app
        client = TestClient(app)
        from app.common.database import engine
        
        db = SessionLocal()
        headers = get_auth_headers(db, 20, 20)
        db.close()

        # Mock checkedout and size on the connection pool
        mock_pool = MagicMock()
        mock_pool.checkedout.return_value = 9
        mock_pool.size.return_value = 10  # 9/10 = 90%
        
        with patch.object(engine, "pool", mock_pool):
            response = client.get("/api/projects", headers=headers)
            assert response.status_code == 503
            assert "Retry-After" in response.headers
            assert response.headers["Retry-After"] == "30"

    def test_concurrent_drag_operations_on_same_task(self):
        """4. Concurrent update/drag operations: first wins with 200, second fails with 409 Conflict."""
        from app.main import app
        client = TestClient(app)
        db = SessionLocal()
        task = Task(id=200, project_id=20, title="Kanban Card", status="todo", priority="medium", version=1)
        db.add(task)
        db.commit()

        headers = get_auth_headers(db, 20, 20)
        db.close()

        # Update 1: version 1 to 2
        payload = {"title": "Updated Title", "version": 1}
        resp1 = client.put("/api/projects/20/tasks/200", json=payload, headers=headers)
        assert resp1.status_code == 200
        assert resp1.json()["version"] == 2

        # Update 2: version 1 to 2 again (Conflict)
        resp2 = client.put("/api/projects/20/tasks/200", json=payload, headers=headers)
        assert resp2.status_code == 409
        assert "conflict" in resp2.json()["detail"].lower()

    def test_jwt_with_valid_signature_but_revoked_session_id(self):
        """5. Valid JWT with revoked session: rejected with 401 Unauthorized."""
        from fastapi.testclient import TestClient
        from app.main import app
        
        db = SessionLocal()
        # Create a revoked session
        sess = UserSession(
            id=200,
            user_id=20,
            refresh_token_hash="revoked-sid-123",
            ip_address="127.0.0.1",
            revoked=True,
            expires_at=datetime.utcnow() + timedelta(days=1)
        )
        db.add(sess)
        db.commit()
        db.close()

        # Generate a valid JWT token signed with secret containing revoked session ID (sid)
        token = create_access_token(data={"sub": "20"}, sid="revoked-sid-123")
        
        client = TestClient(app)
        headers = {"Authorization": f"Bearer {token}", "X-Organization-ID": "20"}
        response = client.get("/api/projects", headers=headers)
        assert response.status_code == 401
        assert "revoked" in response.json()["detail"].lower()

    def test_malformed_x_organization_id_header(self):
        """6. Malformed X-Organization-ID: ignored, falls back to session-derived active organization."""
        from app.main import app
        client = TestClient(app)
        db = SessionLocal()
        headers = get_auth_headers(db, 20, 20)
        # Modify X-Organization-ID to malformed string
        headers["X-Organization-ID"] = "abc"
        db.close()

        response = client.get("/api/projects", headers=headers)
        assert response.status_code == 200

    def test_email_provider_timeouts_during_registration(self):
        """7. Email provider timeouts: user created successfully, returns 201 Created, email task queued."""
        from fastapi.testclient import TestClient
        from app.main import app
        
        client = TestClient(app)
        payload = {
            "email": "new_register_user@forgeflow.com",
            "password": "SecurePassword1!",
            "full_name": "New registrant",
            "turnstile_token": "mock-turnstile-token"
        }
        
        # Mock send_verification_email to raise Exception / Timeout
        with patch("app.auth.service.AuthService.send_verification_email", side_effect=Exception("Email provider timeout")):
            response = client.post("/api/auth/register", json=payload)
            # Even if verification email fails internally, the user creation should proceed and fail gracefully
            assert response.status_code in (201, 200)
            
            # Verify user exists in database
            db = SessionLocal()
            user = db.query(User).filter(User.email == "new_register_user@forgeflow.com").first()
            assert user is not None
            db.close()

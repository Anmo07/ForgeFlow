"""ForgeFlow Celery Tasks with circuit breakers, retry policies, and DLQ routing."""
import os
import time
import logging
import pybreaker
from .celery_app import celery_app
from .base_task import ForgeFlowBaseTask
from .metrics import PrometheusBreakerListener, CB_STATE

logger = logging.getLogger("forgeflow.tasks")

# ── Circuit Breakers for External Dependencies ──

email_breaker = pybreaker.CircuitBreaker(
    fail_max=int(os.getenv("EMAIL_CB_FAIL_MAX", "5")),
    reset_timeout=int(os.getenv("EMAIL_CB_RESET_TIMEOUT", "60")),
    name="email",
    listeners=[PrometheusBreakerListener()]
)
CB_STATE.labels(name="email").set(0)

webhook_breaker = pybreaker.CircuitBreaker(
    fail_max=int(os.getenv("WEBHOOK_CB_FAIL_MAX", "5")),
    reset_timeout=int(os.getenv("WEBHOOK_CB_RESET_TIMEOUT", "60")),
    name="webhook",
    listeners=[PrometheusBreakerListener()]
)
CB_STATE.labels(name="webhook").set(0)


# ── Email Task ──

@celery_app.task(
    bind=True,
    base=ForgeFlowBaseTask,
    name="forgeflow.send_email",
    max_retries=5,
    default_retry_delay=30,
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    acks_late=True,
    reject_on_worker_lost=True,
)
def send_email_task(self, recipient: str, subject: str, body: str):
    """Send an email with circuit breaker protection and retry policy."""
    try:
        @email_breaker
        def _send(r, s, b):
            from app.common.email_service import EmailService
            service = EmailService()
            service.backend.send(to=r, subject=s, html_body=b, text_body=b)
        _send(recipient, subject, body)
        logger.info(f"Email sent to {recipient}")
        return {'status': 'sent', 'recipient': recipient}
    except pybreaker.CircuitBreakerError:
        logger.warning(f"Email circuit breaker is OPEN — queueing retry for {recipient}")
        raise self.retry(exc=Exception("Email circuit breaker open"), countdown=30)
    except Exception as exc:
        logger.error(f"Email send failed for {recipient}: {exc}")
        raise self.retry(exc=exc)


# ── Webhook Task ──

@celery_app.task(
    bind=True,
    base=ForgeFlowBaseTask,
    name="forgeflow.process_webhook",
    max_retries=3,
    default_retry_delay=60,
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    acks_late=True,
    reject_on_worker_lost=True,
)
def process_webhook_task(self, payload: dict):
    """Process an inbound webhook with circuit breaker protection."""
    from app.common.metrics import webhooks_received_total, webhook_processing_duration
    start = time.monotonic()
    try:
        @webhook_breaker
        def _process(p):
            logger.info(f"Processing webhook payload: {p.get('type', 'unknown')}")
            # Actual webhook processing logic goes here
            return True
        _process(payload)
        webhooks_received_total.labels(status="success").inc()
        return {'status': 'processed'}
    except pybreaker.CircuitBreakerError:
        webhooks_received_total.labels(status="circuit_open").inc()
        logger.warning("Webhook circuit breaker is OPEN — queueing retry")
        raise self.retry(exc=Exception("Webhook circuit breaker open"), countdown=60)
    except Exception as exc:
        webhooks_received_total.labels(status="failure").inc()
        logger.error(f"Webhook processing failed: {exc}")
        raise self.retry(exc=exc)
    finally:
        webhook_processing_duration.observe(time.monotonic() - start)


# ── Invoice PDF Generation Task ──

@celery_app.task(
    bind=True,
    base=ForgeFlowBaseTask,
    name="forgeflow.generate_invoice_pdf",
    max_retries=3,
    default_retry_delay=60,
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    acks_late=True,
    reject_on_worker_lost=True,
)
def generate_invoice_pdf_task(self, invoice_id: int, org_id: int):
    """Generate and store an invoice PDF with retry and DLQ on failure."""
    from app.common.database import SessionLocal
    from app.invoices.service import InvoiceService
    from app.invoices.models import Invoice
    
    db = SessionLocal()
    try:
        service = InvoiceService()
        service.generate_and_store_pdf_sync(db, invoice_id, org_id)
        return {'status': 'pdf_generated', 'invoice_id': invoice_id}
    except Exception as exc:
        logger.error(f'Error in generate_invoice_pdf_task for invoice {invoice_id}: {exc}')
        try:
            invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.organization_id == org_id).first()
            if invoice and invoice.pdf_status != 'pending':
                invoice.pdf_status = 'pending'
                db.commit()
        except Exception:
            pass
            
        try:
            self.retry(exc=exc)
        except Exception as retry_exc:
            # Final failure — mark as failed
            try:
                invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.organization_id == org_id).first()
                if invoice:
                    invoice.pdf_status = 'failed'
                    db.commit()
            except Exception:
                pass
            raise retry_exc
    finally:
        db.close()


# ── Data Breach Notification Task ──

@celery_app.task(
    bind=True,
    base=ForgeFlowBaseTask,
    name="forgeflow.notify_breach",
    max_retries=3,
    default_retry_delay=120,
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    acks_late=True,
    reject_on_worker_lost=True,
)
def notify_breach_task(self, org_ids: list[int], description: str):
    """Notify affected users of a potential data breach."""
    from app.common.database import SessionLocal
    from app.memberships.models import Membership
    from app.auth.models import User
    
    db = SessionLocal()
    try:
        users = db.query(User).join(Membership, Membership.user_id == User.id)\
            .filter(Membership.organization_id.in_(org_ids), Membership.status == 'active')\
            .distinct().all()
            
        for user in users:
            send_email_task.delay(
                recipient=user.email,
                subject="SECURITY NOTICE: suspected security incident reported",
                body=f"Hello {user.full_name},\n\nA security incident has been reported matching your organization. Description: {description}"
            )
            
        return {'notified_count': len(users)}
    except Exception as exc:
        logger.error(f"Breach notification failed: {exc}")
        raise self.retry(exc=exc)
    finally:
        db.close()
from .celery_app import celery_app
import time

@celery_app.task
def send_email_task(recipient: str, subject: str, body: str):
    print(f"Sending email to {recipient} with subject '{subject}'...")
    time.sleep(2)
    print(f'Email sent to {recipient}')
    return {'status': 'sent', 'recipient': recipient}

@celery_app.task
def process_webhook_task(payload: dict):
    print(f'Processing webhook payload: {payload}')
    return {'status': 'processed'}

@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    acks_late=True,
    reject_on_worker_lost=True,
)
def generate_invoice_pdf_task(self, invoice_id: int, org_id: int):
    from app.common.database import SessionLocal
    from app.invoices.service import InvoiceService
    from app.invoices.models import Invoice
    
    db = SessionLocal()
    try:
        service = InvoiceService()
        service.generate_and_store_pdf_sync(db, invoice_id, org_id)
        return {'status': 'pdf_generated', 'invoice_id': invoice_id}
    except Exception as exc:
        print(f'Error in generate_invoice_pdf_task for invoice {invoice_id}: {exc}')
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


@celery_app.task
def notify_breach_task(org_ids: list[int], description: str):
    from app.common.database import SessionLocal
    from app.memberships.models import Membership
    from app.auth.models import User
    
    db = SessionLocal()
    try:
        users = db.query(User).join(Membership, Membership.user_id == User.id)\
            .filter(Membership.organization_id.in_(org_ids), Membership.status == 'active')\
            .distinct().all()
            
        for user in users:
            # Call our existing email log task
            send_email_task.delay(
                recipient=user.email,
                subject="SECURITY NOTICE:suspected security incident reported",
                body=f"Hello {user.full_name},\n\nA security incident has been reported matching your organization. Description: {description}"
            )
            
        return {'notified_count': len(users)}
    finally:
        db.close()
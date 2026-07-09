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

@celery_app.task
def generate_invoice_pdf_task(invoice_id: int, org_id: int):
    from app.common.database import SessionLocal
    from app.invoices.service import InvoiceService
    db = SessionLocal()
    try:
        service = InvoiceService()
        service.generate_and_store_pdf_sync(db, invoice_id, org_id)
        return {'status': 'pdf_generated', 'invoice_id': invoice_id}
    except Exception as e:
        print(f'Error in generate_invoice_pdf_task for invoice {invoice_id}: {e}')
        raise e
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
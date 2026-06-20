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
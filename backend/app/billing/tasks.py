from app.common.celery_app import celery_app
from app.common.database import SessionLocal
from .service import BillingService
import logging

logger = logging.getLogger("forgeflow.billing")

@celery_app.task
def generate_contract_invoices_task():
    """Celery Beat task to process active contracts and generate draft invoices."""
    db = SessionLocal()
    try:
        service = BillingService()
        count = service.run_billing_cycle(db)
        logger.info(f"Billing cycle run completed. Generated {count} draft invoices.")
        return f"generated_{count}_invoices"
    except Exception as e:
        logger.error(f"Error running billing cycle task: {e}", exc_info=True)
        raise e
    finally:
        db.close()

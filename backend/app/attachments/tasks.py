from app.common.celery_app import celery_app
from app.common.database import SessionLocal
from app.common.minio import minio_client
from minio.commonconfig import CopySource
from .models import Attachment
import logging
import time

logger = logging.getLogger("forgeflow.attachments")
BUCKET_NAME = "forgeflow-attachments"

@celery_app.task
def scan_and_promote_attachment_task(attachment_id: int):
    """Asynchronous background task to simulate a virus scan on a quarantined file
    and promote it to production if clean, otherwise delete it.
    """
    db = SessionLocal()
    try:
        attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
        if not attachment:
            logger.error(f"Attachment {attachment_id} not found in database.")
            return "not_found"
            
        if attachment.status != 'quarantined':
            logger.warning(f"Attachment {attachment_id} is not in quarantined state: {attachment.status}")
            return "invalid_status"
            
        quarantine_path = attachment.storage_path
        filename = attachment.filename
        
        logger.info(f"Initiating virus scan on file {filename} at {quarantine_path}...")
        
        # Simulate scanning delay
        time.sleep(1)
        
        # Check if the file is "infected" (simulation hook for testing)
        is_infected = "EICAR" in filename or "virus" in filename.lower()
        
        if not is_infected:
            # Promote to production
            # Target path: replace 'quarantine/' prefix with 'production/'
            production_path = quarantine_path.replace("quarantine/", "production/", 1)
            
            logger.info(f"File {filename} is CLEAN. Promoting to {production_path}...")
            
            # Copy to production path in MinIO
            minio_client.client.copy_object(
                BUCKET_NAME,
                production_path,
                CopySource(BUCKET_NAME, quarantine_path)
            )
            
            # Delete quarantined object
            minio_client.delete_file(BUCKET_NAME, quarantine_path)
            
            # Update DB state
            attachment.status = 'active'
            attachment.storage_path = production_path
            db.commit()
            
            logger.info(f"Attachment {attachment_id} promoted successfully.")
            return "promoted"
        else:
            logger.error(f"File {filename} is INFECTED! Deleting from quarantine.")
            
            # Delete quarantined object
            minio_client.delete_file(BUCKET_NAME, quarantine_path)
            
            # Update DB state to infected
            attachment.status = 'infected'
            db.commit()
            
            # Publish security warning event since infected file was uploaded
            from app.events.event_bus import publish_event
            publish_event(
                db,
                event_type="security:event",
                organization_id=attachment.organization_id,
                user_id=attachment.user_id,
                entity_type="Attachment",
                entity_id=attachment_id,
                payload={
                    "event_type": "virus_detected",
                    "severity": "CRITICAL",
                    "metadata": {
                        "filename": filename,
                        "attachment_id": attachment_id
                    }
                }
            )
            db.commit()
            
            return "infected_deleted"
            
    except Exception as e:
        logger.error(f"Error in scan_and_promote_attachment_task for attachment {attachment_id}: {e}", exc_info=True)
        db.rollback()
        raise e
    finally:
        db.close()

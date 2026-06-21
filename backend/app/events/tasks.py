from app.common.celery_app import celery_app
from app.common.database import SessionLocal
from datetime import datetime
import logging

logger = logging.getLogger("forgeflow.events")

@celery_app.task
def process_outbox_task():
    """Celery task to fetch unprocessed outbox events, execute their subscribers,
    and mark them as processed.
    """
    db = SessionLocal()
    try:
        from .models import EventOutbox
        from .event_bus import EVENT_SUBSCRIBERS
        
        query = db.query(EventOutbox).filter(EventOutbox.processed == False)
        # Use postgres select-for-update skip-locked to prevent lock contention
        if db.bind.dialect.name == 'postgresql':
            query = query.with_for_update(skip_locked=True)
            
        events = query.order_by(EventOutbox.created_at.asc()).all()
        if not events:
            return "no_events"
            
        processed_count = 0
        for event_record in events:
            # Re-verify processed status to be safe
            if event_record.processed:
                continue
                
            handlers = EVENT_SUBSCRIBERS.get(event_record.event_type, [])
            for handler in handlers:
                try:
                    handler(db, event_record)
                except Exception as he:
                    logger.error(
                        f"Error in handler {handler.__name__} for event {event_record.event_id}: {he}", 
                        exc_info=True
                    )
            
            event_record.processed = True
            event_record.processed_at = datetime.utcnow()
            db.commit()
            processed_count += 1
            
        return f"processed_{processed_count}_events"
    except Exception as e:
        logger.error(f"Error in process_outbox_task: {e}", exc_info=True)
        db.rollback()
        raise e
    finally:
        db.close()

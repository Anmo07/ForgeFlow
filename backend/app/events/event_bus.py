import functools
from typing import Callable, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import event
from .models import EventOutbox

# Global map of event types to their subscriber callbacks
EVENT_SUBSCRIBERS: Dict[str, List[Callable]] = {}

def subscribe_event(event_type: str):
    """Decorator to subscribe a handler/callback to a specific event type.
    The handler will be executed asynchronously by the Celery worker.
    """
    def decorator(func: Callable):
        if event_type not in EVENT_SUBSCRIBERS:
            EVENT_SUBSCRIBERS[event_type] = []
        # Avoid duplicate subscriptions
        if func not in EVENT_SUBSCRIBERS[event_type]:
            EVENT_SUBSCRIBERS[event_type].append(func)
        return func
    return decorator

def publish_event(
    db: Session,
    event_type: str,
    organization_id: int,
    user_id: int = None,
    entity_type: str = None,
    entity_id: int = None,
    payload: Dict[str, Any] = None
) -> EventOutbox:
    """Publish an event by inserting it into the event outbox within the current transaction."""
    event_record = EventOutbox(
        event_type=event_type,
        organization_id=organization_id,
        user_id=user_id,
        entity_type=entity_type,
        entity_id=entity_id,
        payload=payload
    )
    db.add(event_record)
    return event_record

# Detect if an EventOutbox record is written during the transaction
@event.listens_for(Session, "before_commit")
def before_commit_detect(session):
    has_outbox = False
    for obj in session.new:
        if obj.__class__.__name__ == 'EventOutbox':
            has_outbox = True
            break
    if has_outbox:
        session.info["has_outbox_events"] = True

# Trigger the Celery outbox task after transaction commit completes
@event.listens_for(Session, "after_commit")
def after_commit_trigger(session):
    if session.info.get("has_outbox_events"):
        session.info["has_outbox_events"] = False
        try:
            from app.events.tasks import process_outbox_task
            process_outbox_task.delay()
        except Exception as e:
            # Prevent failures in task queuing from interrupting database flow
            import logging
            logging.getLogger("forgeflow.events").warning(
                f"Failed to queue outbox processing task: {e}"
            )

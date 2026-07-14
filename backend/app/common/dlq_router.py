"""Dead Letter Queue admin API for reviewing and replaying failed tasks."""
import json
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.common.database import get_db
from app.common.dependencies import get_current_user
from app.common.dlq_models import DLQEvent

logger = logging.getLogger("forgeflow.dlq")

router = APIRouter(prefix="/api/admin/dlq", tags=["Admin DLQ"])


class DLQEventResponse(BaseModel):
    id: int
    task_id: str
    task_name: str
    args_json: Optional[str] = None
    error_message: Optional[str] = None
    failed_at: datetime
    replayed_at: Optional[datetime] = None
    replayed_by: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("", response_model=List[DLQEventResponse])
def list_dlq_events(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List dead-lettered tasks for operator review."""
    events = db.query(DLQEvent).order_by(DLQEvent.failed_at.desc()).offset(offset).limit(limit).all()
    return events


@router.post("/{event_id}/replay")
def replay_dlq_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Manually re-enqueue a dead-lettered task."""
    event = db.query(DLQEvent).filter(DLQEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DLQ event not found")

    if event.replayed_at:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"DLQ event {event_id} was already replayed at {event.replayed_at}"
        )

    # Parse original task args/kwargs
    try:
        payload = json.loads(event.args_json) if event.args_json else {"args": [], "kwargs": {}}
    except json.JSONDecodeError:
        payload = {"args": [], "kwargs": {}}

    task_args = payload.get("args", [])
    task_kwargs = payload.get("kwargs", {})

    # Re-enqueue the original task
    from app.common.celery_app import celery_app
    celery_app.send_task(event.task_name, args=task_args, kwargs=task_kwargs)

    # Mark as replayed
    event.replayed_at = datetime.utcnow()
    event.replayed_by = str(current_user.id)
    db.commit()

    logger.info(f"DLQ event {event_id} (task={event.task_name}) replayed by user {current_user.id}")

    return {
        "status": "replayed",
        "event_id": event_id,
        "task_name": event.task_name,
        "replayed_at": event.replayed_at.isoformat(),
    }

"""ForgeFlow Base Celery Task with DLQ routing on final failure."""
import logging
from celery import Task

logger = logging.getLogger("forgeflow.celery")


class ForgeFlowBaseTask(Task):
    """Base task that routes to the Dead Letter Queue on final failure.
    
    When a task exhausts its max_retries, this class intercepts the failure
    and records it in the dlq_events table for operator review and manual replay.
    """
    abstract = True

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Called when a task has permanently failed (no more retries)."""
        from celery.exceptions import MaxRetriesExceededError, Retry
        
        # Only route to DLQ if retries are actually exhausted
        # (Retry exceptions are intermediate, not final failures)
        if isinstance(exc, Retry):
            return

        logger.error(
            f"Task {self.name}[{task_id}] permanently failed: {exc}",
            extra={"task_id": task_id, "task_name": self.name}
        )

        try:
            import json
            from datetime import datetime
            from app.common.database import SessionLocal
            from app.common.dlq_models import DLQEvent

            db = SessionLocal()
            try:
                dlq_event = DLQEvent(
                    task_id=task_id,
                    task_name=self.name,
                    args_json=json.dumps({"args": list(args) if args else [], "kwargs": kwargs or {}}),
                    error_message=str(exc)[:2000],
                    failed_at=datetime.utcnow(),
                )
                db.add(dlq_event)
                db.commit()
                logger.info(f"DLQ event created for task {task_id}")
            finally:
                db.close()
        except Exception as dlq_exc:
            logger.error(f"Failed to write DLQ event for task {task_id}: {dlq_exc}")

        super().on_failure(exc, task_id, args, kwargs, einfo)

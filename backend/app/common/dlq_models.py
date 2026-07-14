"""Dead Letter Queue (DLQ) model for permanently failed Celery tasks."""
from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from app.common.database import Base


class DLQEvent(Base):
    __tablename__ = "dlq_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = Column(String(255), nullable=False, index=True)
    task_name = Column(String(255), nullable=False)
    args_json = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    failed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    replayed_at = Column(DateTime, nullable=True)
    replayed_by = Column(String(255), nullable=True)

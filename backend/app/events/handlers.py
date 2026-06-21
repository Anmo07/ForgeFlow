from sqlalchemy.orm import Session
from app.events.event_bus import subscribe_event
from app.activity_logs.models import ActivityLog
from app.notifications.models import Notification
from app.security.models import SecurityEvent

# --- ACTIVITY LOG SUBSCRIBERS ---

@subscribe_event("project:created")
def on_project_created(db: Session, event):
    log = ActivityLog(
        organization_id=event.organization_id,
        user_id=event.user_id,
        action="project:create",
        entity_type="Project",
        entity_id=event.entity_id,
        metadata_json=event.payload
    )
    db.add(log)

@subscribe_event("project:updated")
def on_project_updated(db: Session, event):
    log = ActivityLog(
        organization_id=event.organization_id,
        user_id=event.user_id,
        action="project:update",
        entity_type="Project",
        entity_id=event.entity_id,
        metadata_json=event.payload
    )
    db.add(log)

@subscribe_event("project:deleted")
def on_project_deleted(db: Session, event):
    log = ActivityLog(
        organization_id=event.organization_id,
        user_id=event.user_id,
        action="project:delete",
        entity_type="Project",
        entity_id=event.entity_id,
        metadata_json=event.payload
    )
    db.add(log)

@subscribe_event("task:created")
def on_task_created(db: Session, event):
    log = ActivityLog(
        organization_id=event.organization_id,
        user_id=event.user_id,
        action="task:create",
        entity_type="Task",
        entity_id=event.entity_id,
        metadata_json=event.payload
    )
    db.add(log)

@subscribe_event("task:updated")
def on_task_updated(db: Session, event):
    log = ActivityLog(
        organization_id=event.organization_id,
        user_id=event.user_id,
        action="task:update",
        entity_type="Task",
        entity_id=event.entity_id,
        metadata_json=event.payload
    )
    db.add(log)

@subscribe_event("task:deleted")
def on_task_deleted(db: Session, event):
    log = ActivityLog(
        organization_id=event.organization_id,
        user_id=event.user_id,
        action="task:delete",
        entity_type="Task",
        entity_id=event.entity_id,
        metadata_json=event.payload
    )
    db.add(log)

@subscribe_event("apikey:created")
def on_apikey_created(db: Session, event):
    payload = event.payload or {}
    log = ActivityLog(
        organization_id=event.organization_id,
        user_id=event.user_id,
        action="apikey:create",
        entity_type="APIKey",
        entity_id=event.entity_id,
        metadata_json={"target_name": payload.get("key_name")}
    )
    db.add(log)


# --- SECURITY EVENT SUBSCRIBER ---

@subscribe_event("security:event")
def handle_security_event(db: Session, event):
    payload = event.payload or {}
    sec_event = SecurityEvent(
        organization_id=event.organization_id,
        user_id=event.user_id,
        event_type=payload.get("event_type", "unknown"),
        severity=payload.get("severity", "INFO"),
        ip_address=payload.get("ip_address"),
        user_agent=payload.get("user_agent"),
        metadata_json=payload.get("metadata")
    )
    db.add(sec_event)
    
    # Also log to standard activity logs for visibility
    log = ActivityLog(
        organization_id=event.organization_id,
        user_id=event.user_id,
        action="security:event",
        entity_type="SecurityEvent",
        entity_id=None,
        metadata_json={"target_name": payload.get("event_type")}
    )
    db.add(log)


# --- NOTIFICATION SUBSCRIBERS ---

@subscribe_event("task:assigned")
def handle_task_assigned_notification(db: Session, event):
    payload = event.payload or {}
    assignee_id = payload.get("assigned_to")
    if not assignee_id:
        return
    notification = Notification(
        organization_id=event.organization_id,
        user_id=assignee_id,
        category="Task Assigned",
        metadata_json={
            "task_id": event.entity_id,
            "task_title": payload.get("task_title"),
            "assigned_by_id": event.user_id,
            "assigned_by_name": payload.get("actor_name")
        }
    )
    db.add(notification)

@subscribe_event("sla:warning")
def handle_sla_warning_notification(db: Session, event):
    payload = event.payload or {}
    recipient_id = payload.get("recipient_id") or event.user_id
    if not recipient_id:
        return
    notification = Notification(
        organization_id=event.organization_id,
        user_id=recipient_id,
        category="SLA Threshold Warning",
        metadata_json={
            "task_id": event.entity_id,
            "task_title": payload.get("task_title"),
            "sla_limit_hours": payload.get("sla_limit_hours")
        }
    )
    db.add(notification)

@subscribe_event("security:notification")
def handle_security_notification(db: Session, event):
    payload = event.payload or {}
    recipient_id = payload.get("recipient_id") or event.user_id
    if not recipient_id:
        return
    notification = Notification(
        organization_id=event.organization_id,
        user_id=recipient_id,
        category="Security Event Triggered",
        metadata_json={
            "event_type": payload.get("event_type"),
            "severity": payload.get("severity")
        }
    )
    db.add(notification)

@subscribe_event("apikey:notification")
def handle_apikey_created_notification(db: Session, event):
    payload = event.payload or {}
    recipient_id = payload.get("recipient_id") or event.user_id
    if not recipient_id:
        return
    notification = Notification(
        organization_id=event.organization_id,
        user_id=recipient_id,
        category="New API Key Created",
        metadata_json={
            "key_name": payload.get("key_name"),
            "created_by_name": payload.get("actor_name")
        }
    )
    db.add(notification)

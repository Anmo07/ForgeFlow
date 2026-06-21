from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.common.dependencies import get_db
from app.common.tenant import TenantContext, get_current_tenant
from .models import Notification
from .schema import NotificationResponse

router = APIRouter()

@router.get('', response_model=List[NotificationResponse])
def list_notifications(
    limit: int = 100,
    offset: int = 0,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Retrieve all notifications for the authenticated user in the current organization."""
    return db.query(Notification).filter(
        Notification.organization_id == tenant.organization_id,
        Notification.user_id == tenant.user_id
    ).order_by(
        Notification.created_at.desc()
    ).offset(offset).limit(limit).all()

@router.post('/{id}/read')
def mark_read(
    id: int,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Mark a notification as read. Validates user ownership and organization context."""
    notification = db.query(Notification).filter(
        Notification.id == id,
        Notification.organization_id == tenant.organization_id,
        Notification.user_id == tenant.user_id
    ).first()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    notification.is_read = True
    db.commit()
    return {"status": "success"}

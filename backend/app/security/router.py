from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.common.dependencies import get_db
from app.common.tenant import TenantContext, require_permission
from .models import SecurityEvent
from .schema import SecurityEventResponse

router = APIRouter()

@router.get('/events', response_model=List[SecurityEventResponse])
def get_security_events(
    limit: int = 100,
    offset: int = 0,
    tenant: TenantContext = Depends(require_permission('security:view')),
    db: Session = Depends(get_db)
):
    """Retrieve security events for the current organization. Requires 'security:view' permission."""
    return db.query(SecurityEvent).filter(
        SecurityEvent.organization_id == tenant.organization_id
    ).order_by(
        SecurityEvent.created_at.desc()
    ).offset(offset).limit(limit).all()

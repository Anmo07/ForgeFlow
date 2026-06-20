from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..common.dependencies import get_db, get_current_user
from ..auth.models import User
from .schema import ActivityLogResponse
from .models import ActivityLog
router = APIRouter()

@router.get('/', response_model=List[ActivityLogResponse])
def get_activity_logs(org_id: Optional[int]=Query(None), user_id: Optional[int]=Query(None), action: Optional[str]=Query(None), skip: int=0, limit: int=100, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    query = db.query(ActivityLog)
    if org_id is not None:
        query = query.filter(ActivityLog.organization_id == org_id)
    if user_id is not None:
        query = query.filter(ActivityLog.user_id == user_id)
    if action is not None:
        query = query.filter(ActivityLog.action.ilike(f'%{action}%'))
    return query.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
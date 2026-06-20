from sqlalchemy.orm import Session
from typing import Optional, Any, Dict
from .models import ActivityLog

def log_activity(db: Session, action: str, organization_id: Optional[int]=None, user_id: Optional[int]=None, entity_type: Optional[str]=None, entity_id: Optional[int]=None, metadata_json: Optional[Dict[str, Any]]=None, ip_address: Optional[str]=None, user_agent: Optional[str]=None) -> ActivityLog:
    db_log = ActivityLog(organization_id=organization_id, user_id=user_id, action=action, entity_type=entity_type, entity_id=entity_id, metadata_json=metadata_json, ip_address=ip_address, user_agent=user_agent)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log
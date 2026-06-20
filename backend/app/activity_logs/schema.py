from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime

class ActivityLogResponse(BaseModel):
    id: int
    organization_id: Optional[int] = None
    user_id: Optional[int] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    metadata_json: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
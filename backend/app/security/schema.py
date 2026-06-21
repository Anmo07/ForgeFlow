from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class SecurityEventResponse(BaseModel):
    id: int
    organization_id: int
    user_id: Optional[int] = None
    event_type: str
    severity: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

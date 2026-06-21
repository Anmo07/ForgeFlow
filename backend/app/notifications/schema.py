from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class NotificationResponse(BaseModel):
    id: int
    organization_id: int
    user_id: int
    category: str
    is_read: bool
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

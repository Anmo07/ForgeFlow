from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SessionResponse(BaseModel):
    id: int
    device_name: Optional[str] = None
    browser: Optional[str] = None
    operating_system: Optional[str] = None
    ip_address: Optional[str] = None
    last_activity: datetime
    expires_at: datetime
    revoked: bool
    is_current: Optional[bool] = False

    class Config:
        from_attributes = True
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class APIKeyCreate(BaseModel):
    name: str
    organization_id: int
    permissions: List[str]
    expires_at: Optional[datetime] = None
    mode: Optional[str] = 'live'

class APIKeyResponse(BaseModel):
    id: int
    organization_id: int
    name: str
    key_prefix: str
    permissions: List[str]
    created_by: int
    expires_at: Optional[datetime] = None
    last_used: Optional[datetime] = None
    revoked: bool

    class Config:
        from_attributes = True

class APIKeyGenerated(APIKeyResponse):
    plain_key: str
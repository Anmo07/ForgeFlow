from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ClientCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None

class ClientResponse(BaseModel):
    id: int
    organization_id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class LeadCreate(BaseModel):
    client_id: int
    status: str = Field(default='new')
    value: float = Field(default=0.0)
    source: Optional[str] = None
    assigned_to: Optional[int] = None

class LeadUpdate(BaseModel):
    status: Optional[str] = None
    value: Optional[float] = None
    source: Optional[str] = None
    assigned_to: Optional[int] = None

class LeadResponse(BaseModel):
    id: int
    organization_id: int
    client_id: int
    status: str
    value: float
    source: Optional[str] = None
    assigned_to: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    client_name: Optional[str] = None
    client_company: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None

    class Config:
        from_attributes = True

class DealCreate(BaseModel):
    lead_id: int
    name: Optional[str] = None
    value: float = Field(default=0.0)
    status: str = Field(default='discovery')
    assigned_to: Optional[int] = None

class DealUpdate(BaseModel):
    name: Optional[str] = None
    value: Optional[float] = None
    status: Optional[str] = None
    assigned_to: Optional[int] = None
    version: Optional[int] = None

class DealResponse(BaseModel):
    id: int
    organization_id: int
    lead_id: int
    name: Optional[str] = None
    value: float
    status: str
    assigned_to: Optional[int] = None
    closed_at: Optional[datetime] = None
    version: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CRMMetrics(BaseModel):
    active_leads: int = 0
    pipeline_value: float = 0.0
    deals_won_value: float = 0.0
    conversion_rate: float = 0.0
    total_clients: int = 0
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str
    slug: str
    logo_url: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    sso_enabled: Optional[bool] = None
    sso_provider: Optional[str] = None
    sso_client_id: Optional[str] = None
    sso_client_secret: Optional[str] = None
    sso_issuer_url: Optional[str] = None

class OrganizationResponse(OrganizationBase):
    id: int
    uuid: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    sso_enabled: bool
    sso_provider: Optional[str] = None
    sso_client_id: Optional[str] = None
    sso_issuer_url: Optional[str] = None

    class Config:
        from_attributes = True

class OrganizationSSOUpdate(BaseModel):
    sso_enabled: bool
    sso_provider: Optional[str] = None
    sso_client_id: Optional[str] = None
    sso_client_secret: Optional[str] = None
    sso_issuer_url: Optional[str] = None

class OrganizationSSOResponse(BaseModel):
    sso_enabled: bool
    sso_provider: Optional[str] = None
    sso_client_id: Optional[str] = None
    sso_client_secret_configured: bool
    sso_issuer_url: Optional[str] = None
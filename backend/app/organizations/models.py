from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
import uuid
from ..common.database import Base

class Organization(Base):
    __tablename__ = 'organizations'
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    logo_url = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    company_size = Column(String, nullable=True)
    website = Column(String, nullable=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # SSO / OIDC Configuration
    sso_enabled = Column(Boolean, default=False, nullable=False)
    sso_provider = Column(String, nullable=True)  # e.g., 'google', 'okta'
    sso_client_id = Column(String, nullable=True)
    sso_client_secret = Column(String, nullable=True)  # Encrypted at rest
    sso_issuer_url = Column(String, nullable=True)
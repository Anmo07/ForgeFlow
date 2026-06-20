from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from ..common.database import Base

class APIKey(Base):
    __tablename__ = 'api_keys'
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False)
    name = Column(String, nullable=False)
    key_prefix = Column(String, nullable=False)
    hashed_key = Column(String, unique=True, index=True, nullable=False)
    permissions = Column(JSON, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    last_used = Column(DateTime(timezone=True), nullable=True)
    revoked = Column(Boolean, default=False)
    organization = relationship('Organization')
    creator = relationship('User')
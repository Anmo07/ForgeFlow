from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..common.database import Base

class Membership(Base):
    __tablename__ = 'memberships'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    organization_id = Column(Integer, ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True)
    role_id = Column(Integer, ForeignKey('roles.id', ondelete='RESTRICT'), nullable=False, index=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    invited_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    status = Column(String, default='invited')
    invite_token = Column(String, unique=True, index=True, nullable=True)
    user = relationship('User', foreign_keys=[user_id], backref='memberships')
    organization = relationship('Organization', backref='memberships')
    role = relationship('Role', backref='memberships')
    inviter = relationship('User', foreign_keys=[invited_by])
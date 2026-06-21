from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..common.database import Base, SoftDeleteMixin

class Attachment(Base, SoftDeleteMixin):
    __tablename__ = 'attachments'
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'), nullable=True, index=True)
    task_id = Column(Integer, ForeignKey('tasks.id', ondelete='CASCADE'), nullable=True, index=True)
    
    filename = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    content_type = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)
    status = Column(String, default='quarantined', nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship('User')
    organization = relationship('Organization')

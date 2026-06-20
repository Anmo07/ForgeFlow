from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from ..common.database import Base
role_permissions = Table('role_permissions', Base.metadata, Column('role_id', Integer, ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True), Column('permission_id', Integer, ForeignKey('permissions.id', ondelete='CASCADE'), primary_key=True))

class Role(Base):
    __tablename__ = 'roles'
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey('organizations.id', ondelete='CASCADE'), nullable=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_system = Column(Boolean, default=False)
    permissions = relationship('Permission', secondary=role_permissions, back_populates='roles')
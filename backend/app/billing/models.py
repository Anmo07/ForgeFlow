from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Date, Boolean, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..common.database import Base

class ContractType(str, enum.Enum):
    FIXED_RETAINER = "FIXED_RETAINER"
    PER_SEAT = "PER_SEAT"
    TIME_AND_MATERIAL = "TIME_AND_MATERIAL"

class BillingContract(Base):
    __tablename__ = 'billing_contracts'
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True)
    client_organization_id = Column(Integer, ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True)
    contract_type = Column(Enum(ContractType), nullable=False)
    rate = Column(Float, default=0.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    billing_cycle_start = Column(Date, nullable=True)
    billing_cycle_end = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    organization = relationship('Organization', foreign_keys=[organization_id])
    client_organization = relationship('Organization', foreign_keys=[client_organization_id])

class TaskTimeLog(Base):
    __tablename__ = 'task_time_logs'
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    hours = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    logged_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    task = relationship('Task')
    user = relationship('User')

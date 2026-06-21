import os
import time
import uuid
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..common.database import Base

def generate_uuidv7() -> str:
    # 48-bit timestamp in milliseconds
    ms = int(time.time() * 1000)
    # 12-bit rand_a
    rand_a = os.urandom(2)
    # 62-bit rand_b
    rand_b = os.urandom(8)
    
    b = bytearray(16)
    b[0] = (ms >> 40) & 0xff
    b[1] = (ms >> 32) & 0xff
    b[2] = (ms >> 24) & 0xff
    b[3] = (ms >> 16) & 0xff
    b[4] = (ms >> 8) & 0xff
    b[5] = ms & 0xff
    
    b[6] = 0x70 | (rand_a[0] & 0x0f)
    b[7] = rand_a[1]
    
    b[8] = 0x80 | (rand_b[0] & 0x3f)
    b[9] = rand_b[1]
    b[10] = rand_b[2]
    b[11] = rand_b[3]
    b[12] = rand_b[4]
    b[13] = rand_b[5]
    b[14] = rand_b[6]
    b[15] = rand_b[7]
    
    return str(uuid.UUID(bytes=bytes(b)))

class EventOutbox(Base):
    __tablename__ = 'event_outbox'
    
    event_id = Column(String(36), primary_key=True, default=generate_uuidv7, unique=True)
    event_type = Column(String, nullable=False, index=True)
    organization_id = Column(Integer, ForeignKey('organizations.id', ondelete='CASCADE'), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    entity_type = Column(String, nullable=True)
    entity_id = Column(Integer, nullable=True)
    payload = Column(JSON, nullable=True)
    processed = Column(Boolean, default=False, nullable=False, index=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

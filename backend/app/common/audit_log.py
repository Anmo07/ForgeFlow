from typing import Optional, Any, Dict
from sqlalchemy import Column, Integer, String, DateTime, Text, func
from sqlalchemy.orm import Session
import json
import logging
from ..common.database import Base
from ..common.encryption import encrypt_field, decrypt_field
logger = logging.getLogger(__name__)

class AuditLog(Base):
    __tablename__ = 'audit_logs'
    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, nullable=True, index=True)
    resource_type = Column(String(50), nullable=False, index=True)
    resource_id = Column(Integer, nullable=False, index=True)
    operation = Column(String(20), nullable=False)
    actor_user_id = Column(Integer, nullable=True)
    actor_api_key_id = Column(Integer, nullable=True)
    actor_type = Column(String(10), default='user')
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    _before_state = Column(Text, nullable=True)
    _after_state = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    def set_before_state(self, state: Dict[str, Any]) -> None:
        if state:
            json_str = json.dumps(state, default=str)
            self._before_state = encrypt_field(json_str)

    def set_after_state(self, state: Dict[str, Any]) -> None:
        if state:
            json_str = json.dumps(state, default=str)
            self._after_state = encrypt_field(json_str)

    def get_before_state(self) -> Optional[Dict]:
        if not self._before_state:
            return None
        try:
            json_str = decrypt_field(self._before_state)
            return json.loads(json_str)
        except Exception as e:
            logger.error(f'Failed to decrypt audit log before_state: {e}')
            return None

    def get_after_state(self) -> Optional[Dict]:
        if not self._after_state:
            return None
        try:
            json_str = decrypt_field(self._after_state)
            return json.loads(json_str)
        except Exception as e:
            logger.error(f'Failed to decrypt audit log after_state: {e}')
            return None

class AuditService:

    @staticmethod
    def log_create(db: Session, resource_type: str, resource_id: int, after_state: Dict[str, Any], actor_user_id: Optional[int]=None, actor_api_key_id: Optional[int]=None, organization_id: Optional[int]=None, ip_address: Optional[str]=None, user_agent: Optional[str]=None) -> AuditLog:
        log = AuditLog(organization_id=organization_id, resource_type=resource_type, resource_id=resource_id, operation='create', actor_user_id=actor_user_id, actor_api_key_id=actor_api_key_id, actor_type='user' if actor_user_id else 'api_key', ip_address=ip_address, user_agent=user_agent)
        log.set_after_state(after_state)
        db.add(log)
        db.commit()
        return log

    @staticmethod
    def log_update(db: Session, resource_type: str, resource_id: int, before_state: Dict[str, Any], after_state: Dict[str, Any], actor_user_id: Optional[int]=None, actor_api_key_id: Optional[int]=None, organization_id: Optional[int]=None, ip_address: Optional[str]=None, user_agent: Optional[str]=None) -> AuditLog:
        log = AuditLog(organization_id=organization_id, resource_type=resource_type, resource_id=resource_id, operation='update', actor_user_id=actor_user_id, actor_api_key_id=actor_api_key_id, actor_type='user' if actor_user_id else 'api_key', ip_address=ip_address, user_agent=user_agent)
        log.set_before_state(before_state)
        log.set_after_state(after_state)
        db.add(log)
        db.commit()
        return log

    @staticmethod
    def log_delete(db: Session, resource_type: str, resource_id: int, before_state: Dict[str, Any], actor_user_id: Optional[int]=None, actor_api_key_id: Optional[int]=None, organization_id: Optional[int]=None, ip_address: Optional[str]=None, user_agent: Optional[str]=None) -> AuditLog:
        log = AuditLog(organization_id=organization_id, resource_type=resource_type, resource_id=resource_id, operation='delete', actor_user_id=actor_user_id, actor_api_key_id=actor_api_key_id, actor_type='user' if actor_user_id else 'api_key', ip_address=ip_address, user_agent=user_agent)
        log.set_before_state(before_state)
        db.add(log)
        db.commit()
        return log

    @staticmethod
    def get_audit_logs(db: Session, resource_type: Optional[str]=None, resource_id: Optional[int]=None, organization_id: Optional[int]=None, limit: int=100) -> list:
        query = db.query(AuditLog)
        if organization_id:
            query = query.filter(AuditLog.organization_id == organization_id)
        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)
        if resource_id:
            query = query.filter(AuditLog.resource_id == resource_id)
        return query.order_by(AuditLog.created_at.desc()).limit(limit).all()
from pydantic import BaseModel, model_validator
from typing import Optional, Any, Dict
from datetime import datetime

class ActivityLogResponse(BaseModel):
    id: int
    organization_id: Optional[int] = None
    user_id: Optional[int] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    metadata_json: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    formatted_message: Optional[str] = None
    created_at: datetime

    @model_validator(mode='before')
    @classmethod
    def format_log_message(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            # SQLAlchemy ORM object
            action = getattr(data, 'action', '')
            metadata = getattr(data, 'metadata_json', {}) or {}
            user = getattr(data, 'user', None)
            entity_id = getattr(data, 'entity_id', None)
            entity_type = getattr(data, 'entity_type', '')
        else:
            action = data.get('action', '')
            metadata = data.get('metadata_json', {}) or {}
            user = data.get('user', None)
            entity_id = data.get('entity_id', None)
            entity_type = data.get('entity_type', '')
            
        actor_name = metadata.get('actor_name')
        if not actor_name and user:
            if hasattr(user, 'full_name'):
                actor_name = user.full_name or user.email
            elif isinstance(user, dict):
                actor_name = user.get('full_name') or user.get('email')
        actor_name = actor_name or "System"
        
        target_name = metadata.get('target_name', f"ID {entity_id}" if entity_id else "")
        
        msg = ""
        if action == 'project:create':
            msg = f"{actor_name} created project {target_name}"
        elif action == 'project:update':
            msg = f"{actor_name} updated project {target_name}"
        elif action == 'project:delete':
            msg = f"{actor_name} deleted project {target_name}"
        elif action == 'task:create':
            msg = f"{actor_name} created task {target_name}"
        elif action == 'task:update':
            msg = f"{actor_name} updated task {target_name}"
        elif action == 'task:delete':
            msg = f"{actor_name} deleted task {target_name}"
        elif action == 'task:assign':
            assignee = metadata.get('assignee_name', 'unassigned')
            msg = f"{actor_name} assigned task {target_name} to {assignee}"
        elif action == 'sla:warning':
            msg = f"SLA threshold warning triggered for {target_name}"
        elif action == 'security:event':
            msg = f"Security event triggered: {target_name}"
        elif action == 'apikey:create':
            msg = f"{actor_name} created a new API key"
        else:
            msg = f"{actor_name} performed action '{action}' on {entity_type} {target_name}".strip()
            
        if isinstance(data, dict):
            data['formatted_message'] = msg
            return data
        else:
            # Convert SQLAlchemy object to dictionary and set formatted_message
            d = {c.name: getattr(data, c.name) for c in data.__table__.columns}
            d['formatted_message'] = msg
            return d

    class Config:
        from_attributes = True
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, Optional, Type
from datetime import datetime

class OptimisticLockException(HTTPException):

    def __init__(self, resource_type: str, resource_id: int, current_version: int, provided_version: int):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=f'Conflict: {resource_type} (ID {resource_id}) has been modified since retrieval. Expected version {provided_version}, but current version is {current_version}. Fetch the latest version and retry.')

def verify_version(db: Session, model_class: Type[Any], resource_id: int, provided_version: int, org_id: Optional[int]=None) -> None:
    query = db.query(model_class).filter(model_class.id == resource_id)
    if org_id and hasattr(model_class, 'organization_id'):
        query = query.filter(model_class.organization_id == org_id)
    record = query.first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f'{model_class.__name__} not found')
    if record.version != provided_version:
        raise OptimisticLockException(resource_type=model_class.__name__, resource_id=resource_id, current_version=record.version, provided_version=provided_version)

def increment_version(record: Any) -> int:
    if not hasattr(record, 'version'):
        raise ValueError(f"{type(record).__name__} does not support optimistic locking (no 'version' column)")
    record.version = (record.version or 0) + 1
    record.updated_at = datetime.utcnow()
    return record.version

def create_version_schema(model_name: str):
    from pydantic import BaseModel, Field

    class VersionedUpdate(BaseModel):
        version: int = Field(..., description='Current version number for optimistic locking')
    VersionedUpdate.__name__ = f'{model_name}Update'
    return VersionedUpdate
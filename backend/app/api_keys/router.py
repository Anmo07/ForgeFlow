from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from ..common.dependencies import get_db, get_current_user
from ..auth.models import User
from .schema import APIKeyCreate, APIKeyResponse, APIKeyGenerated
from .service import APIKeyService
router = APIRouter()
key_service = APIKeyService()

@router.post('/', response_model=APIKeyGenerated, status_code=status.HTTP_201_CREATED)
def create_api_key(req: APIKeyCreate, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    key_record, plain_key = key_service.create_key(db, req, current_user.id)
    return APIKeyGenerated(id=key_record.id, organization_id=key_record.organization_id, name=key_record.name, key_prefix=key_record.key_prefix, permissions=key_record.permissions, created_by=key_record.created_by, expires_at=key_record.expires_at, last_used=key_record.last_used, revoked=key_record.revoked, plain_key=plain_key)

@router.post('/{key_id}/rotate', response_model=APIKeyGenerated)
def rotate_api_key(key_id: int, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    key_record, plain_key = key_service.rotate_key(db, key_id, current_user.id)
    return APIKeyGenerated(id=key_record.id, organization_id=key_record.organization_id, name=key_record.name, key_prefix=key_record.key_prefix, permissions=key_record.permissions, created_by=key_record.created_by, expires_at=key_record.expires_at, last_used=key_record.last_used, revoked=key_record.revoked, plain_key=plain_key)

@router.delete('/{key_id}', status_code=status.HTTP_204_NO_CONTENT)
def revoke_api_key(key_id: int, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    key_service.revoke_key(db, key_id)
    return None

@router.get('/organization/{org_id}', response_model=List[APIKeyResponse])
def list_org_api_keys(org_id: int, limit: int=100, offset: int=0, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    if limit > 1000:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Maximum page size is 1000')
    return key_service.list_keys(db, org_id, limit=limit, offset=offset)
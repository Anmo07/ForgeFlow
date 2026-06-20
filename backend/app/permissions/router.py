from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from ..common.dependencies import get_db
from .schema import PermissionCreate, PermissionResponse
from .service import PermissionService
router = APIRouter()
perm_service = PermissionService()

@router.post('/', response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
def create_perm(req: PermissionCreate, db: Session=Depends(get_db)):
    return perm_service.create_permission(db, req)

@router.get('/', response_model=List[PermissionResponse])
def list_perms(skip: int=0, limit: int=100, db: Session=Depends(get_db)):
    return perm_service.list_permissions(db, skip, limit)

@router.get('/{perm_id}', response_model=PermissionResponse)
def get_perm(perm_id: int, db: Session=Depends(get_db)):
    return perm_service.get_permission(db, perm_id)
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from ..common.dependencies import get_db
from .schema import RoleCreate, RoleUpdate, RoleResponse
from .service import RoleService
router = APIRouter()
role_service = RoleService()

@router.post('/', response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(req: RoleCreate, db: Session=Depends(get_db)):
    return role_service.create_role(db, req)

@router.get('/system', response_model=List[RoleResponse])
def list_system_roles(db: Session=Depends(get_db)):
    return role_service.list_system_roles(db)

@router.get('/organization/{org_id}', response_model=List[RoleResponse])
def list_org_roles(org_id: int, db: Session=Depends(get_db)):
    return role_service.list_org_roles(db, org_id)

@router.get('/{role_id}', response_model=RoleResponse)
def get_role(role_id: int, db: Session=Depends(get_db)):
    return role_service.get_role_by_id(db, role_id)

@router.put('/{role_id}', response_model=RoleResponse)
def update_role(role_id: int, req: RoleUpdate, db: Session=Depends(get_db)):
    return role_service.update_role(db, role_id, req)

@router.delete('/{role_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_role(role_id: int, db: Session=Depends(get_db)):
    role_service.delete_role(db, role_id)
    return None
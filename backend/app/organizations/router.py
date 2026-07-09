from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..common.dependencies import get_db, get_current_user_optional
from ..auth.models import User
from .schema import OrganizationCreate, OrganizationUpdate, OrganizationResponse
from .service import OrganizationService
router = APIRouter()
org_service = OrganizationService()

@router.post('/', response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_org(req: OrganizationCreate, current_user: Optional[User]=Depends(get_current_user_optional), db: Session=Depends(get_db)):
    creator_id = current_user.id if current_user else None
    return org_service.create_organization(db, req, creator_id=creator_id)

@router.get('/', response_model=List[OrganizationResponse])
def list_orgs(skip: int=0, limit: int=100, current_user: Optional[User]=Depends(get_current_user_optional), db: Session=Depends(get_db)):
    if limit > 100:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Maximum page size is 100')
    if current_user:
        return org_service.list_organizations_for_user(db, current_user.id, skip, limit)
    return org_service.list_organizations(db, skip, limit)

@router.get('/{org_id}', response_model=OrganizationResponse)
def get_org(org_id: int, db: Session=Depends(get_db)):
    return org_service.get_organization_by_id(db, org_id)

@router.put('/{org_id}', response_model=OrganizationResponse)
def update_org(org_id: int, req: OrganizationUpdate, db: Session=Depends(get_db)):
    return org_service.update_organization(db, org_id, req)

@router.delete('/{org_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_org(org_id: int, db: Session=Depends(get_db)):
    org_service.delete_organization(db, org_id)
    return None
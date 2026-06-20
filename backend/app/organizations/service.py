from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from .repository import OrganizationRepository
from .schema import OrganizationCreate, OrganizationUpdate
from .models import Organization

class OrganizationService:

    def __init__(self):
        self.repo = OrganizationRepository()

    def get_organization_by_id(self, db: Session, org_id: int) -> Organization:
        org = self.repo.get_by_id(db, org_id)
        if not org:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Organization not found')
        return org

    def get_organization_by_uuid(self, db: Session, org_uuid: str) -> Organization:
        org = self.repo.get_by_uuid(db, org_uuid)
        if not org:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Organization not found')
        return org

    def list_organizations(self, db: Session, skip: int=0, limit: int=100) -> List[Organization]:
        return self.repo.list(db, skip, limit)

    def list_organizations_for_user(self, db: Session, user_id: int, skip: int=0, limit: int=100) -> List[Organization]:
        from ..memberships.models import Membership
        memberships = db.query(Membership).filter(Membership.user_id == user_id, Membership.status == 'active').offset(skip).limit(limit).all()
        return [m.organization for m in memberships]

    def create_organization(self, db: Session, org_in: OrganizationCreate, creator_id: Optional[int]=None) -> Organization:
        existing_slug = self.repo.get_by_slug(db, org_in.slug)
        if existing_slug:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Organization slug already exists')
        org = self.repo.create(db, org_in)
        if creator_id is not None:
            from ..memberships.models import Membership
            membership = Membership(user_id=creator_id, organization_id=org.id, role_id=1, status='active')
            db.add(membership)
            db.commit()
            db.refresh(org)
        return org

    def update_organization(self, db: Session, org_id: int, org_in: OrganizationUpdate) -> Organization:
        db_org = self.get_organization_by_id(db, org_id)
        return self.repo.update(db, db_org, org_in)

    def delete_organization(self, db: Session, org_id: int) -> None:
        db_org = self.get_organization_by_id(db, org_id)
        self.repo.delete(db, db_org)
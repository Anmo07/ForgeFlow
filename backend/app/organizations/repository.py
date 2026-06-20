from sqlalchemy.orm import Session
from typing import List, Optional
from .models import Organization
from .schema import OrganizationCreate, OrganizationUpdate

class OrganizationRepository:

    def get_by_id(self, db: Session, org_id: int) -> Optional[Organization]:
        return db.query(Organization).filter(Organization.id == org_id).first()

    def get_by_uuid(self, db: Session, org_uuid: str) -> Optional[Organization]:
        return db.query(Organization).filter(Organization.uuid == org_uuid).first()

    def get_by_slug(self, db: Session, slug: str) -> Optional[Organization]:
        return db.query(Organization).filter(Organization.slug == slug).first()

    def list(self, db: Session, skip: int=0, limit: int=100) -> List[Organization]:
        return db.query(Organization).offset(skip).limit(limit).all()

    def create(self, db: Session, org_in: OrganizationCreate) -> Organization:
        db_org = Organization(name=org_in.name, slug=org_in.slug, logo_url=org_in.logo_url, industry=org_in.industry, company_size=org_in.company_size, website=org_in.website, description=org_in.description)
        db.add(db_org)
        db.commit()
        db.refresh(db_org)
        return db_org

    def update(self, db: Session, db_org: Organization, org_in: OrganizationUpdate) -> Organization:
        update_data = org_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_org, key, value)
        db.commit()
        db.refresh(db_org)
        return db_org

    def delete(self, db: Session, db_org: Organization) -> None:
        db.delete(db_org)
        db.commit()
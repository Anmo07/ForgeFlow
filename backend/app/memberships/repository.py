from sqlalchemy.orm import Session
from typing import List, Optional
from .models import Membership

class MembershipRepository:

    def get_by_id(self, db: Session, membership_id: int) -> Optional[Membership]:
        return db.query(Membership).filter(Membership.id == membership_id).first()

    def get_by_user_and_org(self, db: Session, user_id: int, org_id: int) -> Optional[Membership]:
        return db.query(Membership).filter(Membership.user_id == user_id, Membership.organization_id == org_id).first()

    def list_by_org(self, db: Session, org_id: int, limit: int = 100, offset: int = 0) -> List[Membership]:
        return db.query(Membership).filter(Membership.organization_id == org_id).order_by(Membership.joined_at.desc()).offset(offset).limit(limit).all()

    def create(self, db: Session, user_id: int, org_id: int, role_id: int, invited_by: Optional[int]=None, status: str='invited', invite_token: Optional[str]=None) -> Membership:
        db_mem = Membership(user_id=user_id, organization_id=org_id, role_id=role_id, invited_by=invited_by, status=status, invite_token=invite_token)
        db.add(db_mem)
        db.commit()
        db.refresh(db_mem)
        return db_mem

    def update_status(self, db: Session, membership: Membership, status: str, invite_token: Optional[str]=None) -> Membership:
        membership.status = status
        if invite_token is not None:
            membership.invite_token = invite_token
        db.commit()
        db.refresh(membership)
        return membership

    def update_role(self, db: Session, membership: Membership, role_id: int) -> Membership:
        membership.role_id = role_id
        db.commit()
        db.refresh(membership)
        return membership

    def delete(self, db: Session, membership: Membership) -> None:
        db.delete(membership)
        db.commit()
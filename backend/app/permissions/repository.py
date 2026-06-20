from sqlalchemy.orm import Session
from typing import List, Optional
from .models import Permission
from .schema import PermissionCreate

class PermissionRepository:

    def get_by_id(self, db: Session, perm_id: int) -> Optional[Permission]:
        return db.query(Permission).filter(Permission.id == perm_id).first()

    def get_by_name(self, db: Session, name: str) -> Optional[Permission]:
        return db.query(Permission).filter(Permission.name == name).first()

    def list(self, db: Session, skip: int=0, limit: int=100) -> List[Permission]:
        return db.query(Permission).offset(skip).limit(limit).all()

    def create(self, db: Session, perm_in: PermissionCreate) -> Permission:
        db_perm = Permission(name=perm_in.name, description=perm_in.description)
        db.add(db_perm)
        db.commit()
        db.refresh(db_perm)
        return db_perm

    def delete(self, db: Session, db_perm: Permission) -> None:
        db.delete(db_perm)
        db.commit()
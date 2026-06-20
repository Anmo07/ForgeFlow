from sqlalchemy.orm import Session
from typing import List, Optional
from .models import Role
from .schema import RoleCreate, RoleUpdate
from ..permissions.models import Permission

class RoleRepository:

    def get_by_id(self, db: Session, role_id: int) -> Optional[Role]:
        return db.query(Role).filter(Role.id == role_id).first()

    def get_by_name_and_org(self, db: Session, name: str, org_id: Optional[int]) -> Optional[Role]:
        return db.query(Role).filter(Role.name == name, Role.organization_id == org_id).first()

    def list_system_roles(self, db: Session) -> List[Role]:
        return db.query(Role).filter(Role.is_system == True).all()

    def list_org_roles(self, db: Session, org_id: int) -> List[Role]:
        return db.query(Role).filter((Role.organization_id == org_id) | (Role.is_system == True)).all()

    def create(self, db: Session, role_in: RoleCreate, is_system: bool=False) -> Role:
        db_role = Role(name=role_in.name, description=role_in.description, organization_id=role_in.organization_id, is_system=is_system)
        if role_in.permission_ids:
            perms = db.query(Permission).filter(Permission.id.in_(role_in.permission_ids)).all()
            db_role.permissions = perms
        db.add(db_role)
        db.commit()
        db.refresh(db_role)
        return db_role

    def update(self, db: Session, db_role: Role, role_in: RoleUpdate) -> Role:
        update_data = role_in.model_dump(exclude_unset=True)
        permission_ids = update_data.pop('permission_ids', None)
        for key, value in update_data.items():
            setattr(db_role, key, value)
        if permission_ids is not None:
            perms = db.query(Permission).filter(Permission.id.in_(permission_ids)).all()
            db_role.permissions = perms
        db.commit()
        db.refresh(db_role)
        return db_role

    def delete(self, db: Session, db_role: Role) -> None:
        db.delete(db_role)
        db.commit()
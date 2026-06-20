from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List
from .repository import RoleRepository
from .schema import RoleCreate, RoleUpdate
from .models import Role

class RoleService:

    def __init__(self):
        self.repo = RoleRepository()

    def get_role_by_id(self, db: Session, role_id: int) -> Role:
        role = self.repo.get_by_id(db, role_id)
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Role not found')
        return role

    def list_org_roles(self, db: Session, org_id: int) -> List[Role]:
        return self.repo.list_org_roles(db, org_id)

    def list_system_roles(self, db: Session) -> List[Role]:
        return self.repo.list_system_roles(db)

    def create_role(self, db: Session, role_in: RoleCreate, is_system: bool=False) -> Role:
        existing = self.repo.get_by_name_and_org(db, role_in.name, role_in.organization_id)
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Role with name '{role_in.name}' already exists in this context")
        return self.repo.create(db, role_in, is_system)

    def update_role(self, db: Session, role_id: int, role_in: RoleUpdate) -> Role:
        db_role = self.get_role_by_id(db, role_id)
        if db_role.is_system:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Cannot modify system roles')
        return self.repo.update(db, db_role, role_in)

    def delete_role(self, db: Session, role_id: int) -> None:
        db_role = self.get_role_by_id(db, role_id)
        if db_role.is_system:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Cannot delete system roles')
        self.repo.delete(db, db_role)
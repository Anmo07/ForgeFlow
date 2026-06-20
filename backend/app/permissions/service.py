from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List
from .repository import PermissionRepository
from .schema import PermissionCreate
from .models import Permission

class PermissionService:

    def __init__(self):
        self.repo = PermissionRepository()

    def get_permission(self, db: Session, perm_id: int) -> Permission:
        perm = self.repo.get_by_id(db, perm_id)
        if not perm:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Permission not found')
        return perm

    def list_permissions(self, db: Session, skip: int=0, limit: int=100) -> List[Permission]:
        return self.repo.list(db, skip, limit)

    def create_permission(self, db: Session, perm_in: PermissionCreate) -> Permission:
        existing = self.repo.get_by_name(db, perm_in.name)
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Permission name already exists')
        return self.repo.create(db, perm_in)
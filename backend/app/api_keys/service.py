from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Tuple
from datetime import datetime
from .repository import APIKeyRepository
from .schema import APIKeyCreate
from .models import APIKey

class APIKeyService:

    def __init__(self):
        self.repo = APIKeyRepository()

    def list_keys(self, db: Session, org_id: int, limit: int=100, offset: int=0) -> List[APIKey]:
        return self.repo.list_by_org(db, org_id, limit=limit, offset=offset)

    def create_key(self, db: Session, key_in: APIKeyCreate, creator_id: int) -> Tuple[APIKey, str]:
        plain_key, prefix, hashed_key = self.repo.generate_raw_key(key_in.mode)
        db_key = self.repo.create(db, org_id=key_in.organization_id, creator_id=creator_id, name=key_in.name, prefix=prefix, hashed_key=hashed_key, permissions=key_in.permissions, expires_at=key_in.expires_at)
        return (db_key, plain_key)

    def rotate_key(self, db: Session, key_id: int, creator_id: int) -> Tuple[APIKey, str]:
        old_key = self.repo.get_by_id(db, key_id)
        if not old_key:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='API key not found')
        self.repo.revoke(db, old_key)
        mode = 'live'
        if 'test' in old_key.key_prefix:
            mode = 'test'
        plain_key, prefix, hashed_key = self.repo.generate_raw_key(mode)
        new_key = self.repo.create(db, org_id=old_key.organization_id, creator_id=creator_id, name=f'{old_key.name} (Rotated)', prefix=prefix, hashed_key=hashed_key, permissions=old_key.permissions, expires_at=old_key.expires_at)
        return (new_key, plain_key)

    def revoke_key(self, db: Session, key_id: int) -> None:
        key = self.repo.get_by_id(db, key_id)
        if not key:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='API key not found')
        self.repo.revoke(db, key)

    def authenticate_key(self, db: Session, plain_key: str) -> APIKey:
        hashed = self.repo._hash_key(plain_key)
        key = self.repo.get_by_hashed_key(db, hashed)
        if not key:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid or revoked API key')
        if key.expires_at and key.expires_at < datetime.utcnow():
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Expired API key')
        self.repo.update_last_used(db, key)
        return key
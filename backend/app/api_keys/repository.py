from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
from datetime import datetime
import hashlib
import secrets
from .models import APIKey

class APIKeyRepository:

    def _hash_key(self, plain_key: str) -> str:
        return hashlib.sha256(plain_key.encode()).hexdigest()

    def get_by_id(self, db: Session, key_id: int) -> Optional[APIKey]:
        return db.query(APIKey).filter(APIKey.id == key_id).first()

    def get_by_hashed_key(self, db: Session, hashed_key: str) -> Optional[APIKey]:
        return db.query(APIKey).filter(APIKey.hashed_key == hashed_key, APIKey.revoked == False).first()

    def list_by_org(self, db: Session, org_id: int, limit: int=100, offset: int=0) -> List[APIKey]:
        return db.query(APIKey).filter(APIKey.organization_id == org_id).order_by(APIKey.created_at.desc()).offset(offset).limit(limit).all()

    def generate_raw_key(self, mode: str='live') -> Tuple[str, str, str]:
        token = secrets.token_hex(24)
        prefix = f'ff_{mode}_'
        plain_key = f'{prefix}{token}'
        hashed_key = self._hash_key(plain_key)
        return (plain_key, prefix, hashed_key)

    def create(self, db: Session, org_id: int, creator_id: int, name: str, prefix: str, hashed_key: str, permissions: List[str], expires_at: Optional[datetime]=None) -> APIKey:
        db_key = APIKey(organization_id=org_id, name=name, key_prefix=prefix, hashed_key=hashed_key, permissions=permissions, created_by=creator_id, expires_at=expires_at, revoked=False)
        db.add(db_key)
        db.commit()
        db.refresh(db_key)
        return db_key

    def revoke(self, db: Session, key: APIKey) -> APIKey:
        key.revoked = True
        db.commit()
        db.refresh(key)
        return key

    def update_last_used(self, db: Session, key: APIKey) -> None:
        key.last_used = datetime.utcnow()
        db.commit()

    def compare_hashed_key(self, plain_key: str, hashed_key: str) -> bool:
        return secrets.compare_digest(self._hash_key(plain_key), hashed_key)

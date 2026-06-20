from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import hashlib
from .models import Session as UserSession

class SessionRepository:

    def _hash_token(self, token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()

    def get_by_id(self, db: Session, session_id: int) -> Optional[UserSession]:
        return db.query(UserSession).filter(UserSession.id == session_id).first()

    def get_by_refresh_token(self, db: Session, refresh_token: str) -> Optional[UserSession]:
        hashed = self._hash_token(refresh_token)
        return db.query(UserSession).filter(UserSession.refresh_token_hash == hashed, UserSession.revoked == False).first()

    def list_active_by_user(self, db: Session, user_id: int) -> List[UserSession]:
        return db.query(UserSession).filter(UserSession.user_id == user_id, UserSession.revoked == False, UserSession.expires_at > datetime.utcnow()).all()

    def create(self, db: Session, user_id: int, refresh_token: str, expires_at: datetime, device_name: Optional[str]=None, browser: Optional[str]=None, operating_system: Optional[str]=None, ip_address: Optional[str]=None) -> UserSession:
        hashed = self._hash_token(refresh_token)
        db_session = UserSession(user_id=user_id, refresh_token_hash=hashed, device_name=device_name, browser=browser, operating_system=operating_system, ip_address=ip_address, expires_at=expires_at, revoked=False)
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        return db_session

    def revoke(self, db: Session, session: UserSession) -> UserSession:
        session.revoked = True
        db.commit()
        db.refresh(session)
        return session

    def revoke_all_by_user(self, db: Session, user_id: int) -> None:
        db.query(UserSession).filter(UserSession.user_id == user_id, UserSession.revoked == False).update({'revoked': True})
        db.commit()

    def revoke_all_except(self, db: Session, user_id: int, current_session_id: int) -> None:
        db.query(UserSession).filter(UserSession.user_id == user_id, UserSession.id != current_session_id, UserSession.revoked == False).update({'revoked': True})
        db.commit()
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional, Tuple
from datetime import datetime
from .repository import SessionRepository
from .models import Session as UserSession

class SessionService:

    def __init__(self):
        self.repo = SessionRepository()

    def parse_user_agent(self, ua_string: Optional[str]) -> Tuple[str, str, str]:
        if not ua_string:
            return ('Unknown Device', 'Unknown Browser', 'Unknown OS')
        os_name = 'Unknown OS'
        if 'Windows' in ua_string:
            os_name = 'Windows'
        elif 'Macintosh' in ua_string or 'Mac OS X' in ua_string:
            os_name = 'macOS'
        elif 'Linux' in ua_string:
            os_name = 'Linux'
        elif 'iPhone' in ua_string:
            os_name = 'iOS (iPhone)'
        elif 'Android' in ua_string:
            os_name = 'Android'
        browser_name = 'Unknown Browser'
        if 'Edge' in ua_string or 'Edg/' in ua_string:
            browser_name = 'Edge'
        elif 'Chrome' in ua_string or 'Chromium' in ua_string:
            browser_name = 'Chrome'
        elif 'Safari' in ua_string:
            browser_name = 'Safari'
        elif 'Firefox' in ua_string:
            browser_name = 'Firefox'
        device_name = 'Desktop'
        if 'iPhone' in ua_string:
            device_name = 'iPhone'
        elif 'iPad' in ua_string:
            device_name = 'iPad'
        elif 'Android' in ua_string:
            device_name = 'Android Mobile'
        elif 'Mobile' in ua_string:
            device_name = 'Mobile'
        return (device_name, browser_name, os_name)

    def list_sessions(self, db: Session, user_id: int) -> List[UserSession]:
        return self.repo.list_active_by_user(db, user_id)

    def register_session(self, db: Session, user_id: int, refresh_token: str, expires_at: datetime, ua_string: Optional[str]=None, ip_address: Optional[str]=None) -> UserSession:
        device_name, browser, os_name = self.parse_user_agent(ua_string)
        return self.repo.create(db, user_id=user_id, refresh_token=refresh_token, expires_at=expires_at, device_name=device_name, browser=browser, operating_system=os_name, ip_address=ip_address)

    def revoke_session(self, db: Session, user_id: int, session_id: int) -> None:
        session = self.repo.get_by_id(db, session_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Session not found')
        if session.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot revoke another user's session")
        self.repo.revoke(db, session)

    def revoke_all_sessions(self, db: Session, user_id: int) -> None:
        self.repo.revoke_all_by_user(db, user_id)

    def invalidate_user_sessions(self, db: Session, user_id: int) -> None:
        self.revoke_all_sessions(db, user_id)

    def revoke_all_except_current(self, db: Session, user_id: int, current_refresh_token: str) -> None:
        current_sess = self.repo.get_by_refresh_token(db, current_refresh_token)
        if current_sess:
            self.repo.revoke_all_except(db, user_id, current_sess.id)
        else:
            self.repo.revoke_all_by_user(db, user_id)

    def get_session_by_token(self, db: Session, refresh_token: str) -> Optional[UserSession]:
        return self.repo.get_by_refresh_token(db, refresh_token)
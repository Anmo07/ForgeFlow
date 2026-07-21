from sqlalchemy.orm import Session
from .database import SessionLocal
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .security import decode_token
from ..auth.models import User
from ..memberships.models import Membership
reusable_oauth2 = HTTPBearer(auto_error=False)

def get_db() -> Generator[Session, None, None]:
    from .database import engine
    pool = engine.pool
    if hasattr(pool, "checkedout") and hasattr(pool, "size"):
        try:
            checked_out = pool.checkedout()
            pool_size = pool.size()
            if pool_size > 0:
                utilization = checked_out / pool_size
                if utilization >= 0.9:
                    raise HTTPException(
                        status_code=503,
                        detail="Database connection pool limit reached",
                        headers={"Retry-After": "30"}
                    )
        except HTTPException:
            raise
        except Exception:
            pass

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(request: Request, db: Session=Depends(get_db), token: Optional[HTTPAuthorizationCredentials]=Depends(reusable_oauth2)) -> User:
    token_str = None
    if token:
        token_str = token.credentials
    else:
        token_str = request.cookies.get('access_token')
    if not token_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Not authenticated', headers={'WWW-Authenticate': 'Bearer'})
    try:
        payload = decode_token(token_str)
        user_id = payload.get('sub')
        token_type = payload.get('type')
        sid = payload.get('sid')
        if user_id is None or token_type != 'access':
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token claims')
        if sid:
            from ..sessions.models import Session as UserSession
            from datetime import datetime
            session_record = db.query(UserSession).filter(UserSession.refresh_token_hash == sid, UserSession.revoked == False, UserSession.expires_at > datetime.utcnow()).first()
            if not session_record:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Session has been revoked or expired')
    except HTTPException as he:
        raise he
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Could not validate credentials')
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        user = db.query(User).filter(User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Inactive user')
    
    from .logging_context import user_id_ctx
    user_id_ctx.set(str(user.id))
    
    return user

def verify_org_membership(org_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> int:
    """Verify that the current user belongs to the organization and return the org_id if successful."""
    membership = db.query(Membership).filter(
        Membership.organization_id == org_id,
        Membership.user_id == current_user.id,
        Membership.status == 'active'
    ).first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='You do not have access to this organization'
        )
    return org_id

def get_current_user_optional(request: Request, db: Session=Depends(get_db), token: Optional[HTTPAuthorizationCredentials]=Depends(reusable_oauth2)) -> Optional[User]:
    try:
        return get_current_user(request, db, token)
    except HTTPException:
        return None
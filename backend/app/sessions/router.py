from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session
from typing import List
import hashlib
from ..common.dependencies import get_db, get_current_user
from ..auth.models import User
from .schema import SessionResponse
from .service import SessionService
router = APIRouter()
session_service = SessionService()

@router.get('/', response_model=List[SessionResponse])
def get_sessions(request: Request, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    sessions = session_service.list_sessions(db, current_user.id)
    rf_token = request.cookies.get('refresh_token')
    current_hash = None
    if rf_token:
        current_hash = hashlib.sha256(rf_token.encode()).hexdigest()
    response_list = []
    for s in sessions:
        resp = SessionResponse.model_validate(s)
        if current_hash and s.refresh_token_hash == current_hash:
            resp.is_current = True
        response_list.append(resp)
    return response_list

@router.delete('/{session_id}', status_code=status.HTTP_204_NO_CONTENT)
def revoke_session(session_id: int, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    session_service.revoke_session(db, current_user.id, session_id)
    return None

@router.delete('/', status_code=status.HTTP_204_NO_CONTENT)
def revoke_all_sessions(db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    session_service.revoke_all_sessions(db, current_user.id)
    return None

@router.post('/logout', status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    rf_token = request.cookies.get('refresh_token')
    if rf_token:
        session = session_service.get_session_by_token(db, rf_token)
        if session and session.user_id == current_user.id:
            session_service.revoke_session(db, current_user.id, session.id)
    return None
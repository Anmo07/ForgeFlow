from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..common.dependencies import get_db, get_current_user, verify_org_membership
from ..auth.models import User
from .schema import MembershipInvite, MembershipRoleChange, MembershipResponse, SendInviteRequest, SendInviteResponse, AcceptInviteRequest, AcceptInviteResponse
from .service import MembershipService
router = APIRouter()
mem_service = MembershipService()

@router.post('/invite', response_model=MembershipResponse, status_code=status.HTTP_201_CREATED)
def invite_user(req: MembershipInvite, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    _ = verify_org_membership(req.organization_id, current_user, db)
    return mem_service.invite_user(db, req, invited_by=current_user.id)

@router.post('/send-invite', response_model=SendInviteResponse, status_code=status.HTTP_200_OK)
def send_invite(req: SendInviteRequest, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    _ = verify_org_membership(req.organization_id, current_user, db)
    return mem_service.send_invite(db, req, invited_by=current_user.id)

@router.post('/accept-invite', response_model=AcceptInviteResponse, status_code=status.HTTP_201_CREATED)
def accept_invite(req: AcceptInviteRequest, db: Session=Depends(get_db), current_user: Optional[User]=Depends(get_current_user)):
    return mem_service.accept_invite(db, req, current_user=current_user)

@router.post('/{membership_id}/accept', response_model=MembershipResponse)
def accept_invite_legacy(membership_id: int, token: Optional[str]=None, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    return mem_service.accept_invitation(db, membership_id, current_user.id, token=token)

@router.put('/{membership_id}/role', response_model=MembershipResponse)
def change_role(membership_id: int, req: MembershipRoleChange, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    membership = mem_service.get_membership(db, membership_id)
    if not membership:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Membership not found')
    _ = verify_org_membership(membership.organization_id, current_user, db)
    return mem_service.change_role(db, membership_id, req)

@router.delete('/{membership_id}', status_code=status.HTTP_204_NO_CONTENT)
def remove_member(membership_id: int, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    membership = mem_service.get_membership(db, membership_id)
    if not membership:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Membership not found')
    _ = verify_org_membership(membership.organization_id, current_user, db)
    mem_service.remove_member(db, membership_id)
    return None

@router.get('/organization/{org_id}', response_model=List[MembershipResponse])
def list_org_members(org_id: int, limit: int=100, offset: int=0, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    _ = verify_org_membership(org_id, current_user, db)
    if limit > 1000:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Maximum page size is 1000')
    return mem_service.list_members(db, org_id, limit=limit, offset=offset)
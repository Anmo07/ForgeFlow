from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from .repository import MembershipRepository
from .schema import MembershipInvite, MembershipRoleChange, SendInviteRequest, AcceptInviteRequest
from .models import Membership
from ..auth.models import User
from ..auth.repository import AuthRepository
from ..organizations.repository import OrganizationRepository
from ..roles.repository import RoleRepository
from . import invite_token

class MembershipService:

    def __init__(self):
        self.repo = MembershipRepository()
        self.auth_repo = AuthRepository()
        self.org_repo = OrganizationRepository()
        self.role_repo = RoleRepository()

    def get_membership(self, db: Session, membership_id: int) -> Membership:
        mem = self.repo.get_by_id(db, membership_id)
        if not mem:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Membership not found')
        return mem

    def list_members(self, db: Session, org_id: int, limit: int=100, offset: int=0) -> List[Membership]:
        org = self.org_repo.get_by_id(db, org_id)
        if not org:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Organization not found')
        return self.repo.list_by_org(db, org_id, limit=limit, offset=offset)

    def invite_user(self, db: Session, invite_in: MembershipInvite, invited_by: Optional[int]=None) -> Membership:
        org = self.org_repo.get_by_id(db, invite_in.organization_id)
        if not org:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Organization not found')
        role = self.role_repo.get_by_id(db, invite_in.role_id)
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Role not found')
        user = self.auth_repo.get_by_email(db, invite_in.email)
        if not user:
            from ..common.security import get_password_hash
            import uuid
            random_pw = str(uuid.uuid4())
            user = User(email=invite_in.email, hashed_password=get_password_hash(random_pw), full_name=invite_in.email.split('@')[0].capitalize(), is_active=True)
            db.add(user)
            db.commit()
            db.refresh(user)
        existing_mem = self.repo.get_by_user_and_org(db, user.id, invite_in.organization_id)
        import secrets
        token = secrets.token_urlsafe(32)
        if existing_mem:
            if existing_mem.status == 'removed':
                return self.repo.update_status(db, existing_mem, 'invited', invite_token=token)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='User is already a member or has an active invitation to this organization')
        return self.repo.create(db, user.id, invite_in.organization_id, invite_in.role_id, invited_by, 'invited', invite_token=token)

    def accept_invitation(self, db: Session, membership_id: int, user_id: int, token: Optional[str]=None) -> Membership:
        membership = self.get_membership(db, membership_id)
        if token:
            if membership.invite_token != token:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid or expired invitation token')
        elif membership.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='You cannot accept an invitation for another user')
        if membership.status != 'invited':
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot accept invitation because membership status is '{membership.status}'")
        membership.invite_token = None
        return self.repo.update_status(db, membership, 'active')

    def change_role(self, db: Session, membership_id: int, change_in: MembershipRoleChange) -> Membership:
        membership = self.get_membership(db, membership_id)
        role = self.role_repo.get_by_id(db, change_in.role_id)
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Role not found')
        return self.repo.update_role(db, membership, change_in.role_id)

    def remove_member(self, db: Session, membership_id: int) -> None:
        membership = self.get_membership(db, membership_id)
        self.repo.delete(db, membership)

    def send_invite(self, db: Session, req: SendInviteRequest, invited_by: int) -> dict:
        org = self.org_repo.get_by_id(db, req.organization_id)
        if not org:
            return {'message': 'If an account with this email exists, an invite has been sent.', 'invite_sent': True}
        role = self.role_repo.get_by_id(db, req.role_id)
        if not role:
            return {'message': 'If an account with this email exists, an invite has been sent.', 'invite_sent': True}
        user = self.auth_repo.get_by_email(db, req.email)
        if user:
            existing_mem = self.repo.get_by_user_and_org(db, user.id, req.organization_id)
            if existing_mem and existing_mem.status in ('active', 'invited'):
                return {'message': 'If an account with this email exists, an invite has been sent.', 'invite_sent': True}
        if invite_token.has_pending_invite(req.email, req.organization_id):
            return {'message': 'If an account with this email exists, an invite has been sent.', 'invite_sent': True}
        raw_token, token_hash = invite_token.generate_invite_token()
        invite_token.store_invite_token(token_hash=token_hash, org_id=req.organization_id, invited_email=req.email, role_id=req.role_id, invited_by_user_id=invited_by, ttl_seconds=604800)
        from ..common.redis import redis_client
        redis_client.setex(f'invite_raw:{raw_token}', 604800, req.email)
        print(f'[DEV] Invite token for {req.email}: {raw_token}')
        return {'message': 'If an account with this email exists, an invite has been sent.', 'invite_sent': True}

    def accept_invite(self, db: Session, req: AcceptInviteRequest, current_user: Optional[User]=None) -> Membership:
        metadata = invite_token.validate_invite_token(req.token)
        if not metadata:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid or expired invitation token')
        org_id = int(metadata['org_id'])
        invited_email = metadata['email']
        role_id = int(metadata['role_id'])
        invited_by_user_id = int(metadata['invited_by'])
        user = self.auth_repo.get_by_email(db, invited_email)
        if not user:
            if not req.password:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Password required for new account')
            from ..common.security import get_password_hash
            user = User(email=invited_email, hashed_password=get_password_hash(req.password), full_name=invited_email.split('@')[0].capitalize(), is_active=True, is_verified=True)
            db.add(user)
            db.commit()
            db.refresh(user)
        elif current_user and current_user.id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='This invitation is for a different email address. Please log in as the correct user.')
        existing_mem = self.repo.get_by_user_and_org(db, user.id, org_id)
        if existing_mem:
            if existing_mem.status == 'active':
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='User is already an active member of this organization')
            elif existing_mem.status == 'invited':
                existing_mem.status = 'active'
                db.commit()
                db.refresh(existing_mem)
                invite_token.consume_invite_token(req.token)
                return existing_mem
        membership = self.repo.create(db, user_id=user.id, organization_id=org_id, role_id=role_id, invited_by=invited_by_user_id, status='active')
        invite_token.consume_invite_token(req.token)
        return membership
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class MembershipInvite(BaseModel):
    email: EmailStr
    organization_id: int
    role_id: int

class MembershipAccept(BaseModel):
    membership_id: int

class MembershipRoleChange(BaseModel):
    role_id: int

class UserMinResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None

    class Config:
        from_attributes = True

class RoleMinResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class MembershipResponse(BaseModel):
    id: int
    user_id: int
    organization_id: int
    role_id: int
    joined_at: datetime
    invited_by: Optional[int] = None
    status: str
    user: UserMinResponse
    role: RoleMinResponse

    class Config:
        from_attributes = True

class SendInviteRequest(BaseModel):
    email: EmailStr
    organization_id: int
    role_id: int

class SendInviteResponse(BaseModel):
    message: str
    invite_sent: bool

class AcceptInviteRequest(BaseModel):
    token: str = Field(..., description='Invite token from email link')
    password: Optional[str] = Field(None, min_length=8, description='Password if creating new account')

class AcceptInviteResponse(MembershipResponse):
    pass
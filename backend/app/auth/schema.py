from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserRegister(UserBase):
    password: str = Field(..., min_length=8)
    turnstile_token: str = Field(..., description='Cloudflare Turnstile challenge token')

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    turnstile_token: str = Field(..., description='Cloudflare Turnstile challenge token')

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool = False

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = 'bearer'
    user: Optional[UserResponse] = None

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None
    sid: Optional[str] = None

class VerifyEmailRequest(BaseModel):
    token: str = Field(..., description='Email verification token from email link')

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str = Field(..., description='Password reset token from email link')
    new_password: str = Field(..., min_length=8, description='New password')

class MFASetupResponse(BaseModel):
    secret: str = Field(..., description='TOTP secret (base32)')
    provisioning_uri: str = Field(..., description='QR code provisioning URI')

class MFAVerifyRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6, description='6-digit TOTP code')

class MFASetupCompleteResponse(BaseModel):
    backup_codes: List[str] = Field(..., description='List of single-use backup codes')

class MFALoginRequest(BaseModel):
    email: EmailStr
    password: str
    turnstile_token: str = Field(..., description='Cloudflare Turnstile challenge token')

class MFAVerifyLoginRequest(BaseModel):
    temp_token: str = Field(..., description='Temporary token from initial login')
    code: str = Field(..., description='TOTP code or backup code')
from pydantic import BaseModel
from typing import Optional, List
from ..permissions.schema import PermissionResponse

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    organization_id: Optional[int] = None

class RoleCreate(RoleBase):
    permission_ids: Optional[List[int]] = []

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[int]] = None

class CustomRoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    permission_ids: Optional[List[int]] = []

class CustomRoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[int]] = None

class RoleResponse(RoleBase):
    id: int
    is_system: bool
    permissions: List[PermissionResponse] = []


    class Config:
        from_attributes = True
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field

class ErrorCode(str, Enum):
    SYSTEM_ERROR = "SYSTEM_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    TIMEOUT_ERROR = "TIMEOUT_ERROR"
    NOT_FOUND = "NOT_FOUND"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    FORBIDDEN = "FORBIDDEN"
    UNAUTHORIZED = "UNAUTHORIZED"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    CONFLICT = "CONFLICT"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"

from typing import Optional

class ErrorResponse(BaseModel):
    error_code: ErrorCode = Field(..., description="Machine-readable error identifier")
    message: str = Field(..., description="User-safe human-readable message")
    request_id: str = Field(..., description="Correlation ID for tracking and logs")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Time when error occurred")
    detail: Optional[str] = Field(None, description="FastAPI/Starlette backward compatibility field")

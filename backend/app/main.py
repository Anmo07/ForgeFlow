import logging
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Depends, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func, text
import prometheus_client

from .auth.router import router as auth_router
from .organizations.router import router as org_router
from .memberships.router import router as memberships_router
from .roles.router import router as roles_router
from .permissions.router import router as permissions_router
from .sessions.router import router as sessions_router
from .activity_logs.router import router as activity_logs_router
from .api_keys.router import router as api_keys_router
from .projects.router import router as projects_router
from .crm.router import router as crm_router
from .invoices.router import router as invoices_router
from .auth.sso_router import router as sso_router

# New routers for Phase 6
from .attachments.router import router as attachments_router
from .notifications.router import router as notifications_router
from .security.router import router as security_router
from .ingress.router import router as ingress_router
from .compliance.router import router as compliance_router
from .common.dlq_router import router as dlq_router

from .common.middleware import (
    SecurityHeadersMiddleware, 
    LoggingAndTimingMiddleware, 
    CSRFMiddleware,
    RequestIDMiddleware,
    RequestTimeoutMiddleware
)
from .common.config import CORS_ALLOWED_ORIGINS, DATABASE_URL
from .common.dependencies import get_db
from .attachments.models import Attachment

from .common.rate_limit import limiter
from slowapi.errors import RateLimitExceeded
from .common.errors import ErrorResponse, ErrorCode
from .common.logging_context import request_id_ctx
from .common.logging import setup_logging

# Configure structured JSON logging on import
setup_logging()
logger = logging.getLogger("forgeflow.api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    from .common.config import is_testing as _check_is_testing
    is_testing = _check_is_testing()
    if is_testing:
        logger.info("Running in testing environment: skipping fail-fast dependency validation.")
        yield
        logger.info("Shutting down ForgeFlow Backend: disposing database connection pool...")
        from .common.database import engine
        engine.dispose()
        logger.info("Database engine pool disposed cleanly.")
        return

    # Startup validation
    logger.info("Starting ForgeFlow Backend: validating core dependency connectivity...")
    
    # 1. Validate DB
    try:
        from .common.database import SessionLocal
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        logger.info("Database connection validated successfully.")
    except Exception as e:
        logger.critical(f"FATAL: Database connection failed during startup: {e}")
        raise SystemExit(1)
        
    # 2. Validate Redis
    try:
        from .common.redis import redis_client
        if not redis_client.ping():
            raise Exception("Ping returned False")
        logger.info("Redis connection validated successfully.")
    except Exception as e:
        logger.warning(f"Redis connection failed during startup: {e}. Running in degraded state.")
        
    # 3. Validate MinIO
    try:
        from .common.minio import minio_client
        # Simple health check bucket call
        minio_client.client.bucket_exists("health-check-bucket-exists")
        logger.info("MinIO connection validated successfully.")
    except Exception as e:
        logger.warning(f"MinIO connection failed during startup: {e}. Running in degraded state.")
        
    yield
    
    # Shutdown cleanup
    logger.info("Shutting down ForgeFlow Backend: disposing database connection pool...")
    from .common.database import engine
    engine.dispose()
    logger.info("Database engine pool disposed cleanly.")
    
import sentry_sdk
import os

def scrub_sensitive_fields(event, hint):
    sensitive_keys = {"password", "token", "secret", "mfa_secret", "api_key", "cookie", "authorization"}
    
    def _scrub(val):
        if isinstance(val, dict):
            return {
                k: "[SCRUBBED]" if any(sk in k.lower() for sk in sensitive_keys) else _scrub(v)
                for k, v in val.items()
            }
        elif isinstance(val, list):
            return [_scrub(item) for item in val]
        return val

    # Scrub event request, exception mechanism, extra context, etc.
    if "request" in event:
        request = event["request"]
        if "headers" in request:
            request["headers"] = _scrub(request["headers"])
        if "cookies" in request:
            request["cookies"] = _scrub(request["cookies"])
        if "data" in request:
            request["data"] = _scrub(request["data"])
            
    if "user" in event:
        event["user"] = _scrub(event["user"])
        
    if "contexts" in event:
        event["contexts"] = _scrub(event["contexts"])
        
    if "extra" in event:
        event["extra"] = _scrub(event["extra"])
        
    return event

SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=os.getenv("SENTRY_ENVIRONMENT", "production"),
        traces_sample_rate=0.1,
        profiles_sample_rate=0.1,
        send_default_pii=False,
        before_send=scrub_sensitive_fields
    )

app = FastAPI(title='ForgeFlow Backend', version='0.4.0', lifespan=lifespan)
app.state.limiter = limiter

# Exception Handlers
@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    req_id = request_id_ctx.get() or ""
    logger.warning(f"RateLimitExceeded on {request.url.path}")
    msg = "Rate limit exceeded. Please slow down."
    content = ErrorResponse(
        error_code=ErrorCode.RATE_LIMIT_EXCEEDED,
        message=msg,
        request_id=req_id,
        timestamp=datetime.utcnow(),
        detail=msg
    ).model_dump(mode="json")
    return JSONResponse(status_code=429, content=content)

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    req_id = request_id_ctx.get() or ""
    logger.warning(f"HTTPException: {exc.detail} (Status: {exc.status_code})")
    
    error_code = ErrorCode.SYSTEM_ERROR
    if exc.status_code == 404:
        error_code = ErrorCode.NOT_FOUND
    elif exc.status_code == 403:
        error_code = ErrorCode.FORBIDDEN
    elif exc.status_code == 401:
        error_code = ErrorCode.UNAUTHORIZED
    elif exc.status_code == 409:
        error_code = ErrorCode.CONFLICT
    elif exc.status_code == 503:
        error_code = ErrorCode.SERVICE_UNAVAILABLE
        
    content = ErrorResponse(
        error_code=error_code,
        message=str(exc.detail),
        request_id=req_id,
        timestamp=datetime.utcnow(),
        detail=str(exc.detail)
    ).model_dump(mode="json")
    headers = getattr(exc, "headers", None)
    return JSONResponse(status_code=exc.status_code, content=content, headers=headers)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    req_id = request_id_ctx.get() or ""
    errors = []
    for err in exc.errors():
        loc = " -> ".join(str(x) for x in err.get("loc", []))
        msg = err.get("msg", "invalid value")
        errors.append(f"{loc}: {msg}")
    
    message = "Validation failed: " + "; ".join(errors)
    logger.warning(f"RequestValidationError: {message}")
    
    content = ErrorResponse(
        error_code=ErrorCode.VALIDATION_ERROR,
        message=message,
        request_id=req_id,
        timestamp=datetime.utcnow(),
        detail=message
    ).model_dump(mode="json")
    return JSONResponse(status_code=422, content=content)

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    req_id = request_id_ctx.get() or ""
    logger.error("SQLAlchemy database exception occurred", exc_info=exc)
    
    msg = "A database error occurred. Please try again later."
    content = ErrorResponse(
        error_code=ErrorCode.DATABASE_ERROR,
        message=msg,
        request_id=req_id,
        timestamp=datetime.utcnow(),
        detail=msg
    ).model_dump(mode="json")
    return JSONResponse(status_code=503, content=content)

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    req_id = request_id_ctx.get() or ""
    logger.error("Unhandled exception occurred", exc_info=exc)
    
    msg = "An unexpected system error occurred. Please contact support."
    content = ErrorResponse(
        error_code=ErrorCode.SYSTEM_ERROR,
        message=msg,
        request_id=req_id,
        timestamp=datetime.utcnow(),
        detail=msg
    ).model_dump(mode="json")
    return JSONResponse(status_code=500, content=content)

# Middlewares (ordered so that RequestID runs first in the execution pipeline)
app.add_middleware(SecurityHeadersMiddleware)
from starlette.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)  # Compress responses > 1KB
app.add_middleware(LoggingAndTimingMiddleware)
app.add_middleware(RequestTimeoutMiddleware)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(CSRFMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token", "X-Organization-ID", "X-Request-ID"],
)

# Legacy routes
app.include_router(auth_router, prefix='/api/auth', tags=['auth'])
app.include_router(sso_router, prefix='/api/auth/sso', tags=['sso'])
app.include_router(org_router, prefix='/api/organizations', tags=['organizations'])
app.include_router(memberships_router, prefix='/api/memberships', tags=['memberships'])
app.include_router(roles_router, prefix='/api/roles', tags=['roles'])
app.include_router(permissions_router, prefix='/api/permissions', tags=['permissions'])
app.include_router(sessions_router, prefix='/api/sessions', tags=['sessions'])
app.include_router(activity_logs_router, prefix='/api/activity-logs', tags=['activity-logs'])
app.include_router(api_keys_router, prefix='/api/api-keys', tags=['api-keys'])
app.include_router(projects_router, prefix='/api/projects', tags=['projects'])
app.include_router(crm_router, prefix='/api/crm', tags=['crm'])
app.include_router(invoices_router, prefix='/api/invoices', tags=['invoices'])

# V1 routes
app.include_router(projects_router, prefix='/api/v1/projects', tags=['projects-v1'])
app.include_router(attachments_router, prefix='/api/v1/attachments', tags=['attachments-v1'])
app.include_router(notifications_router, prefix='/api/v1/notifications', tags=['notifications-v1'])
app.include_router(security_router, prefix='/api/v1/security', tags=['security-v1'])
app.include_router(ingress_router, prefix='/api/v1/ingress', tags=['ingress-v1'])
app.include_router(compliance_router, prefix='/api/v1/compliance', tags=['compliance-v1'])
app.include_router(dlq_router, tags=['admin-dlq'])


@app.get('/metrics')
def metrics(db: Session = Depends(get_db)):
    """Exposes system-wide Prometheus metrics.
    Gathers active attachment database sizes on scape.
    """
    from .common.metrics import STORAGE_USAGE
    total_size = db.query(func.sum(Attachment.file_size)).filter(Attachment.status == 'active').scalar() or 0
    STORAGE_USAGE.set(total_size)
    return Response(
        content=prometheus_client.generate_latest(),
        media_type=prometheus_client.CONTENT_TYPE_LATEST
    )

# Health & Resilience routes
@app.get('/api/health/live')
@app.get('/health')
@app.get('/healthz')
async def health_check_live():
    """Liveness check: process is alive."""
    return {'status': 'ok'}

@app.get('/api/health/ready')
async def health_check_ready():
    """Readiness check: deep validation of backend dependencies."""
    failing = []
    
    # 1. Test Database
    try:
        from .common.database import SessionLocal
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception:
        failing.append("database")
        
    # 2. Test Redis
    try:
        from .common.redis import redis_client
        if not redis_client.ping():
            raise Exception("ping failed")
    except Exception:
        failing.append("redis")
        
    # 3. Test MinIO
    try:
        from .common.minio import minio_client
        minio_client.client.bucket_exists("health-check-bucket-exists")
    except Exception:
        failing.append("minio")
        
    if failing:
        return JSONResponse(
            status_code=503,
            content={'status': 'degraded', 'failing': failing}
        )
    return {'status': 'ok'}
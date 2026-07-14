import time
import asyncio
import os
import logging
from datetime import datetime
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse

from .logging_context import request_id_ctx, user_id_ctx, org_id_ctx
from .errors import ErrorResponse, ErrorCode

logger = logging.getLogger("forgeflow.api")

class SecurityHeadersMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['Content-Security-Policy'] = "default-src 'self'; frame-ancestors 'none';"
        return response

class RequestIDMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):
        req_id = request.headers.get("X-Request-ID")
        if not req_id:
            import uuid
            req_id = str(uuid.uuid4())
            
        request_id_ctx.set(req_id)
        
        org_id = request.headers.get("X-Organization-ID")
        if org_id:
            org_id_ctx.set(org_id)
            
        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = req_id
            return response
        finally:
            request_id_ctx.set(None)
            org_id_ctx.set(None)
            user_id_ctx.set(None)

class RequestTimeoutMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):
        # Allow PDF streaming longer processing time
        if "/pdf" in request.url.path:
            return await call_next(request)
            
        timeout_seconds = float(os.getenv("API_REQUEST_TIMEOUT_SECONDS", "25.0"))
        try:
            return await asyncio.wait_for(call_next(request), timeout=timeout_seconds)
        except asyncio.TimeoutError:
            req_id = request_id_ctx.get() or ""
            logger.error(f"Request timeout exceeded for path {request.url.path}")
            
            msg = "Request timeout exceeded. Please retry."
            content = ErrorResponse(
                error_code=ErrorCode.TIMEOUT_ERROR,
                message=msg,
                request_id=req_id,
                timestamp=datetime.utcnow(),
                detail=msg
            ).model_dump(mode="json")
            
            return JSONResponse(
                status_code=503,
                content=content,
                headers={"Retry-After": "5"}
            )

class LoggingAndTimingMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if any(x in path for x in ("/health/live", "/health/ready", "/metrics", "/docs", "/openapi.json")):
            return await call_next(request)
            
        start_time = time.time()
        method = request.method
        
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            response.headers['X-Process-Time'] = str(process_time)
            
            duration_ms = int(process_time * 1000)
            status_code = response.status_code
            log_msg = f"{method} {path} completed with status {status_code} in {duration_ms}ms"
            
            extra = {
                "method": method,
                "path": path,
                "status_code": status_code,
                "duration_ms": duration_ms
            }
            if status_code >= 500:
                logger.error(log_msg, extra=extra)
            elif status_code >= 400:
                logger.warning(log_msg, extra=extra)
            else:
                logger.info(log_msg, extra=extra)
                
            return response
        except Exception as e:
            process_time = time.time() - start_time
            duration_ms = int(process_time * 1000)
            logger.error(
                f"{method} {path} failed in {duration_ms}ms with error: {str(e)}", 
                exc_info=True,
                extra={
                    "method": method,
                    "path": path,
                    "status_code": 500,
                    "duration_ms": duration_ms
                }
            )
            raise

class CSRFMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):
        if request.method in ('POST', 'PUT', 'DELETE', 'PATCH'):
            import os
            is_testing = os.getenv('TESTING') == 'True' or 'test' in os.getenv('DATABASE_URL', 'sqlite')
            force_test_validation = request.headers.get('X-Test-CSRF-Validation') == 'true'
            path = request.url.path
            is_auth_route = any((x in path for x in ('/api/auth/login', '/api/auth/register', '/api/auth/refresh')))
            if not is_auth_route and (not is_testing or force_test_validation):
                csrf_cookie = request.cookies.get('csrf_token')
                csrf_header = request.headers.get('X-CSRF-Token')
                if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
                    from fastapi.responses import JSONResponse
                    return JSONResponse(status_code=403, content={'detail': 'CSRF verification failed'})
        response = await call_next(request)
        if not request.cookies.get('csrf_token'):
            import secrets
            token = secrets.token_hex(32)
            response.set_cookie(key='csrf_token', value=token, httponly=False, samesite='strict', secure=True, path='/')
        return response
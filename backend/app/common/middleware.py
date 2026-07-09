from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import time

class SecurityHeadersMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['Content-Security-Policy'] = "default-src 'self'; frame-ancestors 'none';"
        return response

class LoggingAndTimingMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers['X-Process-Time'] = str(process_time)
        return response

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
from fastapi import HTTPException, status, Request
from fastapi.responses import JSONResponse
from typing import Callable
import functools
READ_ONLY_METHODS = {'GET', 'HEAD', 'OPTIONS'}
UNVERIFIED_ALLOWED_ROUTES = {'/api/auth/login', '/api/auth/register', '/api/auth/logout', '/api/auth/refresh', '/api/auth/verify-email', '/api/auth/forgot-password', '/api/auth/reset-password', '/api/auth/csrf-token', '/api/memberships/accept-invite'}

async def unverified_user_middleware(request: Request, call_next: Callable):
    import os
    if os.getenv('REQUIRE_EMAIL_VERIFICATION', 'false').lower() != 'true':
        return await call_next(request)
    current_user = request.state.get('user')
    if not current_user or current_user.is_verified:
        return await call_next(request)
    path = request.url.path
    if path in UNVERIFIED_ALLOWED_ROUTES:
        return await call_next(request)
    if request.method in READ_ONLY_METHODS:
        return await call_next(request)
    return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={'detail': 'Email verification required to perform this action. Check your email for verification link.'})

def require_verified(func: Callable) -> Callable:

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        current_user = kwargs.get('current_user')
        if not current_user or not current_user.is_verified:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Email verification required. Check your email for verification link.')
        return await func(*args, **kwargs)
    return wrapper
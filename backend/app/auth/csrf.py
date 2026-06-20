import secrets
from typing import Optional
from ..common.redis import redis_client

def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)

def store_csrf_token(token: str, ttl_seconds: int=3600) -> None:
    redis_client.setex(f'csrf_token:{token}', ttl_seconds, '1')

def validate_csrf_token(token: str, stored_token: Optional[str]=None) -> bool:
    if not token or len(token) < 20:
        return False
    exists = redis_client.exists(f'csrf_token:{token}')
    if stored_token:
        return token == stored_token
    return True
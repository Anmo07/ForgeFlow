import os
import sys
_PLACEHOLDER_JWT = 'CHANGE_ME_TO_A_STRONG_RANDOM_VALUE'
_PLACEHOLDER_MINIO = 'CHANGE_ME_TO_A_STRONG_MINIO_PASSWORD'

def _is_testing() -> bool:
    if os.getenv('TESTING', '').lower() in ('true', '1', 'yes'):
        return True
    db_url = os.getenv('DATABASE_URL', '')
    return 'test' in db_url or db_url.startswith('sqlite:')

def _require(name: str, *, default: str=None, allow_placeholder: bool=False) -> str:
    value = os.getenv(name, default)
    if not value:
        print(f"FATAL: Required environment variable '{name}' is not set. Copy .env.example to .env and configure it.", file=sys.stderr)
        sys.exit(1)
    if not allow_placeholder and value == _PLACEHOLDER_JWT:
        print(f"FATAL: '{name}' is still set to the placeholder value. Generate a cryptographically strong random string before starting.", file=sys.stderr)
        sys.exit(1)
    return value
_testing = _is_testing()
JWT_SECRET_KEY = _require('JWT_SECRET_KEY', default=_PLACEHOLDER_JWT if _testing else None, allow_placeholder=_testing)
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+psycopg2://postgres:postgres@postgres:5432/forgeflow')
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
MINIO_ENDPOINT = os.getenv('MINIO_ENDPOINT', 'localhost:9000')
MINIO_ACCESS_KEY = os.getenv('MINIO_ACCESS_KEY', 'minioadmin')
MINIO_SECRET_KEY = os.getenv('MINIO_SECRET_KEY', _PLACEHOLDER_MINIO if _testing else None)
MINIO_SECURE = os.getenv('MINIO_SECURE', 'False').lower() in ('true', '1', 'yes')
TURNSTILE_SECRET_KEY = os.getenv('TURNSTILE_SECRET_KEY', '1x00000000000000000000000000000AA')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '30'))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv('REFRESH_TOKEN_EXPIRE_DAYS', '30'))
CORS_ORIGINS = [origin.strip() for origin in os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5500,http://127.0.0.1:5500,http://localhost:80,http://localhost').split(',') if origin.strip()]
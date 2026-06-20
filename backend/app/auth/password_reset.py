import hashlib
import secrets
import hmac
from datetime import datetime, timedelta
from typing import Tuple

def generate_reset_token() -> Tuple[str, str]:
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    return (raw_token, token_hash)

def verify_reset_token(raw_token: str, stored_hash: str) -> bool:
    computed_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    return hmac.compare_digest(computed_hash, stored_hash)

def get_reset_token_expiry() -> datetime:
    return datetime.utcnow() + timedelta(minutes=15)

def is_token_expired(expires_at: datetime) -> bool:
    return datetime.utcnow() > expires_at
import secrets
import hashlib
from datetime import datetime
from typing import Optional, Tuple
from ..common.redis import redis_client

def generate_invite_token() -> Tuple[str, str]:
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    return (raw_token, token_hash)

def store_invite_token(token_hash: str, org_id: int, invited_email: str, role_id: int, invited_by_user_id: int, ttl_seconds: int=604800) -> None:
    key = f'invite_token:{token_hash}'
    metadata = {'org_id': str(org_id), 'email': invited_email, 'role_id': str(role_id), 'invited_by': str(invited_by_user_id), 'created_at': datetime.utcnow().isoformat()}
    import json
    redis_client.setex(key, ttl_seconds, json.dumps(metadata))
    redis_client.setex(f'invite_index:{invited_email}:{org_id}', ttl_seconds, token_hash)

def validate_invite_token(raw_token: str) -> Optional[dict]:
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    key = f'invite_token:{token_hash}'
    metadata_json = redis_client.get(key)
    if not metadata_json:
        return None
    import json
    try:
        metadata = json.loads(metadata_json.decode() if isinstance(metadata_json, bytes) else metadata_json)
        return metadata
    except (json.JSONDecodeError, TypeError):
        return None

def consume_invite_token(raw_token: str) -> None:
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    metadata = validate_invite_token(raw_token)
    if metadata:
        redis_client.delete(f'invite_token:{token_hash}')
        redis_client.delete(f"invite_index:{metadata['email']}:{metadata['org_id']}")

def has_pending_invite(email: str, org_id: int) -> bool:
    return redis_client.exists(f'invite_index:{email}:{org_id}') > 0
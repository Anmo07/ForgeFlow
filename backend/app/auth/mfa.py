import json
import secrets
import hashlib
import hmac
from typing import List, Tuple
try:
    import pyotp
except ImportError:
    raise ImportError('pyotp is required for MFA. Install with: pip install pyotp')

def generate_totp_secret() -> str:
    return pyotp.random_base32()

def get_totp_provisioning_uri(email: str, secret: str, issuer: str='ForgeFlow') -> str:
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name=issuer)

def verify_totp_code(secret: str, code: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)

def generate_backup_codes(count: int=8) -> Tuple[List[str], List[str]]:
    raw_codes = [secrets.token_hex(4).upper() for _ in range(count)]
    hashed_codes = [hashlib.sha256(code.encode()).hexdigest() for code in raw_codes]
    return (raw_codes, hashed_codes)

def verify_backup_code(code: str, stored_codes_json: str) -> bool:
    if not stored_codes_json:
        return False
    try:
        stored_hashes = json.loads(stored_codes_json)
    except (json.JSONDecodeError, TypeError):
        return False
    code_hash = hashlib.sha256(code.encode()).hexdigest()
    for stored in stored_hashes:
        if hmac.compare_digest(code_hash, stored):
            return True
    return False

def consume_backup_code(code: str, stored_codes_json: str) -> str:
    if not stored_codes_json:
        return stored_codes_json
    try:
        stored_hashes = json.loads(stored_codes_json)
    except (json.JSONDecodeError, TypeError):
        return stored_codes_json
    code_hash = hashlib.sha256(code.encode()).hexdigest()
    updated = [h for h in stored_hashes if not hmac.compare_digest(h, code_hash)]
    return json.dumps(updated) if updated else None
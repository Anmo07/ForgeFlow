from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import jwt
from datetime import datetime, timedelta
from typing import Optional
from .config import JWT_SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
ALGORITHM = 'HS256'
ph = PasswordHasher()

def get_password_hash(password: str) -> str:
    return ph.hash(password)

def _verify_legacy_bcrypt(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password.startswith('$2'):
        return False
    try:
        import bcrypt
        return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())
    except Exception:
        return False

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return ph.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        return _verify_legacy_bcrypt(plain_password, hashed_password)
    except Exception:
        return _verify_legacy_bcrypt(plain_password, hashed_password)

def password_needs_rehash(hashed_password: str) -> bool:
    if hashed_password.startswith('$2'):
        return True
    try:
        return ph.check_needs_rehash(hashed_password)
    except Exception:
        return True

def create_access_token(data: dict, expires_delta: Optional[timedelta]=None, sid: Optional[str]=None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({'exp': expire, 'type': 'access'})
    if sid:
        to_encode['sid'] = sid
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict, expires_delta: Optional[timedelta]=None, sid: Optional[str]=None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({'exp': expire, 'type': 'refresh'})
    if sid:
        to_encode['sid'] = sid
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
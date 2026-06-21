import redis
from typing import Optional
from .config import REDIS_URL

class RedisClient:

    def __init__(self):
        self._client: Optional[redis.Redis] = None

    @property
    def client(self) -> redis.Redis:
        if self._client is None:
            self._client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
        return self._client

    def __getattr__(self, name):
        """Proxy any undefined method calls to the underlying redis.Redis client."""
        return getattr(self.client, name)

    def ping(self) -> bool:
        try:
            return self.client.ping()
        except Exception:
            return False

    def get(self, key: str) -> Optional[str]:
        try:
            return self.client.get(key)
        except Exception:
            return None

    def set(self, key: str, value: str, expire: Optional[int]=None) -> bool:
        try:
            return self.client.set(key, value, ex=expire)
        except Exception:
            return False

    def delete(self, key: str) -> bool:
        try:
            return self.client.delete(key) > 0
        except Exception:
            return False
redis_client = RedisClient()

def check_rate_limit(key: str, max_attempts: int, window_seconds: int) -> bool:
    try:
        r = redis_client.client
        current = r.get(key)
        if current is not None:
            if int(current) >= max_attempts:
                return False
            r.incr(key)
            r.expire(key, window_seconds)
        else:
            r.set(key, 1, ex=window_seconds)
        return True
    except Exception:
        return True
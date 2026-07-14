import pytest
import redis
import time

@pytest.fixture(autouse=True)
def mock_redis_globally(monkeypatch):
    store = {} # key -> (value, expire_at)
    
    class MockRedis:
        def _get_active(self, key):
            if key not in store:
                return None
            val, expire_at = store[key]
            if expire_at is not None and time.time() > expire_at:
                store.pop(key, None)
                return None
            return val

        def get(self, key):
            val = self._get_active(key)
            if val is not None and isinstance(val, bytes):
                return val.decode('utf-8')
            return val
            
        def set(self, key, value, ex=None, *args, **kwargs):
            expire_at = time.time() + ex if ex is not None else None
            store[key] = (value, expire_at)
            return True
            
        def setex(self, key, time_seconds, value):
            expire_at = time.time() + time_seconds
            store[key] = (value, expire_at)
            return True
            
        def delete(self, key):
            store.pop(key, None)
            return True
            
        def expire(self, key, time_seconds):
            if key in store:
                val, _ = store[key]
                store[key] = (val, time.time() + time_seconds)
                return True
            return False
            
        def ping(self):
            return True
            
        def flushdb(self):
            store.clear()
            return True
            
        def exists(self, *keys):
            return sum(1 for k in keys if self._get_active(k) is not None)
            
        def keys(self, pattern):
            import fnmatch
            active_keys = [k for k in list(store.keys()) if self._get_active(k) is not None]
            return [k for k in active_keys if fnmatch.fnmatch(k, pattern)]
            
        def incr(self, key, amount=1):
            val = self._get_active(key)
            new_val = int(val or 0) + amount
            expire_at = store[key][1] if key in store else None
            store[key] = (str(new_val), expire_at)
            return new_val
            
        def decr(self, key, amount=1):
            val = self._get_active(key)
            new_val = int(val or 0) - amount
            expire_at = store[key][1] if key in store else None
            store[key] = (str(new_val), expire_at)
            return new_val
            
        def ttl(self, key):
            if key not in store:
                return -2
            val, expire_at = store[key]
            if expire_at is None:
                return -1
            remaining = int(expire_at - time.time())
            if remaining <= 0:
                store.pop(key, None)
                return -2
            return remaining
            
        @property
        def client(self):
            return self
            
        def pipeline(self, transaction=True):
            class MockPipeline:
                def __init__(self, parent):
                    self.parent = parent
                    self.cmds = []
                def zremrangebyscore(self, *args, **kwargs):
                    return self
                def zcard(self, *args, **kwargs):
                    return self
                def execute(self):
                    return []
            return MockPipeline(self)

        def zcard(self, key):
            return 0
        def zrange(self, *args, **kwargs):
            return []
        def zadd(self, *args, **kwargs):
            return True

    # Patch redis.Redis.from_url globally
    monkeypatch.setattr(redis.Redis, 'from_url', lambda *args, **kwargs: MockRedis())
    
    # Pre-emptively import both namespaces and override their singleton client instances
    for prefix in ('app', 'backend.app'):
        try:
            mod = __import__(f"{prefix}.common.redis", fromlist=['redis_client'])
            mod.redis_client._client = MockRedis()
        except ImportError:
            pass

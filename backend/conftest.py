import pytest
import redis

@pytest.fixture(autouse=True)
def mock_redis_globally(monkeypatch):
    store = {}
    class MockRedis:
        def get(self, key):
            val = store.get(key)
            if val is not None and isinstance(val, bytes):
                return val.decode('utf-8')
            return val
            
        def set(self, key, value, *args, **kwargs):
            store[key] = value
            return True
            
        def setex(self, key, time, value):
            store[key] = value
            return True
            
        def delete(self, key):
            store.pop(key, None)
            return True
            
        def expire(self, key, time):
            return True
            
        def ping(self):
            return True
            
        def flushdb(self):
            store.clear()
            return True
            
        def exists(self, *keys):
            return sum(1 for k in keys if k in store)
            
        def keys(self, pattern):
            import fnmatch
            return [k for k in store.keys() if fnmatch.fnmatch(k, pattern)]
            
        def incr(self, key, amount=1):
            val = int(store.get(key) or 0) + amount
            store[key] = str(val)
            return val
            
        def decr(self, key, amount=1):
            val = int(store.get(key) or 0) - amount
            store[key] = str(val)
            return val
            
        def ttl(self, key):
            return 900 if key in store else -2
            
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
    
    # Pre-emptively import both possible namespaces and override their singleton client instances
    for prefix in ('app', 'backend.app'):
        try:
            mod = __import__(f"{prefix}.common.redis", fromlist=['redis_client'])
            mod.redis_client._client = MockRedis()
        except ImportError:
            pass

from ..common.redis import redis_client

def get_lockout_key(user_id: int) -> str:
    return f'login_fail:{user_id}'

def get_failed_attempts_count(user_id: int) -> int:
    count = redis_client.get(get_lockout_key(user_id))
    return int(count) if count else 0

def increment_failed_attempts(user_id: int, max_failures: int=5) -> tuple[int, int]:
    key = get_lockout_key(user_id)
    count = redis_client.incr(key)
    if count == 1:
        redis_client.expire(key, 900)
    cooldown = calculate_lockout_cooldown(count, max_failures)
    if cooldown > 0:
        redis_client.expire(key, cooldown)
    return (count, cooldown)

def calculate_lockout_cooldown(attempt_count: int, max_failures: int=5) -> int:
    if attempt_count < max_failures:
        return 0
    index = attempt_count - max_failures
    delays = [30, 60, 120, 300, 900]
    if index < len(delays):
        return delays[index]
    return 900

def is_account_locked(user_id: int, max_failures: int=5) -> tuple[bool, int]:
    count = get_failed_attempts_count(user_id)
    if count < max_failures:
        return (False, 0)
    cooldown = calculate_lockout_cooldown(count, max_failures)
    ttl = redis_client.ttl(get_lockout_key(user_id))
    remaining = max(ttl, 0) if ttl > 0 else 0
    return (True, remaining)

def clear_failed_attempts(user_id: int) -> None:
    redis_client.delete(get_lockout_key(user_id))
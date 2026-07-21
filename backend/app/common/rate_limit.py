"""
Advanced rate limiting via Redis sorted sets (sliding window log).

Each request records a timestamp in a Redis sorted set. On each new request:
1. ZREMRANGEBYSCORE prunes entries older than the window.
2. ZCARD counts remaining entries.
3. If count >= limit → reject.
4. Otherwise → ZADD the current timestamp.

When ``TESTING`` mode is active (or ``RATE_LIMIT_DISABLED=true``), rate
limiting is bypassed so automated test suites are not affected.
"""

import os
import time
from typing import Any, Tuple, cast

from fastapi import HTTPException, status

from .redis import redis_client


def _is_rate_limit_disabled() -> bool:
    """Return True when rate limiting should be bypassed."""
    if os.getenv('RATE_LIMIT_DISABLED', '').lower() in ('true', '1', 'yes'):
        from .config import is_testing
        if not is_testing():
            return False  # If in production, do not allow bypass unless explicitly configured
        return True
    from .config import is_testing
    return is_testing()


class RateLimiter:
    """Sliding-window-log rate limiter backed by Redis sorted sets."""

    def check(self, key: str, max_requests: int, window_seconds: int) -> Tuple[bool, int]:
        """Check whether a request is allowed.

        Returns:
            ``(allowed, retry_after)`` — ``allowed`` is ``True`` if the
            request should proceed.  When ``False``, ``retry_after`` is
            the number of seconds the caller should wait.
        """
        if _is_rate_limit_disabled():
            return True, 0

        try:
            now = time.time()
            window_start = now - window_seconds

            pipe = redis_client.client.pipeline(transaction=True)
            pipe.zremrangebyscore(key, '-inf', window_start)
            pipe.zcard(key)
            pipe.execute()

            # Re-read count after pruning
            current_count_res = redis_client.client.zcard(key)
            current_count = int(cast(Any, current_count_res))

            if current_count >= max_requests:
                # Calculate retry-after from the oldest entry still in the window
                oldest_res = redis_client.client.zrange(key, 0, 0, withscores=True)
                oldest = cast(Any, oldest_res)
                if oldest:
                    retry_after = int(window_seconds - (now - oldest[0][1])) + 1
                    retry_after = max(retry_after, 1)
                else:
                    retry_after = window_seconds
                return False, retry_after

            # Record this request
            redis_client.client.zadd(key, {f'{now}': now})
            redis_client.client.expire(key, window_seconds + 1)
            return True, 0

        except Exception:
            # If Redis is unreachable, fail open (allow the request)
            return True, 0


# Module-level singleton
rate_limiter = RateLimiter()


def rate_limit_or_429(
    key: str,
    max_requests: int,
    window_seconds: int,
    detail: str = 'Too many requests. Please try again later.',
) -> None:
    """Check rate limit and raise HTTP 429 if exceeded.

    The response includes a ``Retry-After`` header indicating how many
    seconds the limit is active.
    """
    allowed, retry_after = rate_limiter.check(key, max_requests, window_seconds)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
            headers={'Retry-After': str(retry_after)},
        )


# SlowAPI integration
from slowapi import Limiter
from slowapi.util import get_remote_address
from .config import REDIS_URL, is_testing as _check_is_testing

is_testing_mode = _check_is_testing()
rate_limit_disabled = os.getenv('RATE_LIMIT_DISABLED', 'true').lower() in ('true', '1', 'yes') or is_testing_mode

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="memory://" if is_testing_mode else REDIS_URL,
    enabled=not rate_limit_disabled
)

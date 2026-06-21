"""Tests for Phase 5 — Advanced Auth Rate Limiting via Redis.

These tests use fakeredis to avoid requiring a running Redis instance.
"""

import time
import pytest
from unittest.mock import patch, MagicMock, PropertyMock
from fastapi import HTTPException


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def _mock_redis():
    """Provide an in-memory Redis mock for all rate-limit tests."""
    try:
        import fakeredis
        fake = fakeredis.FakeRedis(decode_responses=True)
    except ImportError:
        # Fallback: use a simple dict-based mock if fakeredis isn't installed
        pytest.skip('fakeredis not installed')
        return

    from app.common import redis as redis_mod

    original_client_prop = type(redis_mod.redis_client).client
    type(redis_mod.redis_client).client = property(lambda self: fake)

    yield fake

    type(redis_mod.redis_client).client = original_client_prop
    fake.flushall()


# ---------------------------------------------------------------------------
# Unit tests for the RateLimiter class
# ---------------------------------------------------------------------------

class TestRateLimiterUnit:

    def test_allows_requests_under_limit(self, monkeypatch):
        """Requests under the limit should be allowed."""
        monkeypatch.setenv('RATE_LIMIT_DISABLED', 'false')
        monkeypatch.delenv('TESTING', raising=False)
        monkeypatch.setenv('DATABASE_URL', 'postgresql://localhost/prod')
        from app.common.rate_limit import RateLimiter
        rl = RateLimiter()
        key = f'rl:test:unit:{time.time()}'
        for i in range(5):
            allowed, retry_after = rl.check(key, max_requests=5, window_seconds=60)
            assert allowed is True, f'Request {i+1} should have been allowed'
            assert retry_after == 0

    def test_blocks_requests_over_limit(self, monkeypatch):
        """Once the limit is reached, subsequent requests should be blocked."""
        monkeypatch.setenv('RATE_LIMIT_DISABLED', 'false')
        monkeypatch.delenv('TESTING', raising=False)
        monkeypatch.setenv('DATABASE_URL', 'postgresql://localhost/prod')
        from app.common.rate_limit import RateLimiter
        rl = RateLimiter()
        key = f'rl:test:block:{time.time()}'
        for _ in range(3):
            rl.check(key, max_requests=3, window_seconds=60)
        allowed, retry_after = rl.check(key, max_requests=3, window_seconds=60)
        assert allowed is False
        assert retry_after > 0

    def test_retry_after_is_positive(self, monkeypatch):
        """Retry-After value should be a positive integer."""
        monkeypatch.setenv('RATE_LIMIT_DISABLED', 'false')
        monkeypatch.delenv('TESTING', raising=False)
        monkeypatch.setenv('DATABASE_URL', 'postgresql://localhost/prod')
        from app.common.rate_limit import RateLimiter
        rl = RateLimiter()
        key = f'rl:test:retry:{time.time()}'
        for _ in range(2):
            rl.check(key, max_requests=2, window_seconds=60)
        allowed, retry_after = rl.check(key, max_requests=2, window_seconds=60)
        assert allowed is False
        assert isinstance(retry_after, int)
        assert retry_after >= 1

    def test_disabled_in_testing_mode(self, monkeypatch):
        """Rate limiting should be bypassed when TESTING is True."""
        monkeypatch.setenv('TESTING', 'True')
        from app.common.rate_limit import RateLimiter
        rl = RateLimiter()
        key = f'rl:test:disabled:{time.time()}'
        for _ in range(100):
            allowed, _ = rl.check(key, max_requests=1, window_seconds=60)
            assert allowed is True

    def test_disabled_via_env_toggle(self, monkeypatch):
        """Rate limiting should be bypassed when RATE_LIMIT_DISABLED=true."""
        monkeypatch.setenv('RATE_LIMIT_DISABLED', 'true')
        monkeypatch.delenv('TESTING', raising=False)
        monkeypatch.setenv('DATABASE_URL', 'postgresql://localhost/prod')
        from app.common.rate_limit import RateLimiter
        rl = RateLimiter()
        key = f'rl:test:toggle:{time.time()}'
        for _ in range(100):
            allowed, _ = rl.check(key, max_requests=1, window_seconds=60)
            assert allowed is True


# ---------------------------------------------------------------------------
# Tests for rate_limit_or_429 helper
# ---------------------------------------------------------------------------

class TestRateLimitOr429:

    def test_raises_429_with_retry_after(self, monkeypatch):
        """rate_limit_or_429 should raise HTTPException 429 with Retry-After header."""
        monkeypatch.setenv('RATE_LIMIT_DISABLED', 'false')
        monkeypatch.delenv('TESTING', raising=False)
        monkeypatch.setenv('DATABASE_URL', 'postgresql://localhost/prod')
        from app.common.rate_limit import rate_limit_or_429, rate_limiter
        key = f'rl:test:429:{time.time()}'
        for _ in range(2):
            rate_limiter.check(key, max_requests=2, window_seconds=60)
        with pytest.raises(HTTPException) as exc_info:
            rate_limit_or_429(key, max_requests=2, window_seconds=60)
        assert exc_info.value.status_code == 429
        assert 'Retry-After' in exc_info.value.headers
        assert int(exc_info.value.headers['Retry-After']) >= 1

    def test_does_not_raise_under_limit(self, monkeypatch):
        """rate_limit_or_429 should not raise when under the limit."""
        monkeypatch.setenv('RATE_LIMIT_DISABLED', 'false')
        monkeypatch.delenv('TESTING', raising=False)
        monkeypatch.setenv('DATABASE_URL', 'postgresql://localhost/prod')
        from app.common.rate_limit import rate_limit_or_429
        key = f'rl:test:ok:{time.time()}'
        rate_limit_or_429(key, max_requests=5, window_seconds=60)


# ---------------------------------------------------------------------------
# Integration-level tests (test rate limits at route-level keys)
# ---------------------------------------------------------------------------

class TestLoginRateLimitByIP:

    def test_login_returns_429_after_limit(self, monkeypatch):
        """Verify /login rate limit key blocks after exceeding IP rate limit."""
        monkeypatch.setenv('RATE_LIMIT_DISABLED', 'false')
        monkeypatch.delenv('TESTING', raising=False)
        monkeypatch.setenv('DATABASE_URL', 'postgresql://localhost/prod')
        from app.common.rate_limit import rate_limiter
        ip = f'192.168.1.{int(time.time()) % 255}'
        key = f'rl:login:ip:{ip}'
        for _ in range(10):
            rate_limiter.check(key, max_requests=10, window_seconds=60)
        allowed, retry_after = rate_limiter.check(key, max_requests=10, window_seconds=60)
        assert allowed is False
        assert retry_after > 0


class TestForgotPasswordRateLimit:

    def test_forgot_password_rate_limit(self, monkeypatch):
        """Verify forgot-password rate limit (3 per 300s window)."""
        monkeypatch.setenv('RATE_LIMIT_DISABLED', 'false')
        monkeypatch.delenv('TESTING', raising=False)
        monkeypatch.setenv('DATABASE_URL', 'postgresql://localhost/prod')
        from app.common.rate_limit import rate_limiter
        key = f'rl:forgot:ip:10.0.0.{int(time.time()) % 255}'
        for _ in range(3):
            allowed, _ = rate_limiter.check(key, max_requests=3, window_seconds=300)
            assert allowed is True
        allowed, retry_after = rate_limiter.check(key, max_requests=3, window_seconds=300)
        assert allowed is False
        assert retry_after > 0


class TestMfaVerifyRateLimit:

    def test_mfa_verify_rate_limit(self, monkeypatch):
        """Verify MFA verify endpoint rate limit."""
        monkeypatch.setenv('RATE_LIMIT_DISABLED', 'false')
        monkeypatch.delenv('TESTING', raising=False)
        monkeypatch.setenv('DATABASE_URL', 'postgresql://localhost/prod')
        from app.common.rate_limit import rate_limiter
        key = f'rl:mfa:ip:172.16.0.{int(time.time()) % 255}'
        for _ in range(10):
            allowed, _ = rate_limiter.check(key, max_requests=10, window_seconds=60)
            assert allowed is True
        allowed, _ = rate_limiter.check(key, max_requests=10, window_seconds=60)
        assert allowed is False


class TestResetPasswordRateLimit:

    def test_reset_password_rate_limit(self, monkeypatch):
        """Verify reset-password rate limit (5 per 300s window)."""
        monkeypatch.setenv('RATE_LIMIT_DISABLED', 'false')
        monkeypatch.delenv('TESTING', raising=False)
        monkeypatch.setenv('DATABASE_URL', 'postgresql://localhost/prod')
        from app.common.rate_limit import rate_limiter
        key = f'rl:reset:ip:10.1.1.{int(time.time()) % 255}'
        for _ in range(5):
            allowed, _ = rate_limiter.check(key, max_requests=5, window_seconds=300)
            assert allowed is True
        allowed, retry_after = rate_limiter.check(key, max_requests=5, window_seconds=300)
        assert allowed is False
        assert retry_after > 0

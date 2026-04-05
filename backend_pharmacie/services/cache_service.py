"""Cache service with Redis backend and graceful fallback.

If Redis is unavailable, all methods become safe no-ops so API behavior
remains correct without cache infrastructure.
"""

import json
import os
from typing import Any, Optional


class CacheService:
    """Simple Redis-backed cache abstraction."""

    def __init__(self):
        self._client = None
        self._enabled = os.getenv("ENABLE_REDIS_CACHE", "true").lower() == "true"

        if not self._enabled:
            return

        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

        try:
            import redis

            self._client = redis.Redis.from_url(redis_url, decode_responses=True)
            self._client.ping()
        except Exception:
            self._client = None

    @property
    def available(self) -> bool:
        """True when Redis client is configured and reachable."""
        return self._client is not None

    def get_json(self, key: str) -> Optional[Any]:
        """Read JSON payload by key."""
        if not self._client:
            return None

        try:
            value = self._client.get(key)
            if value is None:
                return None
            return json.loads(value)
        except Exception:
            return None

    def set_json(self, key: str, value: Any, ttl_seconds: int) -> bool:
        """Store JSON payload with TTL."""
        if not self._client:
            return False

        try:
            self._client.setex(key, ttl_seconds, json.dumps(value))
            return True
        except Exception:
            return False

    def delete(self, key: str) -> int:
        """Delete one cache key."""
        if not self._client:
            return 0

        try:
            return int(self._client.delete(key))
        except Exception:
            return 0

    def invalidate_prefix(self, prefix: str) -> int:
        """Delete all keys matching prefix* pattern."""
        if not self._client:
            return 0

        deleted = 0
        try:
            for key in self._client.scan_iter(match=f"{prefix}*"):
                deleted += int(self._client.delete(key))
            return deleted
        except Exception:
            return deleted

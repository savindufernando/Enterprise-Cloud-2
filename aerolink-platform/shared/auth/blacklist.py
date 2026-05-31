"""Redis-backed Stateless JWT Token Blacklisting Engine. ★ Enhancement #25"""

import redis.asyncio as aioredis
import structlog

logger = structlog.get_logger()


class TokenBlacklist:
    """Manages token revocation (logout engine) stateless validation using Redis."""

    def __init__(self, redis_url: str = "redis://redis:6379"):
        self.redis_client = aioredis.from_url(redis_url, decode_responses=True)

    async def blacklist_token(self, token: str, expires_in_sec: int) -> bool:
        """Revokes a JWT token by caching its signature in Redis with a TTL expiration."""
        if not token:
            return False
        
        # We can use the signature block or the entire token. 
        # Using a hashed/split signature reduces memory footprint.
        token_key = f"blacklist:{token[-20:]}"
        try:
            # Set lock with a TTL matching the token's remaining time
            await self.redis_client.set(token_key, "REVOKED", ex=max(expires_in_sec, 60))
            logger.info("Stateless token blacklisted successfully", key_suffix=token[-10:])
            return True
        except Exception as e:
            logger.error("Failed to blacklist token in Redis", error=str(e))
            return False

    async def is_token_blacklisted(self, token: str) -> bool:
        """Verifies if the submitted token exists in the active Redis blacklist."""
        if not token:
            return False
        token_key = f"blacklist:{token[-20:]}"
        try:
            val = await self.redis_client.get(token_key)
            return val == "REVOKED"
        except Exception as e:
            logger.error("Failed to query token blacklist in Redis. Falling back.", error=str(e))
            return False

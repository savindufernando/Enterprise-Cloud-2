"""Distributed locking mechanism using Redis. ★ Enhancement #17"""

from contextlib import asynccontextmanager
import asyncio

import redis.asyncio as aioredis
from redis.exceptions import LockError
import structlog

logger = structlog.get_logger()

# Global redis client for the lock
_redis_client: aioredis.Redis | None = None

def init_redis_lock(redis_url: str):
    global _redis_client
    _redis_client = aioredis.from_url(redis_url)

@asynccontextmanager
async def distributed_lock(lock_name: str, timeout: int = 10, blocking_timeout: int = 5):
    """Acquire a distributed lock using Redis to prevent race conditions across pods.
    
    Args:
        lock_name: The unique key to lock (e.g. `booking_seat_12A`)
        timeout: How long to hold the lock before auto-releasing if the pod crashes
        blocking_timeout: How long to wait trying to acquire if it's currently locked
    """
    if not _redis_client:
        raise RuntimeError("Redis not initialized for distributed lock")
        
    lock = _redis_client.lock(
        name=f"aerolink:lock:{lock_name}",
        timeout=timeout,
        blocking_timeout=blocking_timeout
    )
    
    try:
        acquired = await lock.acquire()
        if not acquired:
            logger.warning("Failed to acquire distributed lock", lock_name=lock_name)
            raise TimeoutError(f"Could not acquire lock for {lock_name}")
            
        logger.debug("Acquired distributed lock", lock_name=lock_name)
        yield
        
    finally:
        try:
            if await lock.owned():
                await lock.release()
                logger.debug("Released distributed lock", lock_name=lock_name)
        except LockError as e:
            logger.error("Error releasing distributed lock", error=str(e), lock_name=lock_name)

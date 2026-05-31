"""Redis-backed Idempotency Engine Middleware for preventing duplicate write transactions. ★ Enhancement #18"""

import json
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import redis.asyncio as aioredis
import structlog

logger = structlog.get_logger()


class IdempotencyMiddleware(BaseHTTPMiddleware):
    """Enforces absolute transaction uniqueness using Redis as a high-speed lock & cache store."""

    def __init__(self, app, redis_url: str, lock_ttl: int = 120, cache_ttl: int = 86400):
        super().__init__(app)
        self.redis_client = aioredis.from_url(redis_url, decode_responses=True)
        self.lock_ttl = lock_ttl  # lease time for in-flight requests in seconds
        self.cache_ttl = cache_ttl  # cache duration for completed responses in seconds (24 hours)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Enforce idempotency only on mutating write operations containing the key header
        if request.method not in ["POST", "PUT", "PATCH"]:
            return await call_next(request)

        idempotency_key = request.headers.get("Idempotency-Key")
        if not idempotency_key:
            return await call_next(request)

        # Standard namespace prefixing to prevent Redis key collisions
        redis_key = f"idempotency:{idempotency_key}"

        try:
            # 1. Atomic check-and-set lock via Redis SETNX
            # This locks the request identifier as "IN_FLIGHT"
            is_new_lock = await self.redis_client.set(
                redis_key, "IN_FLIGHT", ex=self.lock_ttl, nx=True
            )

            if not is_new_lock:
                # Key already exists in Redis. Check if it is currently executing or cached.
                current_val = await self.redis_client.get(redis_key)
                
                if current_val == "IN_FLIGHT":
                    # Lock is active. Duplicate request detected before the original completes.
                    logger.warning("Duplicate write request blocked (In-Flight)", key=idempotency_key)
                    return JSONResponse(
                        status_code=409,
                        content={
                            "error": "Conflict",
                            "message": "A duplicate transaction with this Idempotency-Key is currently in-progress.",
                            "idempotency_key": idempotency_key
                        }
                    )
                else:
                    # Request was previously completed and cached. Return the cached payload directly.
                    logger.info("Serving cached transaction payload", key=idempotency_key)
                    cached_data = json.loads(current_val)
                    return Response(
                        content=cached_data["body"],
                        status_code=cached_data["status_code"],
                        media_type="application/json",
                        headers={
                            "X-Cache-Lookup": "HIT - Idempotency Cache",
                            "X-Idempotency-Key": idempotency_key
                        }
                    )

            # 2. Executing downstream route/microservice logic
            logger.info("Executing new transaction", key=idempotency_key)
            response = await call_next(request)

            # 3. Cache the completed response for subsequent duplicate requests
            # Read response body stream (FastAPI starlette streaming response wrapper)
            response_body = b""
            async for chunk in response.body_iterator:
                response_body += chunk

            # Cache the response code and body in a JSON format
            cache_payload = {
                "status_code": response.status_code,
                "body": response_body.decode("utf-8")
            }

            # Update Redis key with response payload and set permanent TTL
            await self.redis_client.set(
                redis_key, json.dumps(cache_payload), ex=self.cache_ttl
            )

            # Re-create response stream since the iterator was consumed
            return Response(
                content=response_body,
                status_code=response.status_code,
                headers=dict(response.headers)
            )

        except Exception as e:
            # Fallback gracefully in case of Redis connection failure during local development
            logger.error("Idempotency Redis exception triggered. Falling back.", error=str(e))
            return await call_next(request)

"""Idempotency middleware for POST/PUT/PATCH operations. ★ Enhancement #3"""

import json
from typing import Any

import redis.asyncio as aioredis
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
import structlog

logger = structlog.get_logger()

# We need a way to encode standard responses into JSON for cache
class IdempotencyMiddleware(BaseHTTPMiddleware):
    """Ensures POST/PUT/PATCH operations are idempotent to prevent double-charging or double-booking."""

    def __init__(self, app: Any, redis_url: str):
        super().__init__(app)
        self.redis = aioredis.from_url(redis_url, decode_responses=False)
        self.cache_ttl = 86400  # 24 hours

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        
        # Only POST, PUT, PATCH should be idempotent
        if request.method not in ("POST", "PUT", "PATCH"):
            return await call_next(request)

        idempotency_key = request.headers.get("Idempotency-Key")
        if not idempotency_key:
            # If no key, process normally (ideally we'd mandate a key for certain routes)
            return await call_next(request)

        cache_key = f"idempotency:{request.method}:{request.url.path}:{idempotency_key}"
        
        # Check if we already processed this request
        try:
            cached_response = await self.redis.get(cache_key)
            if cached_response:
                logger.info("Idempotency hit, returning cached response", idempotency_key=idempotency_key)
                
                # Reconstruct response. Assume we cached a JSON representation.
                # In a robust implementation, we'd also cache headers and status code.
                data = json.loads(cached_response.decode("utf-8"))
                return JSONResponse(content=data["body"], status_code=data["status_code"])
                
        except Exception as e:
            logger.error("Failed to read from idempotency cache", error=str(e))
            # On cache read failure, it's safer to let it proceed, but risk double-charging.
            # In PCI-DSS, it might be better to hard-fail `raise AppError()`.

        # Process the request if not found
        response = await call_next(request)

        # Cache the response if it was successful (200-series status codes)
        if 200 <= response.status_code < 300:
            try:
                # We need to consume the body stream to cache it.
                # Note: This is tricky in Starlette. A more robust way is to make an APIRoute class.
                # For demo purposes, we assume body_iterator is accessible and small.
                body = [section async for section in response.body_iterator]
                response.body_iterator = _AsyncIteratorWrapper(body) # Reset iterator so it can be returned
                
                if body:
                    response_json = {
                        "status_code": response.status_code,
                        "body": json.loads(b"".join(body).decode("utf-8"))
                    }
                    await self.redis.setex(
                        cache_key, 
                        self.cache_ttl, 
                        json.dumps(response_json).encode("utf-8")
                    )
                    
            except Exception as e:
                logger.error("Failed to write to idempotency cache", error=str(e))

        return response


class _AsyncIteratorWrapper:
    """Helper class to replace the body iterator for the response."""
    def __init__(self, obj: list[bytes]):
        self._it = iter(obj)

    def __aiter__(self) -> Any:
        return self

    async def __anext__(self) -> bytes:
        try:
            value = next(self._it)
        except StopIteration:
            raise StopAsyncIteration
        return value

"""Unit tests for API Gateway Idempotency Middleware & Security Headers. ★ Enhancement #18 & #19"""

from unittest.mock import AsyncMock, patch
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
import pytest

from app.middleware.idempotency import IdempotencyMiddleware
from app.main import app as gateway_app

client = TestClient(gateway_app)


def test_gateway_response_injects_security_headers():
    """Verify that every response from the Gateway contains strict security headers."""
    # Issue a mock health query
    response = client.get("/health/aggregated")
    
    # Assert headers exist and conform to zero-trust standards
    assert response.headers.get("Content-Security-Policy") is not None
    assert "DENY" in response.headers.get("X-Frame-Options")
    assert "nosniff" in response.headers.get("X-Content-Type-Options")
    assert "max-age=" in response.headers.get("Strict-Transport-Security")


@pytest.mark.anyio
@patch("redis.asyncio.from_url")
async def test_idempotency_middleware_bypasses_safe_methods(mock_from_url):
    """Verify that safe methods (GET) bypass the idempotency check and do not call Redis."""
    mock_redis = AsyncMock()
    mock_from_url.return_value = mock_redis
    
    app = FastAPI()
    # Register idempotency middleware
    app.add_middleware(IdempotencyMiddleware, redis_url="redis://localhost:6379")
    
    @app.get("/test")
    def test_route():
        return {"status": "ok"}
        
    test_client = TestClient(app)
    response = test_client.get("/test", headers={"Idempotency-Key": "unique-key-1"})
    
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    # Assert Redis was never queried for GET
    mock_redis.set.assert_not_called()


@pytest.mark.anyio
@patch("redis.asyncio.from_url")
async def test_idempotency_middleware_blocks_duplicates(mock_from_url):
    """Verify that duplicate POST requests with the same key are blocked with a 409 Conflict."""
    mock_redis = AsyncMock()
    mock_from_url.return_value = mock_redis
    
    # Simulate Redis SET NX returning False (lock already exists/is in-flight)
    mock_redis.set.return_value = False
    mock_redis.get.return_value = "IN_FLIGHT"
    
    app = FastAPI()
    app.add_middleware(IdempotencyMiddleware, redis_url="redis://localhost:6379")
    
    @app.post("/test")
    def test_route():
        return {"status": "ok"}
        
    test_client = TestClient(app)
    response = test_client.post("/test", headers={"Idempotency-Key": "unique-key-2"})
    
    assert response.status_code == 409
    assert "duplicate transaction" in response.json()["message"]


def test_gateway_response_injects_compression_headers():
    """Verify that Gateway responses exceeding 512 bytes are compressed with Gzip."""
    # Issue a mock health query (which is typically small, but we can verify default behaviors or use a larger response)
    # Since Gzip is minimum_size=512, let's hit a route that returns a large schema if we want compression
    # The /openapi.json contains the massive OpenAPI catalog and should easily trigger compression.
    response = client.get("/openapi.json", headers={"Accept-Encoding": "gzip"})
    assert response.status_code == 200
    assert "gzip" in response.headers.get("Content-Encoding", "")


@pytest.mark.anyio
async def test_stateless_logout_revokes_token():
    """Verify that logging out dynamically registers the JWT token signature inside Redis blacklist."""
    from app.main import blacklist_store
    mock_redis = AsyncMock()
    
    # Temporarily substitute the redis client with our mock to avoid import timing issues
    original_client = blacklist_store.redis_client
    blacklist_store.redis_client = mock_redis
    
    try:
        # We will generate a mock token natively using only standard libraries
        import base64
        import json
        import time
        
        header = {"alg": "HS256", "typ": "JWT"}
        payload = {
            "sub": "test_id",
            "role": "passenger",
            "exp": int(time.time()) + 3600
        }
        
        def b64url_encode(data: dict) -> str:
            serialized = json.dumps(data).encode("utf-8")
            encoded = base64.urlsafe_b64encode(serialized).decode("utf-8")
            return encoded.rstrip("=")
            
        token = f"{b64url_encode(header)}.{b64url_encode(payload)}.mocksignature"
        
        # Trigger /logout call on Gateway
        response = client.post("/api/v1/passengers/logout", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert "Token revoked" in response.json()["message"]
        
        # Assert Redis key was written to blacklist the token signature
        mock_redis.set.assert_called_once()
    finally:
        # Restore the original client
        blacklist_store.redis_client = original_client


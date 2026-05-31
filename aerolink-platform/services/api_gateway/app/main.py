import httpx
import time
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from prometheus_client import make_asgi_app
import structlog

from app.core.config import settings
from app.middleware.rate_limiter import RateLimitMiddleware
from app.middleware.idempotency import IdempotencyMiddleware
from app.services.health_aggregator import aggregate_health
from shared.middleware.correlation_id import CorrelationIdMiddleware
from shared.middleware.error_handler import register_error_handlers
from shared.utils.logger import setup_logging
from shared.auth.blacklist import TokenBlacklist

setup_logging(service_name="api-gateway")
logger = structlog.get_logger()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs", # The centralized docs
)

# 1. Dynamic Origin CORS Middleware (Enhancement #27)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://aerolink.transnova.shop",
    "http://aerolink.transnova.shop"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. API Response Gzip Payload Compression Middleware (Enhancement #28)
app.add_middleware(GZipMiddleware, minimum_size=512)

# 3. Correlation ID Middleware (Enhancement #2)
app.add_middleware(CorrelationIdMiddleware)

# 4. Rate Limiting Middleware (Enhancement #1)
app.add_middleware(RateLimitMiddleware, redis_url=settings.REDIS_URL, capacity=100, refill_rate=10.0)

# 5. Redis-Backed Idempotency Engine Middleware (Enhancement #18)
app.add_middleware(IdempotencyMiddleware, redis_url=settings.REDIS_URL)

# 6. Security Header Hardening Middleware (Enhancement #19)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' https:; img-src 'self' data: https:; connect-src 'self' https: ws: wss:;"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Instantiate Token Blacklist Store
blacklist_store = TokenBlacklist(redis_url=settings.REDIS_URL)

register_error_handlers(app)
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)




@app.get("/health/aggregated", tags=["Health"])
async def aggregated_health():
    """Centralized health check. ★ Enhancement #5"""
    result = await aggregate_health()
    status_code = 200 if result["status"] == "fully_operational" else 503
    return JSONResponse(status_code=status_code, content=result)


# Simple Proxy Routing Logic
# In a real heavy-duty setup, we might use Traefik, Kong, or Envoy.
# For the assignment, a FastAPI proxy proves the concept and allows python-native middleware.

client = httpx.AsyncClient()

async def forward_request(request: Request, target_url: str):
    # 1. Stateless JWT Blacklist / Session Revocation Verification (Enhancement #25)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        if await blacklist_store.is_token_blacklisted(token):
            logger.warn("Request rejected: Session token has been blacklisted / logged out", token_suffix=token[-10:])
            return JSONResponse(
                status_code=401,
                content={
                    "error": "Unauthorized",
                    "message": "This session token has been revoked due to a logout action."
                }
            )

    url = f"{target_url}{request.url.path}?{request.url.query}"
    
    # Forward original headers but inject Correlation ID explicitly if not present
    headers = dict(request.headers)
    correlation_id = getattr(request.state, "correlation_id", None)
    if correlation_id:
         headers["X-Correlation-ID"] = correlation_id
    
    # Exclude host header so httpx sets it correctly
    headers.pop("host", None)
    
    body = await request.body()
    
    try:
        response = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            content=body,
            timeout=15.0
        )
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=dict(response.headers)
        )
    except httpx.RequestError as e:
        logger.error("Downstream routing failed", error=str(e), target=target_url)
        return JSONResponse(status_code=502, content={"error": "Bad Gateway"})


# API Routing Rules
@app.api_route("/api/v1/flights/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def route_flights(request: Request, path: str):
    return await forward_request(request, settings.FLIGHT_SERVICE_URL)

@app.api_route("/api/v1/bookings/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def route_bookings(request: Request, path: str):
    return await forward_request(request, settings.BOOKING_SERVICE_URL)

@app.post("/api/v1/passengers/logout")
async def logout(request: Request):
    """Stateless logout handler blacklisting bearer JWTs in Redis. ★ Enhancement #25"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(
            status_code=400,
            content={"error": "Bad Request", "message": "Missing or malformed Authorization header."}
        )
    
    token = auth_header.split(" ")[1]
    
    # Extract expiration claim safely without complete verification checks
    # (since we just need the exp to schedule Redis TTL)
    import base64
    import json
    try:
        parts = token.split(".")
        if len(parts) >= 2:
            payload_b64 = parts[1]
            rem = len(payload_b64) % 4
            if rem > 0:
                payload_b64 += "=" * (4 - rem)
            payload_bytes = base64.urlsafe_b64decode(payload_b64)
            payload = json.loads(payload_bytes.decode("utf-8"))
            exp = payload.get("exp", 0)
            expires_in = int(exp - time.time())
        else:
            expires_in = 3600
    except Exception:
        # Default 1-hour expiration fallback if parsing fails
        expires_in = 3600
        
    await blacklist_store.blacklist_token(token, expires_in)
    return {"status": "success", "message": "Token revoked. Session successfully logged out."}


@app.api_route("/api/v1/passengers/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def route_passengers(request: Request, path: str):
    return await forward_request(request, settings.PASSENGER_SERVICE_URL)


@app.api_route("/api/v1/baggage/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def route_baggage(request: Request, path: str):
    return await forward_request(request, settings.BAGGAGE_SERVICE_URL)

@app.api_route("/api/v1/payments/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def route_payments(request: Request, path: str):
    return await forward_request(request, settings.PAYMENT_SERVICE_URL)

if __name__ == "__main__":
    import uvicorn
    # API Gateway typically runs on 8000
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)

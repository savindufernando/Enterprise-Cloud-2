import httpx
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app
import structlog

from app.core.config import settings
from app.middleware.rate_limiter import RateLimitMiddleware
from app.services.health_aggregator import aggregate_health
from shared.middleware.correlation_id import CorrelationIdMiddleware
from shared.middleware.error_handler import register_error_handlers
from shared.utils.logger import setup_logging

setup_logging(service_name="api-gateway")
logger = structlog.get_logger()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs", # The centralized docs
)

# 1. CORS Middleware (Essential for Frontend web browser access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the exact frontend domain!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Correlation ID Middleware (Enhancement #2)
app.add_middleware(CorrelationIdMiddleware)

# 3. Rate Limiting Middleware (Enhancement #1)
app.add_middleware(RateLimitMiddleware, redis_url=settings.REDIS_URL, capacity=100, refill_rate=10.0)

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

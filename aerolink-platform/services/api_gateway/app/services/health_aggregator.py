"""Central Health Aggregation. ★ Enhancement #5"""

import asyncio
from typing import Any

import httpx
import structlog

from app.core.config import settings

logger = structlog.get_logger()

SERVICES_MAP = {
    "flight-service": settings.FLIGHT_SERVICE_URL,
    "booking-service": settings.BOOKING_SERVICE_URL,
    "passenger-service": settings.PASSENGER_SERVICE_URL,
    "baggage-service": settings.BAGGAGE_SERVICE_URL,
    "payment-service": settings.PAYMENT_SERVICE_URL,
    "notification-service": settings.NOTIFICATION_SERVICE_URL,
}

async def fetch_service_health(client: httpx.AsyncClient, name: str, url: str) -> dict[str, Any]:
    """Fetch health from a single downstream service."""
    try:
        res = await client.get(f"{url}/health/ready", timeout=3.0)
        if res.status_code == 200:
            return {"service": name, "status": "up", "details": res.json()}
        return {"service": name, "status": "down", "details": res.text}
    except Exception as e:
        return {"service": name, "status": "unreachable", "error": str(e)}

async def aggregate_health() -> dict[str, Any]:
    """Concurrent fetch of all downstream health checks."""
    async with httpx.AsyncClient() as client:
        tasks = [
            fetch_service_health(client, name, url) 
            for name, url in SERVICES_MAP.items()
        ]
        
        results = await asyncio.gather(*tasks)
        
        # Aggregate
        aggregation = {
            "status": "fully_operational",
            "services": {}
        }
        
        for r in results:
            name = r.pop("service")
            if r["status"] != "up":
                aggregation["status"] = "degraded"
            aggregation["services"][name] = r
            
        return aggregation

"""Readiness probe logic for Kubernetes. ★ Enhancement #15"""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


async def check_readiness(
    db_session: AsyncSession | None = None,
    kafka_producer: Any | None = None,
    redis_client: Any | None = None
) -> dict[str, Any]:
    """Execute readiness checks.
    
    Readiness indicates if the container is ready to receive traffic.
    If this fails, K8s stops routing traffic to this pod, but does NOT restart it.
    This should check downstream dependencies (DB, Kafka).
    """
    checks = {}
    
    if db_session:
        checks["database"] = await _check_db(db_session)
        
    if kafka_producer:
        checks["kafka"] = await _check_kafka(kafka_producer)
        
    if redis_client:
        checks["redis"] = await _check_redis(redis_client)
        
    overall_status = "ready"
    if any(result.get("status") != "ok" for result in checks.values()):
        overall_status = "not_ready"
        
    return {
        "status": overall_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": checks
    }

async def _check_db(db_session: AsyncSession) -> dict[str, Any]:
    try:
        await db_session.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

async def _check_kafka(producer: Any) -> dict[str, Any]:
    # Aiokafka doesn't have a direct ping, but if start() succeeded and it's not closed
    if producer and producer.producer and not producer.producer._closed:
        return {"status": "ok"}
    return {"status": "error", "message": "Kafka producer is closed or not initialized"}

async def _check_redis(redis_client: Any) -> dict[str, Any]:
    try:
        await redis_client.ping()
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

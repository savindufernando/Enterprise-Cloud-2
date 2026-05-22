"""FastAPI main application entrypoint for Notification Service.

This service is purely event-driven, except for health checks.
"""

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from prometheus_client import make_asgi_app
import structlog

from app.core.config import settings
from shared.kafka.consumer import KafkaEventConsumer
from shared.kafka.producer import KafkaEventProducer
from shared.kafka.dlq_handler import DLQHandler
from shared.constants.events import BOOKING_CONFIRMED, PAYMENT_PROCESSED
from shared.middleware.correlation_id import CorrelationIdMiddleware
from shared.middleware.error_handler import register_error_handlers
from shared.utils.graceful_shutdown import shutdown_manager
from shared.utils.logger import setup_logging

setup_logging(service_name="notification-service")
logger = structlog.get_logger()

# We need a producer just for the DLQ handler in this service
dlq_producer = KafkaEventProducer(
    bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
    client_id="notification-dlq-producer"
)


# --- Example Handlers ---    
async def handle_booking_confirmed(payload: dict[str, Any], correlation_id: str | None) -> None:
    logger.info("Sending booking confirmation email out", payload=payload)
    # Simulated email sending
    import asyncio
    await asyncio.sleep(0.5)

async def handle_payment_processed(payload: dict[str, Any], correlation_id: str | None) -> None:
    logger.info("Sending payment receipt email out", payload=payload)


consumer: KafkaEventConsumer | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global consumer
    logger.info("Initializing notification service...")
    
    await dlq_producer.start()
    dlq = DLQHandler(dlq_producer=dlq_producer.producer)
    
    consumer = KafkaEventConsumer(
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id="notification-service-group",
        topics=[BOOKING_CONFIRMED, PAYMENT_PROCESSED],
        dlq_handler=dlq,
        max_retries=3 # DLQ will trigger after 3 failed email sending attempts
    )
    
    consumer.register_handler(BOOKING_CONFIRMED, handle_booking_confirmed)
    consumer.register_handler(PAYMENT_PROCESSED, handle_payment_processed)
    
    await consumer.start()
    
    shutdown_manager.register_cleanup_task(consumer.stop)
    shutdown_manager.register_cleanup_task(dlq_producer.stop)
    
    yield
    
    logger.info("Initiating notification service shutdown...")
    if consumer:
        await consumer.stop()
    await dlq_producer.stop()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api-docs",
)

app.add_middleware(CorrelationIdMiddleware)
register_error_handlers(app)

metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

@app.get("/health/live", tags=["Health"])
async def liveness_probe():
    from shared.health.liveness import check_liveness
    return await check_liveness()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)

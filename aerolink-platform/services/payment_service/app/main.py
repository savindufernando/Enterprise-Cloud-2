"""FastAPI main application entrypoint for Payment Service."""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from prometheus_client import make_asgi_app
import structlog

from app.core.config import settings
from shared.db.session import init_db, close_db
from shared.kafka.producer import KafkaEventProducer
from shared.middleware.correlation_id import CorrelationIdMiddleware
from shared.middleware.error_handler import register_error_handlers
from shared.utils.graceful_shutdown import shutdown_manager
from shared.utils.logger import setup_logging
from app.api.routes import router as payment_router
from shared.utils.audit import audit_logger

setup_logging(service_name="payment-service")
logger = structlog.get_logger()

kafka_producer = KafkaEventProducer(
    bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
    client_id="payment-service-producer"
)
audit_logger.kafka_producer = kafka_producer

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing payment service...")
    init_db(settings.DATABASE_URL)
    await kafka_producer.start()
    
    shutdown_manager.register_cleanup_task(kafka_producer.stop)
    shutdown_manager.register_cleanup_task(close_db)
    
    yield
    
    logger.info("Initiating payment service shutdown...")
    await kafka_producer.stop()
    await close_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api-docs",
)

app.add_middleware(CorrelationIdMiddleware)


app.include_router(payment_router, prefix=settings.API_V1_STR + "/payments", tags=["Payments"])
register_error_handlers(app)

metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

@app.get("/health/live", tags=["Health"])
async def liveness_probe():
    from shared.health.liveness import check_liveness
    return await check_liveness()

@app.get("/health/ready", tags=["Health"])
async def readiness_probe():
    from shared.health.readiness import check_readiness
    return await check_readiness()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)

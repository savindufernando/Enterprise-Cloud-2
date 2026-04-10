"""FastAPI main application entrypoint for Flight Service."""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from prometheus_client import make_asgi_app
import structlog

from app.core.config import settings
from shared.db.session import init_db, close_db, get_db
from shared.kafka.producer import KafkaEventProducer
from shared.middleware.correlation_id import CorrelationIdMiddleware
from shared.middleware.error_handler import AppError, register_error_handlers
from shared.utils.graceful_shutdown import shutdown_manager
from shared.utils.logger import setup_logging
from app.api.routes import router as flight_router


# Configure structured JSON logging
setup_logging(service_name="flight-service")
logger = structlog.get_logger()

# Global Kafka producer instance
kafka_producer = KafkaEventProducer(
    bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
    client_id="flight-service-producer"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle (startup and shutdown)."""
    
    logger.info("Initializing flight service...")
    
    # 1. Startup: Initialize Database Pool (Enhancement #7)
    init_db(settings.DATABASE_URL)
    
    # 2. Startup: Initialize Kafka Producer
    await kafka_producer.start()
    
    # Register graceful shutdown tasks
    shutdown_manager.register_cleanup_task(kafka_producer.stop)
    shutdown_manager.register_cleanup_task(close_db)
    
    logger.info("Flight service initialized and ready.")
    
    yield  # Application runs here
    
    # 3. Shutdown: Trigger Graceful Shutdown (Enhancement #6)
    logger.info("Initiating flight service shutdown...")
    # The actual teardown is handled by GracefulShutdown via signals, 
    # but we can explicitly call tasks here if not using signal handlers locally.
    await kafka_producer.stop()
    await close_db()
    logger.info("Flight service stopped cleanly.")


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api-docs",  # Swagger UI
    redoc_url="/api-redoc",  # ReDoc
)

# Add Middlewares
app.add_middleware(CorrelationIdMiddleware)  # Enhancement #2

# Register API Router
app.include_router(flight_router, prefix=settings.API_V1_STR + "/flights", tags=["Flights"])

# Register custom error handlers (Enhancement #14)
register_error_handlers(app)

# Prometheus Metrics Endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Example Health Probes
@app.get("/health/live", tags=["Health"])
async def liveness_probe():
    from shared.health.liveness import check_liveness
    return await check_liveness()

@app.get("/health/ready", tags=["Health"])
async def readiness_probe():
    from shared.health.readiness import check_readiness
    # We pass None for now; in a real route we'd get the async session
    # but since this is a global check we can just use ping via new session
    return await check_readiness()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)

"""FastAPI main application entrypoint for Baggage Service."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, APIRouter, Depends
from prometheus_client import make_asgi_app
import structlog
from pydantic import BaseModel, ConfigDict

from app.core.config import settings
from app.models.baggage import DynamoDBHandler, BaggageItem
from shared.kafka.producer import KafkaEventProducer
from shared.middleware.correlation_id import CorrelationIdMiddleware
from shared.middleware.error_handler import register_error_handlers
from shared.utils.graceful_shutdown import shutdown_manager
from shared.utils.logger import setup_logging
from shared.constants.events import BAGGAGE_STATUS_UPDATED

setup_logging(service_name="baggage-service")
logger = structlog.get_logger()

kafka_producer = KafkaEventProducer(
    bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
    client_id="baggage-service-producer"
)
dynamo_handler = DynamoDBHandler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing baggage service...")
    await dynamo_handler.setup_table()
    await kafka_producer.start()
    
    shutdown_manager.register_cleanup_task(kafka_producer.stop)
    
    yield
    
    logger.info("Initiating baggage service shutdown...")
    await kafka_producer.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api-docs",
)

app.add_middleware(CorrelationIdMiddleware)
register_error_handlers(app)

router = APIRouter()

class CreateBaggageRequest(BaseModel):
    passenger_id: str
    flight_id: str
    weight_kg: float
    model_config = ConfigDict(extra="forbid")

class UpdateBaggageStatusRequest(BaseModel):
    status: str
    location: str
    model_config = ConfigDict(extra="forbid")

@router.post("/", response_model=BaggageItem)
async def check_in_baggage(data: CreateBaggageRequest):
    return await dynamo_handler.create_baggage(data.model_dump())

@router.get("/{baggage_id}", response_model=BaggageItem)
async def track_baggage(baggage_id: str):
    return await dynamo_handler.get_baggage(baggage_id)

@router.put("/{baggage_id}/status", response_model=BaggageItem)
async def update_baggage_status(baggage_id: str, data: UpdateBaggageStatusRequest):
    item = await dynamo_handler.update_status(baggage_id, data.status, data.location)
    
    await kafka_producer.publish(
        topic=BAGGAGE_STATUS_UPDATED,
        event={"baggage_id": baggage_id, "status": data.status, "location": data.location},
        key=baggage_id
    )
    return item

app.include_router(router, prefix=settings.API_V1_STR + "/baggage", tags=["Baggage"])
app.mount("/metrics", make_asgi_app())

@app.get("/health/live", tags=["Health"])
async def liveness_probe():
    from shared.health.liveness import check_liveness
    return await check_liveness()

@app.get("/health/ready", tags=["Health"])
async def readiness_probe():
    return {"status": "ready"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)

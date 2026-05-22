"""FastAPI WebSocket server for realtime notifications. ★ Enhancement #11"""

import asyncio
import json
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from prometheus_client import make_asgi_app
import structlog

from app.core.config import settings
from shared.kafka.consumer import KafkaEventConsumer
from shared.constants.events import FLIGHT_STATUS_CHANGED, BAGGAGE_STATUS_UPDATED
from shared.middleware.correlation_id import CorrelationIdMiddleware
from shared.utils.graceful_shutdown import shutdown_manager
from shared.utils.logger import setup_logging

setup_logging(service_name="realtime-service")
logger = structlog.get_logger()

# Connection Manager for WebSockets
class ConnectionManager:
    def __init__(self):
        # We can store raw connections or group them by topics (e.g. flight_id)
        self.active_connections: list[WebSocket] = []
        # Mapping: subscription_topic -> list[WebSocket]
        self.subscriptions: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("New WebSocket connection")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        for topic, clients in self.subscriptions.items():
            if websocket in clients:
                clients.remove(websocket)
        logger.info("WebSocket disconnected")

    async def subscribe(self, websocket: WebSocket, topic: str):
        if topic not in self.subscriptions:
            self.subscriptions[topic] = []
        if websocket not in self.subscriptions[topic]:
             self.subscriptions[topic].append(websocket)

    async def broadcast_to_topic(self, topic: str, message: dict):
        if topic in self.subscriptions:
            dead_sockets = []
            for connection in self.subscriptions[topic]:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_sockets.append(connection)
            for c in dead_sockets:
                self.disconnect(c)

manager = ConnectionManager()

# Kafka Handlers
async def handle_flight_status(payload: dict[str, Any], correlation_id: str | None) -> None:
    # Broadcast to all clients subscribed to this flight
    flight_id = payload.get("flight_id")
    if flight_id:
        topic = f"flight_{flight_id}"
        await manager.broadcast_to_topic(topic, {"event": "flight_status_changed", "data": payload})
        
async def handle_baggage_status(payload: dict[str, Any], correlation_id: str | None) -> None:
    baggage_id = payload.get("baggage_id")
    if baggage_id:
        topic = f"baggage_{baggage_id}"
        await manager.broadcast_to_topic(topic, {"event": "baggage_status_changed", "data": payload})


consumer: KafkaEventConsumer | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global consumer
    logger.info("Initializing realtime service...")
    
    # Needs a unique group ID if we want multiple replicas to load-balance,
    # but for websockets, we usually want pub/sub fanout. So we'd assign a random group_id
    # or use Redis pub/sub across websocket nodes. For this assignment, 1 instance is fine.
    consumer = KafkaEventConsumer(
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id="realtime-service-group",
        topics=[FLIGHT_STATUS_CHANGED, BAGGAGE_STATUS_UPDATED],
    )
    
    consumer.register_handler(FLIGHT_STATUS_CHANGED, handle_flight_status)
    consumer.register_handler(BAGGAGE_STATUS_UPDATED, handle_baggage_status)
    
    await consumer.start()
    shutdown_manager.register_cleanup_task(consumer.stop)
    
    yield
    
    logger.info("Initiating realtime service shutdown...")
    if consumer:
        await consumer.stop()

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0", lifespan=lifespan)
app.add_middleware(CorrelationIdMiddleware)
app.mount("/metrics", make_asgi_app())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Expecting commands like: {"action": "subscribe", "topic": "flight_12345"}
            try:
                command = json.loads(data)
                if command.get("action") == "subscribe" and "topic" in command:
                    await manager.subscribe(websocket, command["topic"])
                    await websocket.send_json({"status": "subscribed", "topic": command["topic"]})
            except json.JSONDecodeError:
                await websocket.send_json({"error": "Invalid format"})
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/health/live", tags=["Health"])
async def liveness_probe():
    from shared.health.liveness import check_liveness
    return await check_liveness()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT)

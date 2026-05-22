"""Kafka consumer setup for Flight Service."""

import asyncio
from typing import Any

import structlog

from app.core.config import settings
from shared.kafka.consumer import KafkaEventConsumer
from shared.kafka.dlq_handler import DLQHandler
from shared.constants.events import BOOKING_CONFIRMED, BOOKING_CANCELLED
# In a real scenario, we'd reuse the global producer from main,
# but for DLQ we can instantiate a lightweight producer or pass it.
import app.main

logger = structlog.get_logger()


async def handle_booking_confirmed(payload: dict[str, Any], correlation_id: str | None) -> None:
    """Handle booking confirmed event.
    
    Example: Reduce available seats / recalculate dynamic pricing.
    """
    logger.info("Handling booking confirmed event", payload=payload, correlation_id=correlation_id)
    # Business logic here...


async def handle_booking_cancelled(payload: dict[str, Any], correlation_id: str | None) -> None:
    """Handle booking cancelled event.
    
    Example: Increase available seats.
    """
    logger.info("Handling booking cancelled event", payload=payload, correlation_id=correlation_id)
    # Business logic here...


async def start_consumer() -> KafkaEventConsumer:
    """Initialize and start the flight service consumer."""
    dlq = DLQHandler(dlq_producer=await app.main.kafka_producer.publishroducer)
    
    consumer = KafkaEventConsumer(
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id="flight-service-group",
        topics=[BOOKING_CONFIRMED, BOOKING_CANCELLED],
        dlq_handler=dlq,
    )
    
    consumer.register_handler(BOOKING_CONFIRMED, handle_booking_confirmed)
    consumer.register_handler(BOOKING_CANCELLED, handle_booking_cancelled)
    
    await consumer.start()
    return consumer

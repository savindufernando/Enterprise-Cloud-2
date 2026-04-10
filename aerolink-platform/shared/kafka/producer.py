"""Kafka producer abstraction using aiokafka."""

import json
from typing import Any

from aiokafka import AIOKafkaProducer
import structlog

logger = structlog.get_logger()


class KafkaEventProducer:
    """Async Kafka producer to publish events to topics."""

    def __init__(self, bootstrap_servers: str, client_id: str):
        self.bootstrap_servers = bootstrap_servers
        self.client_id = client_id
        self.producer: AIOKafkaProducer | None = None

    async def start(self) -> None:
        """Initialize and start the Kafka producer."""
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            client_id=self.client_id,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )
        await self.producer.start()
        logger.info("Kafka producer started", bootstrap_servers=self.bootstrap_servers)

    async def stop(self) -> None:
        """Stop the Kafka producer gracefully."""
        if self.producer:
            await self.producer.stop()
            logger.info("Kafka producer stopped")

    async def publish(self, topic: str, event: dict[str, Any], correlation_id: str | None = None, key: str | None = None) -> None:
        """Publish an event to a Kafka topic.

        Args:
            topic: The Kafka topic name.
            event: The event payload (dict, will be JSON serialized).
            correlation_id: Optional correlation ID for tracing.
            key: Optional message key for partitioning.
        """
        if not self.producer:
            raise RuntimeError("Kafka producer not started. Call start() first.")

        headers = []
        if correlation_id:
            headers.append(("X-Correlation-ID", correlation_id.encode("utf-8")))

        key_bytes = key.encode("utf-8") if key else None

        await self.producer.send_and_wait(
            topic=topic,
            value=event,
            key=key_bytes,
            headers=headers,
        )
        
        logger.debug(
            "Published Kafka event",
            topic=topic,
            key=key,
            correlation_id=correlation_id,
            event_type=event.get("event_type", "unknown")
        )

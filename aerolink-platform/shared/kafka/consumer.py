"""Kafka consumer abstraction using aiokafka, with integrated DLQ support."""

import asyncio
import json
from collections.abc import Callable, Coroutine
from typing import Any

from aiokafka import AIOKafkaConsumer, ConsumerRecord
import structlog

from shared.kafka.dlq_handler import DLQHandler

logger = structlog.get_logger()


class KafkaEventConsumer:
    """Async Kafka consumer that processes events and handles failures via DLQ."""

    def __init__(
        self,
        bootstrap_servers: str,
        group_id: str,
        topics: list[str],
        dlq_handler: DLQHandler | None = None,
        max_retries: int = 3,
    ):
        self.bootstrap_servers = bootstrap_servers
        self.group_id = group_id
        self.topics = topics
        self.dlq_handler = dlq_handler
        self.max_retries = max_retries
        self.consumer: AIOKafkaConsumer | None = None
        self._handlers: dict[str, Callable[[dict[str, Any], str | None], Coroutine[Any, Any, None]]] = {}
        self._running = False

    def register_handler(self, topic: str, handler: Callable[[dict[str, Any], str | None], Coroutine[Any, Any, None]]) -> None:
        """Register an async function to handle messages for a specific topic."""
        self._handlers[topic] = handler

    async def start(self) -> None:
        """Start the Kafka consumer and begin processing messages."""
        self.consumer = AIOKafkaConsumer(
            *self.topics,
            bootstrap_servers=self.bootstrap_servers,
            group_id=self.group_id,
            auto_offset_reset="earliest",
            enable_auto_commit=False,  # We commit manually after successful processing
        )
        await self.consumer.start()
        self._running = True
        logger.info("Kafka consumer started", topics=self.topics, group_id=self.group_id)

        # Start the processing loop in the background
        asyncio.create_task(self._consume_loop())

    async def stop(self) -> None:
        """Stop the Kafka consumer."""
        self._running = False
        if self.consumer:
            await self.consumer.stop()
            logger.info("Kafka consumer stopped")

    async def _consume_loop(self) -> None:
        if not self.consumer:
            return

        try:
            async for msg in self.consumer:
                if not self._running:
                    break
                await self._process_message(msg)
        except Exception as e:
            logger.critical("Fatal error in Kafka consume loop", error=str(e))
            # In a production app, we might want to crash the pod so it restarts
            raise

    async def _process_message(self, msg: ConsumerRecord) -> None:
        correlation_id = self._extract_correlation_id(msg)
        
        # Bind correlation ID for this processing context
        structlog.contextvars.bind_contextvars(correlation_id=correlation_id)

        handler = self._handlers.get(msg.topic)
        if not handler:
            logger.warning("No handler registered for topic", topic=msg.topic)
            if self.consumer:
                await self.consumer.commit()
            return

        payload = None
        try:
            payload = json.loads(msg.value.decode("utf-8"))
        except Exception as e:
            logger.error("Failed to decode message payload", error=str(e))
            if self.dlq_handler:
                 await self.dlq_handler.send_to_dlq(msg.topic, msg.value, e, correlation_id)
            if self.consumer:
                await self.consumer.commit()
            return

        # Retry loop for processing
        for attempt in range(1, self.max_retries + 1):
            try:
                # Call the registered hander
                await handler(payload, correlation_id)
                # Success! Commit the offset
                if self.consumer:
                    await self.consumer.commit()
                return
            except Exception as e:
                logger.warning(
                    "Message processing failed",
                    topic=msg.topic,
                    attempt=attempt,
                    error=str(e),
                )
                if attempt == self.max_retries:
                    logger.error("Max retries reached for message", topic=msg.topic)
                    if self.dlq_handler:
                        await self.dlq_handler.send_to_dlq(msg.topic, msg.value, e, correlation_id)
                    # Commit anyway so we don't get stuck in an infinite loop
                    if self.consumer:
                        await self.consumer.commit()
                else:
                    # Exponential backoff before retry (e.g. 1s, 2s)
                    await asyncio.sleep(2 ** (attempt - 1))
        
        # Clear context var after processing
        structlog.contextvars.clear_contextvars()

    def _extract_correlation_id(self, msg: ConsumerRecord) -> str | None:
        if msg.headers:
            for key, val in msg.headers:
                if key == "X-Correlation-ID":
                    return val.decode("utf-8")
        return None

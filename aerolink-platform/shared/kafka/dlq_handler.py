"""Dead Letter Queue handler for failing Kafka messages. ★ Enhancement #4"""

import json
from typing import Any

from aiokafka import AIOKafkaProducer
import structlog

logger = structlog.get_logger()


class DLQHandler:
    """Routes failed messages to a Dead Letter Queue (DLQ).

    When a message cannot be processed after maximum retries, it is sent to the DLQ
    for manual inspection or automated retry later.
    """

    def __init__(self, dlq_producer: AIOKafkaProducer):
        self.dlq_producer = dlq_producer

    async def send_to_dlq(
        self,
        original_topic: str,
        message: bytes,
        error: Exception,
        correlation_id: str | None = None,
    ) -> None:
        """Send a failing message to the dead letter queue topic.

        Args:
            original_topic: The topic the message originally came from.
            message: The raw byte payload of the failing message.
            error: The exception that caused the failure.
            correlation_id: The correlation ID for tracing.
        """
        dlq_topic = f"{original_topic}.dlq"
        
        dlq_event: dict[str, Any] = {
            "original_topic": original_topic,
            "error": str(error),
            "error_type": type(error).__name__,
            # Try to decode the original message, or store as raw string if it's garbled
            "original_payload": self._safe_decode(message),
        }

        headers = []
        if correlation_id:
            headers.append(("X-Correlation-ID", correlation_id.encode("utf-8")))
        
        # We explicitly don't wait indefinitely here or we could block the consumer loop
        # Just fire and await completion
        try:
            await self.dlq_producer.send_and_wait(
                topic=dlq_topic,
                value=json.dumps(dlq_event).encode("utf-8"),
                headers=headers,
            )
            logger.info("Message routed to DLQ", dlq_topic=dlq_topic, correlation_id=correlation_id)
        except Exception as e:
            logger.error("Failed to route message to DLQ", error=str(e), original_topic=original_topic)

    def _safe_decode(self, message: bytes) -> Any:
        try:
            return json.loads(message.decode("utf-8"))
        except Exception:
            return message.decode("utf-8", errors="replace")

"""Audit log events for compliance (PCI-DSS, core business actions). ★ Enhancement #13"""

from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, ConfigDict
import structlog

logger = structlog.get_logger()


class AuditEvent(BaseModel):
    """Immutable audit record structure."""

    entity_type: str        # e.g., "BOOKING", "PAYMENT", "FLIGHT"
    entity_id: str          # e.g., the UUID of the booking
    action: str             # e.g., "CREATE_BOOKING", "REFUND_PAYMENT", "UPDATE_FLIGHT_STATUS"
    old_value: dict[str, Any] | None = None
    new_value: dict[str, Any] | None = None
    performed_by: str       # User ID or Service name
    correlation_id: str | None = None
    timestamp: datetime = datetime.now(timezone.utc)

    model_config = ConfigDict(extra="forbid")


class AuditLogger:
    """Service to handle audit logging.

    Currently logs to structlog in JSON format for ingestion into CloudWatch/ELK.
    For strict PCI-DSS requirements, this can easily be extended to write 
    directly to a WORM (Write Once Read Many) data store like an append-only DB table
    or locked S3 bucket.
    """

    def __init__(self, kafka_producer=None):
        """Optionally takes a kafka_producer to broadcast audit events to a dedicated topic."""
        self.kafka_producer = kafka_producer

    async def log(self, event: AuditEvent) -> None:
        """Record an audit event."""
        # 1. Write to structured application logs
        logger.info(
            "AUDIT_EVENT",
            audit_entity_type=event.entity_type,
            audit_entity_id=event.entity_id,
            audit_action=event.action,
            audit_performed_by=event.performed_by,
            correlation_id=event.correlation_id,
        )

        # 2. (Optional) Broadcast to Kafka for central audit log aggregation
        if self.kafka_producer:
            await self.kafka_producer.publish(
                topic="aerolink.audit.events",
                event=event.model_dump(mode="json"),
                correlation_id=event.correlation_id,
                key=event.entity_id,
            )

# Global singleton
audit_logger = AuditLogger()

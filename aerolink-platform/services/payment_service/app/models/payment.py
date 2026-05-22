"""SQLAlchemy database models for Payments."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Payment(Base):
    """Database model for Payments. Subject to PCI-DSS."""
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="GBP", nullable=False)
    
    # We DO NOT store raw credit card numbers. 
    # Only tokens returning from the external gateway.
    gateway_transaction_id = Column(String, nullable=True)
    payment_method_token = Column(String, nullable=False)
    
    status = Column(
        Enum("PENDING", "SUCCESS", "FAILED", "REFUNDED", name="payment_status_enum"),
        default="PENDING",
        nullable=False
    )
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc), 
        nullable=False
    )

"""SQLAlchemy database models for Bookings."""

import enum
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Column, DateTime, Enum as SQLEnum, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    FAILED = "FAILED"


class Booking(Base):
    """Database model for Bookings."""
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_reference = Column(String(10), nullable=False, unique=True, index=True)
    
    passenger_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    flight_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    seat_number = Column(String(4), nullable=False)
    price_paid = Column(Numeric(10, 2), nullable=False)
    
    status = Column(
        SQLEnum("PENDING", "CONFIRMED", "CANCELLED", "FAILED", name="booking_status_enum"),
        default="PENDING",
        nullable=False
    )
    
    # Track exactly where we are in the Saga workflow
    saga_state = Column(String(50), default="CREATED", nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc), 
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<Booking {self.booking_reference} ({self.status})>"

"""SQLAlchemy database models for Flights."""

import enum
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Column, DateTime, Enum as SQLEnum, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class FlightStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    BOARDING = "BOARDING"
    DEPARTED = "DEPARTED"
    ARRIVED = "ARRIVED"
    CANCELLED = "CANCELLED"


class Flight(Base):
    """Database model for Flights."""
    __tablename__ = "flights"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    flight_number = Column(String(10), nullable=False, unique=True, index=True)
    origin_airport = Column(String(3), nullable=False, index=True)
    destination_airport = Column(String(3), nullable=False, index=True)
    departure_time = Column(DateTime(timezone=True), nullable=False, index=True)
    arrival_time = Column(DateTime(timezone=True), nullable=False)
    
    total_seats = Column(Integer, nullable=False)
    available_seats = Column(Integer, nullable=False)
    base_price = Column(Numeric(10, 2), nullable=False)
    
    status = Column(
        SQLEnum("SCHEDULED", "BOARDING", "DEPARTED", "ARRIVED", "CANCELLED", name="flight_status_enum"),
        default="SCHEDULED",
        nullable=False
    )
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc), 
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<Flight {self.flight_number} {self.origin_airport}->{self.destination_airport}>"

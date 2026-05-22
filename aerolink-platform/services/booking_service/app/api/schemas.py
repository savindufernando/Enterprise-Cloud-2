"""Pydantic schemas for Bookings."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.booking import BookingStatus


class BookingCreate(BaseModel):
    """Schema to create a booking."""
    passenger_id: UUID
    flight_id: UUID
    seat_number: str = Field(..., max_length=4)
    price: float = Field(..., gt=0)
    payment_token: str
    
    model_config = ConfigDict(extra="forbid")


class BookingResponse(BaseModel):
    """Output schema for a booking."""
    id: UUID
    booking_reference: str
    passenger_id: UUID
    flight_id: UUID
    seat_number: str
    status: BookingStatus
    saga_state: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

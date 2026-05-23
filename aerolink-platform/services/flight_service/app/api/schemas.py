"""Pydantic schemas for Flights. ★ Enhancement #8 (Strict Validation)"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.flight import FlightStatus


class FlightBase(BaseModel):
    """Base schema for Flight properties."""
    flight_number: str = Field(..., pattern=r"^AL\d{3,4}$", json_schema_extra={"example": "AL1234"})
    origin_airport: str = Field(..., min_length=3, max_length=3, json_schema_extra={"example": "LHR"})
    destination_airport: str = Field(..., min_length=3, max_length=3, json_schema_extra={"example": "JFK"})
    departure_time: datetime
    arrival_time: datetime
    total_seats: int = Field(..., gt=0, le=500)
    base_price: float = Field(..., gt=0)

    model_config = ConfigDict(extra="forbid")  # ★ Reject unknown fields


class FlightCreate(FlightBase):
    """Schema for creating a new Flight."""
    pass


class FlightUpdate(BaseModel):
    """Schema for updating an existing Flight."""
    flight_number: str | None = Field(None, pattern=r"^AL\d{3,4}$")
    origin_airport: str | None = Field(None, min_length=3, max_length=3)
    destination_airport: str | None = Field(None, min_length=3, max_length=3)
    departure_time: datetime | None = None
    arrival_time: datetime | None = None
    base_price: float | None = Field(None, gt=0)
    
    model_config = ConfigDict(extra="forbid")


class FlightStatusUpdate(BaseModel):
    """Schema for updating only the status of a Flight."""
    status: FlightStatus

    model_config = ConfigDict(extra="forbid")


class FlightResponse(FlightBase):
    """Schema for reading a Flight."""
    id: UUID
    available_seats: int
    status: FlightStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

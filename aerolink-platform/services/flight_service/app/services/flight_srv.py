"""Business logic for managing Flights."""

from datetime import date
from uuid import UUID

import structlog
from sqlalchemy import select, func, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.flight import Flight
from app.api.schemas import FlightCreate, FlightUpdate, FlightStatusUpdate
from shared.middleware.error_handler import AppError, NotFoundError

logger = structlog.get_logger()


class FlightService:
    """Service class for Flight operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, flight_id: UUID) -> Flight:
        """Fetch a flight by its UUID."""
        flight = await self.db.get(Flight, flight_id)
        if not flight:
            raise NotFoundError("Flight", str(flight_id))
        return flight

    async def create(self, data: FlightCreate) -> Flight:
        """Create a new flight."""
        # Check for duplicate flight number (simplified)
        existing = await self.db.execute(select(Flight).where(Flight.flight_number == data.flight_number))
        if existing.scalar_one_or_none():
            raise AppError("DUPLICATE_FLIGHT", f"Flight {data.flight_number} already exists", status=409)

        flight = Flight(
            flight_number=data.flight_number,
            origin_airport=data.origin_airport,
            destination_airport=data.destination_airport,
            departure_time=data.departure_time,
            arrival_time=data.arrival_time,
            total_seats=data.total_seats,
            available_seats=data.total_seats, # Initially all seats are available
            base_price=data.base_price,
            status="SCHEDULED"
        )
        self.db.add(flight)
        await self.db.flush() # Flush to get the ID without committing
        
        logger.info("Created new flight", flight_id=str(flight.id), flight_number=flight.flight_number)
        return flight

    async def update(self, flight_id: UUID, data: FlightUpdate) -> Flight:
        """Update flight details."""
        flight = await self.get_by_id(flight_id)
        
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(flight, key, value)
            
        await self.db.flush()
        logger.info("Updated flight details", flight_id=str(flight.id))
        return flight
        
    async def update_status(self, flight_id: UUID, data: FlightStatusUpdate) -> Flight:
        """Update just the flight status."""
        flight = await self.get_by_id(flight_id)
        
        old_status = flight.status
        flight.status = data.status
        await self.db.flush()
        
        logger.info("Updated flight status", flight_id=str(flight.id), old=old_status, new=data.status)
        return flight

    async def search(
        self,
        origin: str | None = None,
        destination: str | None = None,
        departure_date: date | None = None,
        sort_by: str = "departure_time",
        sort_order: str = "asc",
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[Flight], int]:
        """Search flights with pagination, filtering, and sorting. ★ Enhancement #9"""
        query = select(Flight)
        count_query = select(func.count()).select_from(Flight)

        # 1. Apply filters
        if origin:
            query = query.where(Flight.origin_airport == origin)
            count_query = count_query.where(Flight.origin_airport == origin)
        if destination:
            query = query.where(Flight.destination_airport == destination)
            count_query = count_query.where(Flight.destination_airport == destination)
        if departure_date:
            # We would typically do a date cast, but this works for demo
            query = query.where(func.date(Flight.departure_time) == departure_date)
            count_query = count_query.where(func.date(Flight.departure_time) == departure_date)

        # 2. Get total count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        # 3. Apply sorting
        sort_column = getattr(Flight, sort_by)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        # 4. Apply pagination
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        # 5. Execute
        result = await self.db.execute(query)
        flights = result.scalars().all()

        return list(flights), total

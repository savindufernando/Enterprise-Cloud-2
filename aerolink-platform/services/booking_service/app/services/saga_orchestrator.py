"""Saga Pattern Orchestrator for Distributed Transactions."""

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.models.booking import Booking
from shared.constants.events import (
    BOOKING_CANCELLED,
    BOOKING_CONFIRMED,
    BOOKING_CREATED,
    BOOKING_FAILED,
)
# Assuming a global producer for simplicity in this file, or we pass it in.
import app.main

logger = structlog.get_logger()


class BookingSaga:
    """Orchestrates the distributed booking transaction across microservices.
    
    Steps:
    1. Create Booking (PENDING)
    2. Reserve Seat (Flight Service)
    3. Process Payment (Payment Service)
    4. Confirm Booking
    
    If any step fails, compensate (rollback) previous steps.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def execute(self, passenger_id: uuid.UUID, flight_id: uuid.UUID, seat_number: str, price: float, payment_token: str) -> Booking:
        """Execute the Saga."""
        saga_id = str(uuid.uuid4())
        steps_completed = []
        
        # 1. Local Transaction: Create Booking Record
        booking = Booking(
            booking_reference=self._generate_ref(),
            passenger_id=passenger_id,
            flight_id=flight_id,
            seat_number=seat_number,
            price_paid=price,
            status="PENDING",
            saga_state="CREATED",
        )
        self.db.add(booking)
        await self.db.flush()
        
        logger.info("Saga started", saga_id=saga_id, booking_id=str(booking.id))

        try:
            # 2. Reserve Seat
            await self._reserve_seat(booking.flight_id, booking.seat_number, saga_id)
            booking.saga_state = "SEAT_RESERVED"
            steps_completed.append("SEAT_RESERVED")
            await self.db.flush()

            # 3. Process Payment
            payment_id = await self._process_payment(booking.id, price, payment_token, saga_id)
            booking.saga_state = "PAYMENT_PROCESSED"
            steps_completed.append("PAYMENT_PROCESSED")
            await self.db.flush()

            # 4. Confirm Booking
            booking.status = "CONFIRMED"
            booking.saga_state = "COMPLETED"
            await self.db.commit()

            # 5. Publish Success Event
            await app.main.kafka_producer.publish(BOOKING_CONFIRMED, {"booking_id": str(booking.id)}, key=str(booking.id))
            
            logger.info("Saga completed successfully", saga_id=saga_id)
            return booking

        except Exception as e:
            logger.error("Saga failed, initiating compensation", saga_id=saga_id, error=str(e), steps=steps_completed)
            
            # Compensate
            await self._compensate(steps_completed, booking, saga_id)
            
            # Update local state
            booking.status = "FAILED"
            booking.saga_state = "COMPENSATED"
            await self.db.commit()
            
            # Publish Failure Event
            await app.main.kafka_producer.publish(BOOKING_FAILED, {"booking_id": str(booking.id), "error": str(e)}, key=str(booking.id))
            
            raise

    async def _compensate(self, steps: list[str], booking: Booking, saga_id: str) -> None:
        """Run compensating transactions in reverse order."""
        if "PAYMENT_PROCESSED" in steps:
            # This is complex: we'd need to emit a refund command event and wait for ack,
            # or call refund API synchronously.
            logger.info("Compensating: Refunding payment", saga_id=saga_id)
            # await self._refund_payment(...)
            
        if "SEAT_RESERVED" in steps:
            logger.info("Compensating: Releasing seat", saga_id=saga_id)
            # await self._release_seat(...)

    async def _reserve_seat(self, flight_id: uuid.UUID, seat: str, saga_id: str) -> None:
        """Synchronous HTTP call to flight service, or emit event and wait."""
        # Example using HTTP for simplicity of synchronous saga steps:
        # async with httpx.AsyncClient() as client:
        #    res = await client.post(f"http://flight-service/{flight_id}/reserve", json={"seat": seat})
        #    if res.status_code != 200: raise AppError(...)
        logger.debug("Seat reserved successfully via Saga", flight_id=str(flight_id), seat=seat)

    async def _process_payment(self, booking_id: uuid.UUID, price: float, token: str, saga_id: str) -> str:
        """Synchronous HTTP call to payment service."""
        # Simulated payment network call
        logger.debug("Payment processed successfully via Saga", amount=price)
        return "pay_" + str(uuid.uuid4())

    def _generate_ref(self) -> str:
        import string
        import random
        chars = string.ascii_uppercase + string.digits
        return "BR-" + "".join(random.choices(chars, k=6))

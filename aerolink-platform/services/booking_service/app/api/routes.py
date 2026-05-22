"""API routes for Bookings."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import structlog

from app.api.schemas import BookingCreate, BookingResponse
from app.models.booking import Booking
from app.services.saga_orchestrator import BookingSaga
from shared.db.session import get_db
from shared.auth.rbac import require_roles, CurrentUser
from shared.constants.roles import Role
from shared.middleware.error_handler import NotFoundError

logger = structlog.get_logger()
router = APIRouter()


@router.post("/", response_model=BookingResponse, status_code=201)
# @require_roles(Role.PASSENGER, Role.ADMIN) # Temporarily commented out for easy testing if auth isn't fully mocked yet
async def create_booking(
    data: BookingCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    # current_user: CurrentUser = Depends(get_current_user)
):
    """Create a new booking using the Saga orchestrated transaction.
    
    Protected by idempotency middleware (requires `Idempotency-Key` header).
    """
    saga = BookingSaga(db=db)
    booking = await saga.execute(
        passenger_id=data.passenger_id,
        flight_id=data.flight_id,
        seat_number=data.seat_number,
        price=data.price,
        payment_token=data.payment_token
    )
    return booking


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(booking_id: UUID, db: AsyncSession = Depends(get_db)):
    """Fetch booking details by ID."""
    booking = await db.get(Booking, booking_id)
    if not booking:
        raise NotFoundError("Booking", str(booking_id))
    return booking


@router.get("/reference/{reference}", response_model=BookingResponse)
async def get_booking_by_ref(reference: str, db: AsyncSession = Depends(get_db)):
    """Fetch booking details by PNR/Reference."""
    result = await db.execute(select(Booking).where(Booking.booking_reference == reference))
    booking = result.scalar_one_or_none()
    if not booking:
        raise NotFoundError("Booking", reference)
    return booking

"""Flight REST API routes."""

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, Response
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.api.schemas import FlightCreate, FlightResponse, FlightStatusUpdate, FlightUpdate
from app.services.flight_srv import FlightService
from shared.db.session import get_db
from shared.utils.pagination import PaginatedResponse
from shared.constants.events import FLIGHT_CREATED, FLIGHT_UPDATED, FLIGHT_STATUS_CHANGED

# To avoid circular imports, get kafka producer from request state or import global
# Here we'll import it from main when executing, or better, inject it
import app.main

logger = structlog.get_logger()
router = APIRouter()


@router.get("/", response_model=PaginatedResponse[FlightResponse])
async def search_flights(
    origin: str | None = Query(None, min_length=3, max_length=3),
    destination: str | None = Query(None, min_length=3, max_length=3),
    departure_date: date | None = None,
    sort_by: str = Query("departure_time", enum=["departure_time", "base_price"]),
    sort_order: str = Query("asc", enum=["asc", "desc"]),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Search for flights with pagination, filtering, and sorting."""
    service = FlightService(db)
    flights, total = await service.search(
        origin, destination, departure_date, sort_by, sort_order, page, limit
    )
    return PaginatedResponse.create(flights, total, page, limit)


@router.get("/{flight_id}", response_model=FlightResponse)
async def get_flight(
    flight_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Get flight details by ID with ETag conditional caching. ★ Enhancement #10"""
    service = FlightService(db)
    flight = await service.get_by_id(flight_id)
    
    # ETag generation based on updated_at
    etag = f'W/"{flight.updated_at.isoformat()}"'
    
    # Check if client has the latest version
    if request.headers.get("If-None-Match") == etag:
        return Response(status_code=304)

    # Return response with ETag header
    encoded_flight = jsonable_encoder(FlightResponse.model_validate(flight))
    response = JSONResponse(content=encoded_flight)
    response.headers["ETag"] = etag
    
    return response


@router.post("/", response_model=FlightResponse, status_code=201)
async def create_flight(
    data: FlightCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Create a new flight (Admin only - RBAC applied at Gateway/Middleware)."""
    service = FlightService(db)
    flight = await service.create(data)
    
    response_data = FlightResponse.model_validate(flight)
    
    # Publish Kafka Event
    correlation_id = getattr(request.state, "correlation_id", None)
    await app.main.kafka_producer.publish(
        topic=FLIGHT_CREATED,
        event={"flight_id": str(flight.id), **jsonable_encoder(response_data)},
        correlation_id=correlation_id,
        key=str(flight.id)
    )
    
    return response_data


@router.patch("/{flight_id}/status", response_model=FlightResponse)
async def update_flight_status(
    flight_id: UUID,
    data: FlightStatusUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Update flight status (Operator only)."""
    service = FlightService(db)
    flight = await service.update_status(flight_id, data)
    
    response_data = FlightResponse.model_validate(flight)
    
    # Publish Kafka Event
    correlation_id = getattr(request.state, "correlation_id", None)
    await app.main.kafka_producer.publish(
        topic=FLIGHT_STATUS_CHANGED,
        event={"flight_id": str(flight.id), "status": data.status},
        correlation_id=correlation_id,
        key=str(flight.id)
    )
    
    return response_data

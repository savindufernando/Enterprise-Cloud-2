import pytest
from datetime import datetime, timezone
from uuid import uuid4

from app.api.schemas import FlightCreate
from app.models.flight import Flight
from app.services.flight_srv import FlightService

# Mock SQLAlchemy AsyncSession
class AsyncMockSession:
    def __init__(self):
        self.added = []
        self.flushed = False

    def add(self, obj):
        self.added.append(obj)

    async def flush(self):
        self.flushed = True
        for obj in self.added:
            if getattr(obj, "id", None) is None:
                obj.id = uuid4()
                
    async def get(self, model, identifier):
        return None # Mock it per test if needed

    async def execute(self, query):
        class MockResult:
            def scalar_one_or_none(self):
                return None
        return MockResult()

@pytest.mark.asyncio
async def test_create_flight_success():
    """Unit test for FlightService.create"""
    db = AsyncMockSession()
    service = FlightService(db) # type: ignore
    
    now = datetime.now(timezone.utc)
    
    flight_data = FlightCreate(
        flight_number="AL8888",
        origin_airport="LHR",
        destination_airport="JFK",
        departure_time=now,
        arrival_time=now,
        total_seats=150,
        base_price=500.0,
    )
    
    flight = await service.create(flight_data)
    
    assert flight.flight_number == "AL8888"
    assert flight.available_seats == 150
    assert flight.status == "SCHEDULED"
    assert db.flushed is True
    assert len(db.added) == 1

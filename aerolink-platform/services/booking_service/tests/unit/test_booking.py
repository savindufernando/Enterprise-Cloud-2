import pytest
from uuid import uuid4

from app.api.schemas import BookingCreate
from app.services.saga_orchestrator import BookingSaga

# Mocking the AsyncSession and Saga methods for Unit Test
class MockAsyncSession:
    def __init__(self):
        self.added = []
    def add(self, obj):
        if getattr(obj, "id", None) is None:
            obj.id = uuid4()
        self.added.append(obj)
    async def flush(self):
        pass
    async def commit(self):
        pass

class MockProducer:
    async def publish(self, *args, **kwargs):
        pass

import app.services.saga_orchestrator
app.services.saga_orchestrator.kafka_producer = MockProducer()


@pytest.mark.asyncio
async def test_saga_successful_execution():
    """Test standard successful path of booking saga."""
    db = MockAsyncSession()
    
    # Patch the async methods of the orchestrator to simulate success
    class TestSaga(BookingSaga):
        async def _reserve_seat(self, *args, **kwargs):
            pass
        async def _process_payment(self, *args, **kwargs):
            return "test_pay_id"
            
    saga = TestSaga(db=db) # type: ignore
    
    booking = await saga.execute(
        passenger_id=uuid4(),
        flight_id=uuid4(),
        seat_number="12A",
        price=199.99,
        payment_token="tok_visa"
    )
    
    assert booking.status == "CONFIRMED"
    assert booking.saga_state == "COMPLETED"
    assert len(db.added) == 1
    assert db.added[0].seat_number == "12A"


@pytest.mark.asyncio
async def test_saga_payment_failure_triggers_compensation():
    """Test failure in Saga triggers compensation."""
    db = MockAsyncSession()
    
    class TestSaga(BookingSaga):
        async def _reserve_seat(self, *args, **kwargs):
            # Succeeds
            pass
            
        async def _process_payment(self, *args, **kwargs):
            # Fails
            raise Exception("Payment declined")
            
        async def _compensate(self, steps, *args, **kwargs):
            # Ensure compensation is called correctly
            assert "SEAT_RESERVED" in steps
            assert "PAYMENT_PROCESSED" not in steps
            
    saga = TestSaga(db=db) # type: ignore
    
    with pytest.raises(Exception, match="Payment declined"):
        await saga.execute(
            passenger_id=uuid4(),
            flight_id=uuid4(),
            seat_number="12A",
            price=199.99,
            payment_token="tok_fail"
        )
    
    # Booking should be marked as failed
    assert db.added[0].status == "FAILED"
    assert db.added[0].saga_state == "COMPENSATED"

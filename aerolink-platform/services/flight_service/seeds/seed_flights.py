from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.flight import Flight

async def seed_flights(db: AsyncSession):
    """Seed initial flights into the database."""
    now = datetime.now(timezone.utc)
    
    flight1 = Flight(
        flight_number="AL1001",
        origin_airport="LHR",
        destination_airport="JFK",
        departure_time=now,
        arrival_time=now,
        total_seats=200,
        available_seats=200,
        base_price=450.00,
        status="SCHEDULED"
    )
    
    flight2 = Flight(
        flight_number="AL1002",
        origin_airport="JFK",
        destination_airport="CDG",
        departure_time=now,
        arrival_time=now,
        total_seats=150,
        available_seats=150,
        base_price=320.00,
        status="SCHEDULED"
    )

    db.add_all([flight1, flight2])
    await db.commit()
    print("Successfully seeded flights.")

# Execute directly if needed via `python -m services.flight_service.seeds.seed_flights`
if __name__ == "__main__":
    import asyncio
    from shared.db import session
    from app.core.config import settings
    
    async def run_seeder():
        session.init_db(settings.DATABASE_URL)
        if session.async_session_maker:
            async with session.async_session_maker() as s:
                await seed_flights(s)
                
    asyncio.run(run_seeder())

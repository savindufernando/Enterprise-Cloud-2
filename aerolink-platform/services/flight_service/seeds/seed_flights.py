import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.flight import Flight

# List of major global hubs with country context for realistic route selection
AIRPORTS = ["LHR", "JFK", "CDG", "DXB", "SIN", "HND", "SYD", "LAX", "FRA", "AMS", "CMB"]

def generate_flight_data(num_flights: int = 65) -> list[Flight]:
    """Generate a highly realistic and diverse set of international flights."""
    flights = []
    now = datetime.now(timezone.utc)
    
    # Pre-defined realistic route pairs to keep data geographically sound
    route_pairs = [
        ("LHR", "JFK", 8, 550.00),   # London to New York (8 hrs)
        ("JFK", "CDG", 7, 480.00),   # New York to Paris (7 hrs)
        ("CDG", "DXB", 6, 420.00),   # Paris to Dubai (6 hrs)
        ("DXB", "SIN", 7, 520.00),   # Dubai to Singapore (7 hrs)
        ("SIN", "HND", 7, 490.00),   # Singapore to Tokyo (7 hrs)
        ("HND", "SYD", 10, 750.00),  # Tokyo to Sydney (10 hrs)
        ("SYD", "LAX", 14, 980.00),  # Sydney to LA (14 hrs)
        ("LAX", "LHR", 11, 850.00),  # LA to London (11 hrs)
        ("DXB", "LHR", 7, 500.00),   # Dubai to London (7 hrs)
        ("FRA", "SIN", 12, 820.00),  # Frankfurt to Singapore (12 hrs)
        ("AMS", "HND", 11, 790.00),  # Amsterdam to Tokyo (11 hrs)
        ("DXB", "JFK", 14, 950.00),  # Dubai to New York (14 hrs)
        ("CMB", "DXB", 4, 250.00),   # Colombo to Dubai (4 hrs)
        ("CMB", "LHR", 11, 750.00),  # Colombo to London (11 hrs)
        ("SIN", "CMB", 4, 300.00),   # Singapore to Colombo (4 hrs)
        ("LHR", "FRA", 2, 120.00),   # London to Frankfurt (2 hrs)
        ("CDG", "AMS", 1, 95.00),    # Paris to Amsterdam (1 hr)
        ("LAX", "JFK", 5, 220.00),   # LA to New York (5 hrs)
    ]
    
    used_flight_numbers = set()
    
    for i in range(num_flights):
        # Select route details
        route = random.choice(route_pairs)
        origin, destination, duration_hours, base_price_avg = route
        
        # Unique Flight Number generation (e.g. AL100 - AL999)
        while True:
            fn_num = random.randint(100, 999)
            flight_num = f"AL{fn_num}"
            if flight_num not in used_flight_numbers:
                used_flight_numbers.add(flight_num)
                break
        
        # Vary departure times over the next 14 days
        days_offset = random.randint(0, 14)
        hours_offset = random.randint(0, 23)
        minutes_offset = random.choice([0, 15, 30, 45])
        
        dep_time = now + timedelta(days=days_offset, hours=hours_offset, minutes=minutes_offset)
        arr_time = dep_time + timedelta(hours=duration_hours)
        
        # Standard airplane seating configurations
        total_seats = random.choice([180, 240, 300, 380])
        available_seats = random.randint(5, total_seats)
        
        # Price variation based on seat availability and random peak multipliers
        price_multiplier = random.uniform(0.85, 1.25)
        if available_seats / total_seats < 0.2:
            price_multiplier *= 1.4
        
        base_price = round(base_price_avg * price_multiplier, 2)
        
        # Determine operational status based on offsets
        if days_offset == 0 and hours_offset == 0:
            status = "BOARDING"
        else:
            status_prob = random.random()
            if status_prob < 0.04:
                status = "CANCELLED"
            else:
                status = "SCHEDULED"
                
        flight = Flight(
            flight_number=flight_num,
            origin_airport=origin,
            destination_airport=destination,
            departure_time=dep_time,
            arrival_time=arr_time,
            total_seats=total_seats,
            available_seats=available_seats,
            base_price=base_price,
            status=status
        )
        flights.append(flight)
        
    return flights

async def seed_flights(db: AsyncSession):
    """Seed a massive, rich dataset of international flights into the database."""
    # Wipe the existing entries to avoid any duplicate constraints
    await db.execute(delete(Flight))
    
    # Generate 65 high-fidelity international flights
    flights = generate_flight_data(num_flights=65)
    db.add_all(flights)
    await db.commit()
    print(f"Successfully seeded {len(flights)} massive international flights.")

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

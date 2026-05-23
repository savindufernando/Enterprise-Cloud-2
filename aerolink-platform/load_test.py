"""
AeroLink Enterprise — Load Testing Suite
=========================================
Simulates realistic mixed traffic across all microservices through the API Gateway:
  - 5x  FlightBrowserUser  : anonymous flight searches, pagination, health checks
  - 2x  AuthUser           : registration & login storms
  - 1x  BookingJourneyUser : full end-to-end booking (search → view → book → baggage)

Quickstart (interactive web UI at http://localhost:8089):
    locust -f load_test.py --host=http://localhost:8000

Headless run (100 users, 5/s spawn, 5-minute soak):
    locust -f load_test.py --host=http://localhost:8000 \
           --users=100 --spawn-rate=5 --run-time=5m --headless

Requirements:
    pip install locust
"""
from __future__ import annotations

import base64
import json
import random
import uuid
from datetime import datetime, timedelta

from locust import HttpUser, between, task

# ---------------------------------------------------------------------------
# Shared test-data pools
# ---------------------------------------------------------------------------
AIRPORTS = [
    "LHR", "JFK", "CDG", "DXB", "SIN",
    "LAX", "ORD", "AMS", "FRA", "HKG",
    "BKK", "ICN", "NRT", "SYD", "DEL",
]

SEAT_ROWS = list(range(1, 36))
SEAT_COLS = ["A", "B", "C", "D", "E", "F"]


def _random_airports() -> tuple[str, str]:
    return tuple(random.sample(AIRPORTS, 2))


def _random_future_date(max_days: int = 90) -> str:
    return (datetime.utcnow() + timedelta(days=random.randint(1, max_days))).strftime("%Y-%m-%d")


def _random_seat() -> str:
    return f"{random.choice(SEAT_ROWS)}{random.choice(SEAT_COLS)}"


def _jwt_sub(token: str) -> str:
    """Extract the 'sub' claim (passenger UUID) from a JWT without verification."""
    try:
        payload_b64 = token.split(".")[1]
        payload_b64 += "=" * (4 - len(payload_b64) % 4)
        return json.loads(base64.urlsafe_b64decode(payload_b64)).get("sub", "")
    except Exception:
        return ""


# ---------------------------------------------------------------------------
# User Type 1 — Anonymous Flight Browser  (weight=5, most common traffic)
# ---------------------------------------------------------------------------
class FlightBrowserUser(HttpUser):
    """
    Represents anonymous users browsing and comparing flight options.
    Majority of traffic — read-only, no auth required.
    """
    weight = 5
    wait_time = between(1, 3)

    @task(6)
    def search_by_route(self):
        """Typical user: search for flights between two specific airports."""
        origin, dest = _random_airports()
        date = _random_future_date()
        self.client.get(
            f"/api/v1/flights/?origin={origin}&destination={dest}"
            f"&departure_date={date}&limit=20",
            name="/flights/?[route-search]",
        )

    @task(3)
    def search_sorted_by_price(self):
        """Price-sensitive user sorting results cheapest-first."""
        origin, dest = _random_airports()
        self.client.get(
            f"/api/v1/flights/?origin={origin}&destination={dest}"
            f"&sort_by=base_price&sort_order=asc&limit=20",
            name="/flights/?[price-sort]",
        )

    @task(2)
    def browse_paginated_results(self):
        """User browsing beyond the first page of results."""
        page = random.randint(2, 5)
        self.client.get(
            f"/api/v1/flights/?page={page}&limit=20",
            name="/flights/?[paginate]",
        )

    @task(1)
    def health_check(self):
        """Periodic aggregated health check (monitoring probe cadence)."""
        self.client.get("/health/aggregated", name="/health/aggregated")


# ---------------------------------------------------------------------------
# User Type 2 — Auth User  (weight=2, moderate frequency)
# ---------------------------------------------------------------------------
class AuthUser(HttpUser):
    """
    Represents users performing authentication flows: logins and new sign-ups.
    Tests the passenger service and Redis JWT session overhead under concurrent auth load.
    """
    weight = 2
    wait_time = between(2, 5)

    @task(3)
    def login(self):
        """Returning user login. Targets a small pool so some collide on the same account."""
        n = random.randint(1, 200)
        with self.client.post(
            "/api/v1/passengers/login",
            json={
                "email": f"loadtest_{n:03d}@aerolink-test.com",
                "password": "TestPass123!",
            },
            name="/passengers/login",
            catch_response=True,
        ) as resp:
            # 401 = user not seeded in DB — expected, not a test failure
            if resp.status_code in (200, 401, 422):
                resp.success()
            else:
                resp.failure(f"Login unexpected {resp.status_code}")

    @task(1)
    def register(self):
        """New user registration — each virtual user registers a unique account."""
        uid = uuid.uuid4().hex[:8]
        self.client.post(
            "/api/v1/passengers/register",
            json={
                "email": f"load_{uid}@aerolink-test.com",
                "password": "TestPass123!",
                "first_name": "Load",
                "last_name": "Tester",
            },
            name="/passengers/register",
        )


# ---------------------------------------------------------------------------
# User Type 3 — Full Booking Journey  (weight=1, least frequent, most complex)
# ---------------------------------------------------------------------------
class BookingJourneyUser(HttpUser):
    """
    Represents an authenticated passenger completing the full booking workflow:
      on_start  → register + decode JWT to extract passenger UUID
      task(4)   → search flights and cache their IDs
      task(2)   → view individual flight detail
      task(1)   → create booking via saga (calls booking + payment services)
      task(1)   → track baggage status
    """
    weight = 1
    wait_time = between(3, 7)

    token: str | None = None
    passenger_id: str | None = None
    cached_flight_ids: list[str]

    def on_start(self):
        self.cached_flight_ids = []
        uid = uuid.uuid4().hex[:8]
        with self.client.post(
            "/api/v1/passengers/register",
            json={
                "email": f"journey_{uid}@aerolink-test.com",
                "password": "Journey123!",
                "first_name": "Journey",
                "last_name": "User",
            },
            name="/passengers/register [journey-init]",
            catch_response=True,
        ) as resp:
            if resp.status_code == 201:
                data = resp.json()
                self.token = data.get("access_token", "")
                self.passenger_id = _jwt_sub(self.token)
                resp.success()
            else:
                resp.failure(f"Journey init failed: {resp.status_code}")

    def _auth(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(4)
    def search_and_cache_flights(self):
        """Search for flights; cache IDs for subsequent booking and detail calls."""
        origin, dest = _random_airports()
        with self.client.get(
            f"/api/v1/flights/?origin={origin}&destination={dest}&limit=10",
            headers=self._auth(),
            name="/flights/?[journey-search]",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                items = resp.json().get("items", [])
                if items:
                    self.cached_flight_ids = [str(f["id"]) for f in items[:5]]
                resp.success()
            else:
                resp.failure(f"Journey search failed: {resp.status_code}")

    @task(2)
    def view_flight_detail(self):
        """Tap a specific flight detail page (tests ETag caching path)."""
        if not self.cached_flight_ids:
            return
        fid = random.choice(self.cached_flight_ids)
        with self.client.get(
            f"/api/v1/flights/{fid}",
            headers=self._auth(),
            name="/flights/[id]",
            catch_response=True,
        ) as resp:
            # 304 = ETag cache hit — valid success
            if resp.status_code in (200, 304, 404):
                resp.success()
            else:
                resp.failure(f"Flight detail failed: {resp.status_code}")

    @task(1)
    def create_booking(self):
        """
        Full saga booking — touches booking service, payment service (mock), Kafka.
        Uses unique Idempotency-Key per attempt as required by the API.
        """
        if not self.cached_flight_ids or not self.passenger_id:
            return
        fid = random.choice(self.cached_flight_ids)
        with self.client.post(
            "/api/v1/bookings/",
            json={
                "passenger_id": self.passenger_id,
                "flight_id": fid,
                "seat_number": _random_seat(),
                "price": round(random.uniform(99.99, 1499.99), 2),
                "payment_token": f"tok_visa_{uuid.uuid4().hex[:16]}",
            },
            headers={
                **self._auth(),
                "Idempotency-Key": str(uuid.uuid4()),
            },
            name="/bookings/[create]",
            catch_response=True,
        ) as resp:
            # 409 = seat already taken, 422 = validation error — both are expected
            if resp.status_code in (200, 201, 409, 422):
                resp.success()
            else:
                resp.failure(f"Booking failed {resp.status_code}: {resp.text[:120]}")

    @task(1)
    def track_baggage(self):
        """Baggage tracking lookup — exercises DynamoDB read path."""
        bag_id = uuid.uuid4().hex[:12].upper()
        with self.client.get(
            f"/api/v1/baggage/{bag_id}",
            headers=self._auth(),
            name="/baggage/[id]",
            catch_response=True,
        ) as resp:
            # 404 expected for synthetic IDs not in DynamoDB
            if resp.status_code in (200, 404):
                resp.success()
            else:
                resp.failure(f"Baggage track failed: {resp.status_code}")

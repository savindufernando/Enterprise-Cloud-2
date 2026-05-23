"""
AeroLink Enterprise — Stress & Spike Testing Suite
====================================================
Pushes the platform beyond normal capacity to identify performance ceilings,
validate rate limiting, and verify system recovery behaviour.

Two LoadTestShape profiles are provided — select via env var:

  Stress test (gradual ramp to breaking point):
      locust -f stress_test.py --host=http://localhost:8000

  Spike test (sudden burst then recovery):
      STRESS_SHAPE=spike locust -f stress_test.py --host=http://localhost:8000

  Rate-limit probe only (verify 429 behaviour):
      locust -f stress_test.py --host=http://localhost:8000 RateLimitProbeUser \
             --users=200 --spawn-rate=50 --run-time=2m --headless

Requirements:
    pip install locust
"""
from __future__ import annotations

import base64
import json
import os
import random
import uuid

from locust import HttpUser, LoadTestShape, between, task

# ---------------------------------------------------------------------------
# Test data pools
# ---------------------------------------------------------------------------
AIRPORTS = [
    "LHR", "JFK", "CDG", "DXB", "SIN",
    "LAX", "ORD", "AMS", "FRA", "HKG",
]

SEAT_ROWS = list(range(1, 36))


def _random_airports() -> tuple[str, str]:
    return tuple(random.sample(AIRPORTS, 2))


def _random_seat() -> str:
    return f"{random.choice(SEAT_ROWS)}{random.choice(['A','B','C','D','E','F'])}"


def _jwt_sub(token: str) -> str:
    """Extract the 'sub' claim (passenger UUID) from a JWT without verification."""
    try:
        payload_b64 = token.split(".")[1]
        payload_b64 += "=" * (4 - len(payload_b64) % 4)
        return json.loads(base64.urlsafe_b64decode(payload_b64)).get("sub", "")
    except Exception:
        return ""


# ---------------------------------------------------------------------------
# Stress User — all endpoints, aggressive pacing
# ---------------------------------------------------------------------------
class StressUser(HttpUser):
    """
    High-frequency virtual user exercising all service paths under heavy load.
    Short wait times (0.1–0.5 s) generate the concurrency needed to find limits.
    """
    weight = 1
    wait_time = between(0.1, 0.5)

    token: str | None = None
    passenger_id: str | None = None
    cached_flight_ids: list[str]

    def on_start(self):
        self.cached_flight_ids = []
        uid = uuid.uuid4().hex[:8]
        with self.client.post(
            "/api/v1/passengers/register",
            json={
                "email": f"stress_{uid}@aerolink-test.com",
                "password": "Stress123!",
                "first_name": "Stress",
                "last_name": "Test",
            },
            name="/passengers/register [stress-init]",
            catch_response=True,
        ) as resp:
            if resp.status_code == 201:
                data = resp.json()
                self.token = data.get("access_token", "")
                self.passenger_id = _jwt_sub(self.token)
                resp.success()
            else:
                # Non-fatal: user will still run read-only tasks
                resp.failure(f"Stress init failed: {resp.status_code}")

    def _auth(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(5)
    def hammer_flight_search(self):
        """Dominant task — saturates the flight service search path."""
        origin, dest = _random_airports()
        self.client.get(
            f"/api/v1/flights/?origin={origin}&destination={dest}&limit=20",
            name="/flights/?[stress]",
        )

    @task(3)
    def hammer_auth(self):
        """Login attempts against a sparse user pool — exercises Redis + JWT path."""
        n = random.randint(1, 500)
        with self.client.post(
            "/api/v1/passengers/login",
            json={
                "email": f"stress_user{n}@aerolink-test.com",
                "password": "Stress123!",
            },
            name="/passengers/login [stress]",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 401):
                resp.success()
            else:
                resp.failure(f"Auth stress: {resp.status_code}")

    @task(2)
    def hammer_health(self):
        """Health endpoint under stress — should remain sub-50 ms even at peak load."""
        self.client.get("/health/aggregated", name="/health/aggregated [stress]")

    @task(1)
    def stress_booking(self):
        """
        Saga booking under stress — exercises booking + payment + Kafka pipeline.
        Prefetches a flight list on first call, then reuses cached IDs.
        """
        if not self.cached_flight_ids:
            with self.client.get(
                "/api/v1/flights/?limit=10",
                name="/flights/?[stress-prefetch]",
                catch_response=True,
            ) as resp:
                if resp.status_code == 200:
                    items = resp.json().get("items", [])
                    self.cached_flight_ids = [str(f["id"]) for f in items[:5]]
                    resp.success()
            return

        if not self.passenger_id:
            return

        fid = random.choice(self.cached_flight_ids)
        with self.client.post(
            "/api/v1/bookings/",
            json={
                "passenger_id": self.passenger_id,
                "flight_id": fid,
                "seat_number": _random_seat(),
                "price": round(random.uniform(99.99, 999.99), 2),
                "payment_token": f"tok_stress_{uuid.uuid4().hex[:16]}",
            },
            headers={
                **self._auth(),
                "Idempotency-Key": str(uuid.uuid4()),
            },
            name="/bookings/[stress]",
            catch_response=True,
        ) as resp:
            # 429 = rate limited, 409 = seat conflict, 422 = validation — all expected under stress
            if resp.status_code in (200, 201, 409, 422, 429):
                resp.success()
            else:
                resp.failure(f"Booking stress: {resp.status_code}")


# ---------------------------------------------------------------------------
# Rate-Limit Probe User — validates 429 behaviour
# ---------------------------------------------------------------------------
class RateLimitProbeUser(HttpUser):
    """
    Hammers a single read endpoint at maximum speed to confirm the API Gateway
    rate limiter fires 429s at the configured threshold (100 req / 10 sec).

    Expected outcome: a mix of 200s and 429s — both are marked as success here
    because receiving a 429 proves the rate limiter is working correctly.

    Run standalone:
        locust -f stress_test.py RateLimitProbeUser \
               --host=http://localhost:8000 --users=50 --spawn-rate=50 \
               --run-time=2m --headless
    """
    weight = 0          # Excluded from combined runs; use standalone command above
    wait_time = between(0.05, 0.1)

    @task
    def probe_rate_limit(self):
        with self.client.get(
            "/api/v1/flights/?limit=1",
            name="/flights/?[rate-limit-probe]",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 429):
                resp.success()
            else:
                resp.failure(f"Unexpected {resp.status_code}")


# ---------------------------------------------------------------------------
# LoadTestShape: Stress Profile (default)
# ---------------------------------------------------------------------------
_STRESS_STAGES = [
    # (cumulative_end_seconds, target_users, spawn_rate_per_second)
    #  0– 60s │   0→100 users @  5/s │ Warm-up / baseline measurement
    { "duration":  60, "users": 100, "spawn_rate":  5 },
    # 60–120s │ 100→250 users @ 10/s │ Moderate load
    { "duration": 120, "users": 250, "spawn_rate": 10 },
    # 120–180s │ 250→500 users @ 15/s │ Heavy load — expect latency to climb
    { "duration": 180, "users": 500, "spawn_rate": 15 },
    # 180–270s │ 500 users (hold)      │ Stress zone: watch for error-rate spike
    { "duration": 270, "users": 500, "spawn_rate":  5 },
    # 270–330s │ 500→750 users @ 10/s │ Near-breaking-point
    { "duration": 330, "users": 750, "spawn_rate": 10 },
    # 330–420s │ 750 users (hold)      │ Sustained stress — confirm no memory leak
    { "duration": 420, "users": 750, "spawn_rate":  5 },
    # 420–450s │ 750→0 users @ 50/s   │ Rapid ramp-down: verify recovery
    { "duration": 450, "users":   0, "spawn_rate": 50 },
]

# ---------------------------------------------------------------------------
# LoadTestShape: Spike Profile  (STRESS_SHAPE=spike)
# ---------------------------------------------------------------------------
_SPIKE_STAGES = [
    #  0– 30s │   0→ 50 users @  5/s │ Establish normal baseline
    { "duration":  30, "users":  50, "spawn_rate":  5 },
    # 30– 60s │  50 users (hold)      │ Steady state
    { "duration":  60, "users":  50, "spawn_rate":  5 },
    # 60– 70s │  50→500 users @ 50/s │ Sudden traffic spike (flash sale / viral event)
    { "duration":  70, "users": 500, "spawn_rate": 50 },
    # 70–130s │ 500 users (hold)      │ Peak spike — observe error rate and latency
    { "duration": 130, "users": 500, "spawn_rate": 50 },
    # 130–160s │ 500→50 users @ 50/s │ Spike subsides
    { "duration": 160, "users":  50, "spawn_rate": 50 },
    # 160–240s │  50 users (hold)     │ Recovery observation period
    { "duration": 240, "users":  50, "spawn_rate":  5 },
    # 240–270s │  50→ 0 users @ 10/s │ Clean ramp-down
    { "duration": 270, "users":   0, "spawn_rate": 10 },
]


class AeroLinkTestShape(LoadTestShape):
    """
    Single shape class that delegates to either the stress or spike profile
    based on the STRESS_SHAPE environment variable.

    Default (stress):   locust -f stress_test.py --host=http://localhost:8000
    Spike profile:      STRESS_SHAPE=spike locust -f stress_test.py --host=http://localhost:8000
    """

    def tick(self) -> tuple[int, float] | None:
        stages = _SPIKE_STAGES if os.getenv("STRESS_SHAPE", "stress") == "spike" else _STRESS_STAGES
        run_time = self.get_run_time()
        for stage in stages:
            if run_time < stage["duration"]:
                return stage["users"], stage["spawn_rate"]
        return None  # Shape complete — Locust stops the run

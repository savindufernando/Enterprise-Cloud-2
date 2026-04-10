# AeroLink Airline Systems Platform — Implementation Plan

> **Module:** COMP60010 · **Deadline:** Thursday 11 June 2026 · **Weight:** 50%

## Goal

Build a production-grade, cloud-native, microservices-based airline platform for AeroLink that satisfies **all 8 assignment tasks**, **all 3 deliverables**, and includes **15 beyond-rubric enhancements** to demonstrate exceptional attention to detail and enterprise engineering maturity.

---

## User Review Required

> [!IMPORTANT]
> **Technology Stack:**
> - **Backend:** Python 3.12 + FastAPI (async)
> - **Frontend:** React 18 (Vite) + Material UI
> - **ORM/DB:** SQLAlchemy 2.0 (async) + Alembic (migrations)
> - **Validation:** Pydantic v2 (built into FastAPI)
> - **Messaging:** Apache Kafka via aiokafka
> - **WebSocket:** FastAPI native WebSocket support
> - **Auth:** python-jose (JWT) + passlib + bcrypt
> - **HTTP Client:** httpx (async)
> - **Circuit Breaker:** pybreaker
> - **Testing:** pytest + pytest-asyncio + httpx + coverage
> - **Performance Testing:** Locust (Python) or k6
> - **Databases:** PostgreSQL + DynamoDB (local) + Redis
> - **Cloud:** AWS (Lambda, API Gateway, CloudWatch, Cognito, S3)
> - **Containerisation:** Docker + Kubernetes (EKS manifests)
> - **IaC:** Terraform
> - **CI/CD:** GitHub Actions
> - **Monitoring:** Prometheus + Grafana + Jaeger + OpenTelemetry
>
> Please confirm or suggest changes before I begin building.

> [!WARNING]
> **AWS Costs:** We'll design everything for AWS deployment but run locally via Docker Compose for development. Terraform files will be included but you won't need to actually deploy to AWS (unless you want to). The system will be fully demonstrable locally.

---

## Proposed Changes

### Full Technology Stack (Python Ecosystem)

| Layer | Technology | Why |
|---|---|---|
| **Web Framework** | FastAPI | Async, auto-generates OpenAPI/Swagger docs, Pydantic validation built-in, industry-standard for Python microservices |
| **ASGI Server** | Uvicorn | High-performance async server for FastAPI |
| **ORM** | SQLAlchemy 2.0 (async) | Industry-standard Python ORM, async support, type-annotated |
| **Migrations** | Alembic | Version-controlled database schema migrations |
| **Validation** | Pydantic v2 | Zero-effort request/response validation, JSON schema generation |
| **Auth** | python-jose + passlib[bcrypt] | JWT creation/verification + password hashing |
| **HTTP Client** | httpx | Async HTTP client for inter-service communication |
| **Kafka** | aiokafka | Async Kafka producer/consumer |
| **WebSocket** | FastAPI WebSocket | Native async WebSocket support |
| **Circuit Breaker** | pybreaker | Circuit breaker pattern implementation |
| **Caching** | redis-py (aioredis) | Async Redis client |
| **DynamoDB** | aioboto3 | Async AWS SDK for DynamoDB Local |
| **Logging** | structlog | Structured JSON logging |
| **Tracing** | opentelemetry-sdk | Distributed tracing |
| **Metrics** | prometheus-client | Prometheus metrics exposition |
| **Testing** | pytest + pytest-asyncio + httpx | Async-aware testing |
| **Load Testing** | Locust | Python-native load testing |
| **Linting** | ruff | Ultra-fast Python linter + formatter |
| **Type Checking** | mypy | Static type checking |

---

### Project Structure

```
d:\APIIT\Enterprise-Cloud-2\aerolink-platform\
│
├── frontend/                              # React (Vite) + Material UI
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── FlightSearch.jsx
│   │   │   ├── BookingFlow.jsx
│   │   │   ├── CheckIn.jsx
│   │   │   ├── BaggageTracking.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── Login.jsx
│   │   ├── hooks/
│   │   ├── services/                      # Axios API client layer
│   │   ├── context/                       # Auth context, WebSocket context
│   │   └── utils/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── services/
│   ├── api_gateway/                       # FastAPI gateway
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py                    # FastAPI app entry
│   │   │   ├── middleware/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py                # JWT validation
│   │   │   │   ├── rate_limiter.py        # Token bucket algorithm ★
│   │   │   │   ├── correlation_id.py      # Generate & propagate ★
│   │   │   │   ├── request_logger.py      # Structured logging
│   │   │   │   └── error_handler.py       # Consistent error format ★
│   │   │   ├── routes/
│   │   │   │   ├── __init__.py
│   │   │   │   └── proxy.py               # Reverse proxy to services
│   │   │   ├── services/
│   │   │   │   └── health_aggregator.py   # Aggregate health check ★
│   │   │   └── config.py
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── pyproject.toml
│   │   └── tests/
│   │       ├── __init__.py
│   │       ├── test_auth.py
│   │       ├── test_rate_limiter.py
│   │       └── test_proxy.py
│   │
│   ├── flight_service/                    # Flight management
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── routes.py              # FastAPI router
│   │   │   │   ├── schemas.py             # Pydantic request/response models
│   │   │   │   └── dependencies.py        # Dependency injection
│   │   │   ├── core/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── config.py              # Settings via pydantic-settings
│   │   │   │   ├── security.py            # Auth dependencies
│   │   │   │   └── exceptions.py          # Custom exceptions
│   │   │   ├── models/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── flight.py              # SQLAlchemy model
│   │   │   │   ├── seat.py
│   │   │   │   └── airport.py
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   └── flight_service.py      # Business logic
│   │   │   ├── events/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── producer.py            # Kafka producer
│   │   │   │   └── consumer.py            # Kafka consumer
│   │   │   ├── health/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── liveness.py            # ★
│   │   │   │   └── readiness.py           # ★
│   │   │   └── db/
│   │   │       ├── __init__.py
│   │   │       ├── session.py             # Async session factory
│   │   │       └── base.py                # Declarative base
│   │   ├── alembic/                       # DB migrations
│   │   │   ├── versions/
│   │   │   ├── env.py
│   │   │   └── alembic.ini
│   │   ├── seeds/
│   │   │   └── seed_flights.py
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── pyproject.toml
│   │   └── tests/
│   │       ├── __init__.py
│   │       ├── conftest.py                # Fixtures: test DB, test client
│   │       ├── unit/
│   │       │   ├── test_flight_service.py
│   │       │   └── test_schemas.py
│   │       └── integration/
│   │           └── test_flight_routes.py
│   │
│   ├── booking_service/                   # Booking & ticketing
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── api/
│   │   │   │   ├── routes.py
│   │   │   │   ├── schemas.py
│   │   │   │   └── dependencies.py
│   │   │   ├── core/
│   │   │   ├── models/
│   │   │   │   ├── booking.py
│   │   │   │   └── booking_event.py       # Event sourcing / audit ★
│   │   │   ├── services/
│   │   │   │   ├── booking_service.py
│   │   │   │   └── saga_orchestrator.py   # Saga pattern
│   │   │   ├── middleware/
│   │   │   │   └── idempotency.py         # Idempotency keys ★
│   │   │   ├── events/
│   │   │   ├── health/
│   │   │   └── db/
│   │   ├── alembic/
│   │   ├── seeds/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── tests/
│   │
│   ├── passenger_service/                 # Passenger management & check-in
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── api/
│   │   │   │   ├── routes.py
│   │   │   │   ├── schemas.py
│   │   │   │   └── dependencies.py
│   │   │   ├── core/
│   │   │   │   ├── config.py
│   │   │   │   ├── security.py            # JWT + bcrypt + RBAC
│   │   │   │   └── exceptions.py
│   │   │   ├── models/
│   │   │   │   ├── passenger.py
│   │   │   │   ├── refresh_token.py
│   │   │   │   └── consent_record.py      # GDPR consent ★
│   │   │   ├── services/
│   │   │   │   ├── passenger_service.py
│   │   │   │   ├── auth_service.py        # Login, register, refresh
│   │   │   │   └── gdpr_service.py        # Data export, erasure ★
│   │   │   ├── events/
│   │   │   ├── health/
│   │   │   └── db/
│   │   ├── alembic/
│   │   ├── seeds/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── tests/
│   │
│   ├── baggage_service/                   # Baggage tracking (DynamoDB)
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── api/
│   │   │   │   ├── routes.py
│   │   │   │   └── schemas.py
│   │   │   ├── core/
│   │   │   ├── models/
│   │   │   │   └── baggage.py             # DynamoDB model (aioboto3)
│   │   │   ├── services/
│   │   │   │   └── baggage_service.py
│   │   │   ├── events/
│   │   │   ├── health/
│   │   │   └── config.py
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── tests/
│   │
│   ├── payment_service/                   # Payment processing
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── api/
│   │   │   │   ├── routes.py
│   │   │   │   └── schemas.py
│   │   │   ├── core/
│   │   │   ├── models/
│   │   │   │   └── payment.py
│   │   │   ├── services/
│   │   │   │   └── payment_service.py     # Stripe mock / tokenisation
│   │   │   ├── middleware/
│   │   │   │   └── idempotency.py         # Idempotency keys ★
│   │   │   ├── audit/
│   │   │   │   └── audit_logger.py        # PCI-DSS audit trail ★
│   │   │   ├── events/
│   │   │   ├── health/
│   │   │   └── db/
│   │   ├── alembic/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── tests/
│   │
│   ├── notification_service/              # Event-driven notifications
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── services/
│   │   │   │   ├── email_service.py       # SendGrid / Mailtrap
│   │   │   │   └── template_service.py    # Jinja2 email templates
│   │   │   ├── events/
│   │   │   │   └── consumer.py            # Consumes booking/flight events
│   │   │   ├── dlq/
│   │   │   │   └── dlq_handler.py         # Dead Letter Queue ★
│   │   │   ├── templates/
│   │   │   │   ├── booking_confirmation.html
│   │   │   │   ├── checkin_confirmation.html
│   │   │   │   └── flight_update.html
│   │   │   ├── health/
│   │   │   └── config.py
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── tests/
│   │
│   └── realtime_service/                  # WebSocket server
│       ├── app/
│       │   ├── __init__.py
│       │   ├── main.py
│       │   ├── handlers/
│       │   │   ├── flight_updates.py
│       │   │   ├── baggage_updates.py
│       │   │   └── seat_availability.py
│       │   ├── events/
│       │   │   └── consumer.py            # Kafka → WebSocket bridge
│       │   ├── manager.py                 # WebSocket connection manager
│       │   ├── health/
│       │   └── config.py
│       ├── Dockerfile
│       ├── requirements.txt
│       └── tests/
│
├── external_mocks/                        # Third-party API mocks ★
│   ├── airport_api/
│   │   ├── app/
│   │   │   ├── main.py                    # FastAPI mock service
│   │   │   └── data/airports.json
│   │   └── Dockerfile
│   ├── immigration_api/
│   │   ├── app/main.py
│   │   └── Dockerfile
│   └── payment_gateway_mock/
│       ├── app/main.py
│       └── Dockerfile
│
├── shared/                                # Shared Python package
│   ├── __init__.py
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── correlation_id.py              # Correlation ID propagation ★
│   │   ├── error_handler.py               # Consistent error format ★
│   │   └── circuit_breaker.py             # pybreaker wrapper
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── logger.py                      # structlog JSON logging
│   │   ├── graceful_shutdown.py           # SIGTERM handler ★
│   │   ├── retry.py                       # Exponential backoff + jitter
│   │   ├── audit.py                       # Audit trail events ★
│   │   ├── feature_flags.py              # Feature flag system ★
│   │   └── pagination.py                 # Pagination helper ★
│   ├── health/
│   │   ├── __init__.py
│   │   ├── liveness.py                    # Liveness probe ★
│   │   └── readiness.py                   # Readiness probe ★
│   ├── kafka/
│   │   ├── __init__.py
│   │   ├── producer.py                    # aiokafka producer
│   │   ├── consumer.py                    # aiokafka consumer
│   │   └── dlq_handler.py               # Dead Letter Queue ★
│   ├── db/
│   │   ├── __init__.py
│   │   ├── session.py                     # Async SQLAlchemy session ★
│   │   └── base.py                        # Declarative base
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── jwt_handler.py                # JWT create/verify
│   │   ├── password.py                   # bcrypt hashing
│   │   └── rbac.py                       # Role-based access control
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── error.py                      # Error response Pydantic model
│   │   ├── pagination.py                 # Paginated response model
│   │   └── health.py                     # Health check response model
│   ├── constants/
│   │   ├── __init__.py
│   │   ├── error_codes.py
│   │   ├── roles.py
│   │   └── events.py                     # Kafka topic names
│   ├── setup.py                           # Installable package
│   └── pyproject.toml
│
├── infrastructure/                        # Terraform IaC
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── providers.tf
│   ├── modules/
│   │   ├── vpc/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── eks/
│   │   ├── rds/
│   │   ├── dynamodb/
│   │   ├── elasticache/
│   │   ├── lambda/
│   │   ├── api_gateway/
│   │   ├── s3/
│   │   ├── sqs/
│   │   ├── cloudwatch/
│   │   └── iam/
│   └── environments/
│       ├── dev.tfvars
│       ├── staging.tfvars
│       └── prod.tfvars
│
├── k8s/                                   # Kubernetes manifests
│   ├── namespace.yaml
│   ├── deployments/
│   │   ├── flight-service.yaml
│   │   ├── booking-service.yaml
│   │   ├── passenger-service.yaml
│   │   ├── baggage-service.yaml
│   │   ├── payment-service.yaml
│   │   ├── notification-service.yaml
│   │   ├── realtime-service.yaml
│   │   └── api-gateway.yaml
│   ├── services/
│   ├── configmaps/
│   ├── secrets/
│   ├── hpa/                               # Horizontal Pod Autoscaler
│   ├── ingress/
│   ├── network-policies/
│   └── pdb/                               # Pod Disruption Budgets
│
├── lambda/                                # AWS Lambda functions (Python)
│   ├── boarding_pass_generator/
│   │   ├── handler.py
│   │   └── requirements.txt
│   ├── booking_confirmation_email/
│   │   ├── handler.py
│   │   └── requirements.txt
│   └── flight_schedule_sync/
│       ├── handler.py
│       └── requirements.txt
│
├── monitoring/                            # Prometheus + Grafana (local)
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   ├── provisioning/
│   │   │   ├── dashboards/
│   │   │   │   └── aerolink-dashboard.json
│   │   │   └── datasources/
│   │   │       └── prometheus.yml
│   │   └── dashboards/
│   │       ├── system-overview.json
│   │       ├── service-health.json
│   │       └── performance-metrics.json
│   └── alerting/
│       └── rules.yml
│
├── testing/                               # Test artifacts
│   ├── postman/
│   │   ├── AeroLink.postman_collection.json
│   │   ├── AeroLink-Dev.postman_environment.json
│   │   └── newman-report/
│   ├── locust/                            # Python load testing
│   │   ├── locustfile.py                  # Main load test
│   │   ├── flight_tasks.py
│   │   ├── booking_tasks.py
│   │   └── stress_test.py
│   └── coverage/                          # Aggregated coverage reports
│
├── .github/
│   └── workflows/
│       ├── ci.yml                         # Test + lint on push
│       ├── build.yml                      # Docker build on merge
│       └── deploy.yml                     # Deploy to staging (optional)
│
├── docker-compose.yml                     # All services
├── docker-compose.infra.yml               # Kafka, PostgreSQL, Redis, DynamoDB Local
├── .env.example
├── .gitignore
├── Makefile
└── README.md
```

> Items marked with ★ are beyond-rubric enhancements.

---

## Implementation Phases

### Phase 1: Foundation & Shared Library (Week 1)

#### Shared Python Package (`shared/`)
This is installed as a local package in every service via `pip install -e ../shared/`

##### [NEW] shared/utils/logger.py
```python
import structlog

def get_logger(service_name: str):
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
    )
    return structlog.get_logger(service=service_name)
```

##### [NEW] shared/middleware/correlation_id.py ★
```python
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import structlog

class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        correlation_id = request.headers.get(
            "X-Correlation-ID", str(uuid.uuid4())
        )
        structlog.contextvars.bind_contextvars(correlation_id=correlation_id)
        request.state.correlation_id = correlation_id
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return response
```

##### [NEW] shared/middleware/error_handler.py ★
```python
from fastapi import Request
from fastapi.responses import JSONResponse
from datetime import datetime, timezone

class AppError(Exception):
    def __init__(self, code: str, message: str, status: int = 400):
        self.code = code
        self.message = message
        self.status = status

async def error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "status": exc.status,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "path": str(request.url.path),
                "correlationId": getattr(request.state, "correlation_id", None),
            }
        },
    )
```

##### [NEW] shared/utils/graceful_shutdown.py ★
```python
import signal
import asyncio
from typing import Callable, List

class GracefulShutdown:
    def __init__(self):
        self._cleanup_handlers: List[Callable] = []

    def register(self, handler: Callable):
        self._cleanup_handlers.append(handler)

    def setup(self, loop: asyncio.AbstractEventLoop):
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(sig, lambda: asyncio.create_task(self._shutdown()))

    async def _shutdown(self):
        for handler in reversed(self._cleanup_handlers):
            await handler()
```

##### [NEW] shared/db/session.py ★
```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from contextlib import asynccontextmanager

class DatabaseSession:
    def __init__(self, url: str, pool_size: int = 20, max_overflow: int = 10):
        self.engine = create_async_engine(
            url,
            pool_size=pool_size,
            max_overflow=max_overflow,
            pool_timeout=5,       # Fail fast if pool exhausted
            pool_recycle=3600,     # Recycle connections after 1 hour
            pool_pre_ping=True,    # Health check on acquire
        )
        self.session_factory = async_sessionmaker(
            self.engine, class_=AsyncSession, expire_on_commit=False
        )

    @asynccontextmanager
    async def get_session(self) -> AsyncSession:
        async with self.session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
```

##### [NEW] shared/kafka/producer.py + consumer.py
```python
# producer.py
from aiokafka import AIOKafkaProducer
import json

class KafkaEventProducer:
    def __init__(self, bootstrap_servers: str):
        self.producer = AIOKafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )

    async def publish(self, topic: str, event: dict, correlation_id: str = None):
        headers = []
        if correlation_id:
            headers.append(("X-Correlation-ID", correlation_id.encode()))
        await self.producer.send_and_wait(topic, value=event, headers=headers)
```

##### [NEW] shared/kafka/dlq_handler.py ★
- Routes messages to `{topic}.dlq` after 3 failed processing attempts
- Admin endpoint to view and retry DLQ messages

##### [NEW] shared/middleware/circuit_breaker.py
```python
import pybreaker

def create_circuit_breaker(name: str, fail_max: int = 5, reset_timeout: int = 30):
    return pybreaker.CircuitBreaker(
        fail_max=fail_max,
        reset_timeout=reset_timeout,
        name=name,
        listeners=[CircuitBreakerMetricsListener()],
    )
```

##### [NEW] shared/utils/retry.py
```python
import asyncio
import random

async def retry_with_backoff(func, max_retries: int = 3, base_delay: float = 1.0):
    for attempt in range(max_retries):
        try:
            return await func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)  # jitter
            await asyncio.sleep(delay)
```

##### [NEW] shared/utils/audit.py ★
```python
from datetime import datetime, timezone
from pydantic import BaseModel

class AuditEvent(BaseModel):
    entity_type: str
    entity_id: str
    action: str
    old_value: dict | None = None
    new_value: dict | None = None
    performed_by: str
    correlation_id: str | None = None
    timestamp: datetime = datetime.now(timezone.utc)
```

##### [NEW] shared/utils/feature_flags.py ★
```python
import os

class FeatureFlags:
    DYNAMIC_PRICING = os.getenv("FF_DYNAMIC_PRICING", "false").lower() == "true"
    NEW_BOOKING_FLOW = os.getenv("FF_NEW_BOOKING_FLOW", "false").lower() == "true"
    ENHANCED_BAGGAGE_TRACKING = os.getenv("FF_ENHANCED_BAGGAGE", "false").lower() == "true"

    @classmethod
    def is_enabled(cls, flag_name: str) -> bool:
        return getattr(cls, flag_name, False)
```

##### [NEW] shared/health/liveness.py + readiness.py ★
```python
# liveness.py — Is the process alive?
async def liveness_check() -> dict:
    return {"status": "alive", "timestamp": datetime.now(timezone.utc).isoformat()}

# readiness.py — Is the service ready to receive traffic?
async def readiness_check(db_session, kafka_producer, redis_client) -> dict:
    checks = {}
    checks["database"] = await _check_db(db_session)
    checks["kafka"] = await _check_kafka(kafka_producer)
    checks["redis"] = await _check_redis(redis_client)
    overall = "ready" if all(c["status"] == "ok" for c in checks.values()) else "not_ready"
    return {"status": overall, "checks": checks}
```

##### [NEW] shared/utils/pagination.py ★
```python
from pydantic import BaseModel
from typing import Generic, TypeVar, List

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    pagination: dict  # { page, limit, total, total_pages }

    @classmethod
    def create(cls, items: List[T], total: int, page: int, limit: int):
        return cls(
            data=items,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": (total + limit - 1) // limit,
            },
        )
```

##### [NEW] shared/auth/rbac.py
```python
from enum import Enum
from functools import wraps
from fastapi import HTTPException, status

class Role(str, Enum):
    ADMIN = "admin"
    AIRLINE_OPERATOR = "airline_operator"
    GROUND_STAFF = "ground_staff"
    PASSENGER = "passenger"

def require_roles(*allowed_roles: Role):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user=None, **kwargs):
            if current_user.role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator
```

---

#### Infrastructure Setup

##### [NEW] docker-compose.infra.yml
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: aerolink
      POSTGRES_PASSWORD: aerolink_dev
    ports: ["5432:5432"]
    volumes:
      - ./scripts/init-databases.sql:/docker-entrypoint-initdb.d/init.sql

  kafka:
    image: bitnami/kafka:3.7
    environment:
      KAFKA_CFG_NODE_ID: 0
      KAFKA_CFG_PROCESS_ROLES: controller,broker
      KAFKA_CFG_CONTROLLER_QUORUM_VOTERS: 0@kafka:9093
      KAFKA_CFG_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093
    ports: ["9092:9092"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  dynamodb-local:
    image: amazon/dynamodb-local:latest
    ports: ["8000:8000"]

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    ports: ["9090:9090"]

  grafana:
    image: grafana/grafana:latest
    volumes:
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    ports: ["3100:3000"]

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports: ["16686:16686", "4317:4317"]
```

##### [NEW] Makefile
```makefile
.PHONY: up down test lint migrate seed

up:
	docker compose -f docker-compose.infra.yml -f docker-compose.yml up -d

down:
	docker compose -f docker-compose.infra.yml -f docker-compose.yml down -v

test:
	@for service in services/*/; do \
		echo "Testing $$service..."; \
		cd $$service && python -m pytest tests/ -v --cov=app --cov-report=term-missing && cd ../..; \
	done

lint:
	ruff check services/ shared/
	mypy services/ shared/

migrate:
	@for service in services/flight_service services/booking_service services/passenger_service services/payment_service; do \
		cd $$service && alembic upgrade head && cd ../..; \
	done

seed:
	python services/flight_service/seeds/seed_flights.py
	python services/passenger_service/seeds/seed_passengers.py

load-test:
	cd testing/locust && locust -f locustfile.py --headless -u 300 -r 10 --run-time 5m

postman:
	npx newman run testing/postman/AeroLink.postman_collection.json -e testing/postman/AeroLink-Dev.postman_environment.json --reporters cli,html
```

---

### Phase 2: Flight Service (Week 2)

##### [NEW] services/flight_service/ (Port 8001)

**Example: main.py**
```python
from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.api.routes import router
from app.events.consumer import start_consumer
from shared.middleware.correlation_id import CorrelationIdMiddleware
from shared.middleware.error_handler import AppError, error_handler
from shared.utils.graceful_shutdown import GracefulShutdown
from prometheus_client import make_asgi_app

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db.connect()
    await kafka_producer.start()
    consumer_task = asyncio.create_task(start_consumer())
    yield
    # Shutdown (graceful ★)
    consumer_task.cancel()
    await kafka_producer.stop()
    await db.disconnect()

app = FastAPI(
    title="AeroLink Flight Service",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api-docs",       # Swagger UI
    redoc_url="/api-redoc",     # ReDoc
)

app.add_middleware(CorrelationIdMiddleware)
app.add_exception_handler(AppError, error_handler)
app.include_router(router, prefix="/api/v1/flights")

# Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
```

**Endpoints:**
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/flights` | Public | Search flights (pagination, filtering, sorting ★) |
| GET | `/api/v1/flights/{id}` | Public | Get flight details (ETag caching ★) |
| POST | `/api/v1/flights` | ADMIN | Create flight |
| PUT | `/api/v1/flights/{id}` | ADMIN | Update flight |
| PATCH | `/api/v1/flights/{id}/status` | OPERATOR | Update flight status |
| GET | `/api/v1/flights/{id}/seats` | Public | Get seat availability |
| GET | `/health/live` | Internal | Liveness probe ★ |
| GET | `/health/ready` | Internal | Readiness probe ★ |
| GET | `/api-docs` | Public | Swagger UI (auto-generated by FastAPI) |
| GET | `/metrics` | Internal | Prometheus metrics |

**Example Pydantic Schema (automatic validation + Swagger docs):**
```python
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
from uuid import UUID

class FlightStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    BOARDING = "BOARDING"
    DEPARTED = "DEPARTED"
    ARRIVED = "ARRIVED"
    CANCELLED = "CANCELLED"

class FlightCreate(BaseModel):
    flight_number: str = Field(..., pattern=r"^AL\d{3,4}$", example="AL1234")
    origin_airport: str = Field(..., min_length=3, max_length=3, example="LHR")
    destination_airport: str = Field(..., min_length=3, max_length=3, example="JFK")
    departure_time: datetime
    arrival_time: datetime
    total_seats: int = Field(..., gt=0, le=500)
    base_price: float = Field(..., gt=0)

    model_config = {"extra": "forbid"}  # Reject unknown fields ★

class FlightResponse(BaseModel):
    id: UUID
    flight_number: str
    origin_airport: str
    destination_airport: str
    departure_time: datetime
    arrival_time: datetime
    total_seats: int
    available_seats: int
    base_price: float
    status: FlightStatus
    created_at: datetime
    updated_at: datetime
```

**Example Route with Pagination + Filtering + Sorting ★:**
```python
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
    flights, total = await flight_service.search(db, origin, destination, departure_date, sort_by, sort_order, page, limit)
    return PaginatedResponse.create(flights, total, page, limit)
```

**Example ETag Caching ★:**
```python
@router.get("/{flight_id}", response_model=FlightResponse)
async def get_flight(
    flight_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    flight = await flight_service.get_by_id(db, flight_id)
    etag = f'"{flight.updated_at.isoformat()}"'

    if request.headers.get("If-None-Match") == etag:
        return Response(status_code=304)

    response = JSONResponse(content=jsonable_encoder(FlightResponse.model_validate(flight)))
    response.headers["ETag"] = etag
    return response
```

**Kafka Events Published:** `flight.created`, `flight.updated`, `flight.status.changed`, `flight.pricing.updated`, `seat.availability.changed`

**Database (PostgreSQL):** tables: `flights`, `seats`, `routes`, `airports`

**Alembic Migration Example:**
```python
# alembic/versions/001_create_flights_table.py
def upgrade():
    op.create_table(
        "flights",
        sa.Column("id", sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("flight_number", sa.String(10), nullable=False, unique=True),
        sa.Column("origin_airport", sa.String(3), nullable=False),
        sa.Column("destination_airport", sa.String(3), nullable=False),
        sa.Column("departure_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("arrival_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("total_seats", sa.Integer, nullable=False),
        sa.Column("available_seats", sa.Integer, nullable=False),
        sa.Column("base_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("status", sa.Enum("SCHEDULED","BOARDING","DEPARTED","ARRIVED","CANCELLED", name="flight_status"), default="SCHEDULED"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index("ix_flights_origin_dest_date", "flights", ["origin_airport", "destination_airport", "departure_time"])

def downgrade():
    op.drop_table("flights")
```

**Dockerfile Example:**
```dockerfile
FROM python:3.12-slim AS base
WORKDIR /app

# Install shared package
COPY shared/ /shared/
RUN pip install -e /shared/

# Install service dependencies
COPY services/flight_service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY services/flight_service/app/ ./app/
COPY services/flight_service/alembic/ ./alembic/
COPY services/flight_service/alembic.ini .

EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

---

### Phase 3: Booking + Passenger Services (Week 3)

#### Booking Service (Port 8002)
##### [NEW] services/booking_service/

**Saga Orchestrator (Booking Flow):**
```python
class BookingSaga:
    """Orchestrates the distributed booking transaction."""

    async def execute(self, booking_request: BookingCreate) -> BookingResponse:
        saga_id = str(uuid.uuid4())
        steps_completed = []

        try:
            # Step 1: Reserve seat
            await self._reserve_seat(booking_request.flight_id, booking_request.seat_id)
            steps_completed.append("SEAT_RESERVED")

            # Step 2: Process payment
            payment = await self._process_payment(booking_request.payment_info)
            steps_completed.append("PAYMENT_PROCESSED")

            # Step 3: Confirm booking
            booking = await self._confirm_booking(booking_request, payment.id)
            steps_completed.append("BOOKING_CONFIRMED")

            # Step 4: Publish confirmation event
            await self.kafka_producer.publish("aerolink.booking.confirmed", booking.dict())

            return booking

        except Exception as e:
            # Compensating transactions
            await self._compensate(steps_completed, booking_request, saga_id)
            await self.kafka_producer.publish("aerolink.booking.failed", {"saga_id": saga_id, "error": str(e)})
            raise

    async def _compensate(self, steps: list, request, saga_id: str):
        if "PAYMENT_PROCESSED" in steps:
            await self._refund_payment(request)
        if "SEAT_RESERVED" in steps:
            await self._release_seat(request.flight_id, request.seat_id)
```

**Idempotency Middleware ★:**
```python
class IdempotencyMiddleware:
    """Prevents duplicate operations using idempotency keys."""

    async def __call__(self, request: Request, call_next):
        if request.method in ("POST", "PUT", "PATCH"):
            idempotency_key = request.headers.get("Idempotency-Key")
            if idempotency_key:
                cached = await self.redis.get(f"idempotency:{idempotency_key}")
                if cached:
                    return JSONResponse(content=json.loads(cached), status_code=200)

        response = await call_next(request)

        if idempotency_key and response.status_code in (200, 201):
            body = [chunk async for chunk in response.body_iterator]
            await self.redis.setex(f"idempotency:{idempotency_key}", 86400, body[0])

        return response
```

#### Passenger Service (Port 8003)
##### [NEW] services/passenger_service/

**GDPR Compliance ★:**
```python
@router.delete("/me", status_code=204)
async def delete_account(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """GDPR Right to Erasure — anonymise PII."""
    await gdpr_service.anonymise_passenger(db, current_user.id)
    await audit_logger.log(AuditEvent(
        entity_type="PASSENGER", entity_id=str(current_user.id),
        action="ACCOUNT_DELETED", performed_by=str(current_user.id),
    ))

@router.get("/me/data-export")
async def export_data(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """GDPR Data Portability — export all personal data as JSON."""
    data = await gdpr_service.export_passenger_data(db, current_user.id)
    return JSONResponse(content=data, headers={"Content-Disposition": "attachment; filename=my-data.json"})
```

---

### Phase 4: Baggage + Payment + Notification Services (Week 4)

#### Baggage Service (Port 8004) — DynamoDB
#### Payment Service (Port 8005) — With audit trail ★ and idempotency ★
#### Notification Service (Port 8006) — Event-driven, Jinja2 templates, DLQ ★

---

### Phase 5: Realtime Service + API Gateway (Week 5)

#### Realtime Service (Port 8007) — WebSocket
```python
# FastAPI native WebSocket with connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}  # channel → connections

    async def connect(self, channel: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(channel, []).append(websocket)

    async def broadcast(self, channel: str, message: dict):
        for connection in self.active_connections.get(channel, []):
            await connection.send_json(message)
```

#### API Gateway (Port 8000)
- Token bucket rate limiter ★
- Correlation ID generation ★
- Health aggregation `/api/health/all` ★
- JWT validation at gateway level
- Reverse proxy via `httpx` to downstream services

---

### Phase 6: Frontend (Week 5-6)
##### [NEW] frontend/
React + Vite + Material UI — Pages: Flight Search, Booking Flow, Check-In, Baggage Tracking, Admin Dashboard, Login/Register

---

### Phase 7: Event-Driven Architecture (Week 6)

**Kafka Topics:**
```
aerolink.flight.created              aerolink.booking.created
aerolink.flight.updated              aerolink.booking.confirmed
aerolink.flight.status-changed       aerolink.booking.cancelled
aerolink.flight.pricing-updated      aerolink.booking.failed
aerolink.seat.availability-changed   aerolink.payment.processed
aerolink.passenger.registered        aerolink.payment.failed
aerolink.passenger.checked-in        aerolink.payment.refunded
aerolink.baggage.status-updated      aerolink.notification.email-sent

# Dead Letter Queues ★
aerolink.booking.confirmed.dlq
aerolink.notification.email-failed.dlq
```

---

### Phase 8: Security & Compliance (Week 6)

**RBAC Permission Matrix:**
| Endpoint | ADMIN | OPERATOR | GROUND_STAFF | PASSENGER |
|---|---|---|---|---|
| Manage flights | ✅ | ✅ | ❌ | ❌ |
| View all bookings | ✅ | ✅ | ❌ | ❌ |
| Create booking | ✅ | ❌ | ❌ | ✅ |
| Update baggage | ✅ | ✅ | ✅ | ❌ |
| Check-in | ✅ | ❌ | ✅ | ✅ |
| System health | ✅ | ❌ | ❌ | ❌ |

---

### Phase 9: Fault Tolerance (Week 7)
- Circuit breakers (pybreaker) on all inter-service calls
- Retry with exponential backoff + jitter
- Bulkhead pattern ★
- Graceful shutdown ★
- Kubernetes HPA, PDB, Network Policies

---

### Phase 10: Monitoring & Observability (Week 7)
- structlog → stdout → CloudWatch
- prometheus-client → Prometheus → Grafana dashboards
- OpenTelemetry → Jaeger distributed tracing ★
- Alerting rules for error rate, latency, consumer lag

---

### Phase 11: Testing (Week 8)

**Unit Tests (pytest + pytest-asyncio):**
```python
# tests/unit/test_flight_service.py
import pytest
from unittest.mock import AsyncMock
from app.services.flight_service import FlightService

@pytest.mark.asyncio
async def test_create_flight_success():
    db = AsyncMock()
    service = FlightService(db)
    flight = await service.create(FlightCreate(
        flight_number="AL1234",
        origin_airport="LHR",
        destination_airport="JFK",
        departure_time=datetime(2026, 7, 1, 10, 0),
        arrival_time=datetime(2026, 7, 1, 18, 0),
        total_seats=200,
        base_price=499.99,
    ))
    assert flight.flight_number == "AL1234"
    assert flight.available_seats == 200
```

**Integration Tests (httpx + TestClient):**
```python
# tests/integration/test_flight_routes.py
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_search_flights():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/flights?origin=LHR&page=1&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "pagination" in data
```

**Load Testing (Locust):**
```python
# testing/locust/locustfile.py
from locust import HttpUser, task, between

class AeroLinkUser(HttpUser):
    wait_time = between(1, 5)

    @task(3)
    def search_flights(self):
        self.client.get("/api/v1/flights?origin=LHR&destination=JFK")

    @task(1)
    def create_booking(self):
        self.client.post("/api/v1/bookings", json={...}, headers={"Authorization": f"Bearer {self.token}"})
```

**Postman + Newman:** Full collection with test assertions on every endpoint.

---

### Phase 12: Kubernetes + Terraform (Week 8)

**Kubernetes Deployment Example:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flight-service
  namespace: aerolink
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    spec:
      containers:
        - name: flight-service
          image: aerolink/flight-service:latest
          ports:
            - containerPort: 8001
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secrets
                  key: flight-db-url
          livenessProbe:           # ★
            httpGet:
              path: /health/live
              port: 8001
            initialDelaySeconds: 10
            periodSeconds: 15
          readinessProbe:          # ★
            httpGet:
              path: /health/ready
              port: 8001
            initialDelaySeconds: 5
            periodSeconds: 10
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
```

---

### Phase 13: Lambda Functions (Week 6-7)
Python Lambda handlers for: boarding pass generation, confirmation emails, schedule sync.

### Phase 14: External Mocks ★ (Week 4)
FastAPI mock services for airport API, immigration API, payment gateway.

### Phase 15: CI/CD (Week 2, refined)
GitHub Actions: lint (ruff) → type check (mypy) → test (pytest) → build Docker → push.

### Phase 16: Report + Presentation (Weeks 9-10)
Report PDF (35-45 pages), diagrams, test evidence, 15-min presentation + viva prep.

---

## Beyond-Rubric Enhancements Summary

| # | Enhancement | Implementation | Status |
|---|---|---|---|
| 1 | Token Bucket Rate Limiting | `api_gateway/middleware/rate_limiter.py` | Planned |
| 2 | Correlation ID Tracing | `shared/middleware/correlation_id.py` | Planned |
| 3 | Idempotency Keys | `booking_service/middleware/idempotency.py` | Planned |
| 4 | Dead Letter Queue (DLQ) | `shared/kafka/dlq_handler.py` | Planned |
| 5 | Health Aggregation Dashboard | `api_gateway/services/health_aggregator.py` | Planned |
| 6 | Graceful Shutdown | `shared/utils/graceful_shutdown.py` | Planned |
| 7 | Connection Pooling | `shared/db/session.py` (SQLAlchemy pool) | Planned |
| 8 | Pydantic Strict Validation | `extra="forbid"` on all schemas | Planned |
| 9 | Pagination, Filtering, Sorting | `shared/utils/pagination.py` + query params | Planned |
| 10 | ETag Conditional Requests | `flight_service/api/routes.py` | Planned |
| 11 | OpenTelemetry Instrumentation | All services via `opentelemetry-sdk` | Planned |
| 12 | Feature Flags | `shared/utils/feature_flags.py` | Planned |
| 13 | Audit Trail | `shared/utils/audit.py` | Planned |
| 14 | Consistent Error Format | `shared/middleware/error_handler.py` | Planned |
| 15 | Liveness vs Readiness Probes | `shared/health/` | Planned |

---

## Open Questions

> [!IMPORTANT]
> 1. **AWS Account**: Do you have an AWS account, or should everything run purely local with Docker?
> 2. **Semester 1**: Did you build anything last semester that we should carry forward?

---

## Verification Plan

### Automated Tests
- `pytest` across all services → 80%+ coverage
- `npx newman run` → all Postman tests green
- `locust` → load/stress test reports generated
- `docker compose up` → entire system starts without errors
- `ruff check` → no linting errors
- `mypy` → no type errors
- GitHub Actions CI → green pipeline

### Manual Verification
- Complete booking flow via frontend (search → book → pay → confirm)
- Real-time baggage tracking via WebSocket in browser
- Kill a service → circuit breaker activates → service recovers
- Swagger UI accessible on every service (`/api-docs`)
- Grafana dashboard showing live metrics
- Admin dashboard with RBAC (different views per role)
- Jaeger showing distributed traces across services

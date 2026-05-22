# 🎯 COMP60010 — Full Marks Masterplan (Python/FastAPI Edition)
## AeroLink Airline Systems Platform — Enterprise Cloud & Distributed Web Applications (Semester 2)

> **Module:** COMP60010 · **Weight:** 50% of module mark · **Deadline:** Thursday 11 June 2026 (23:59)
>
> **Learning Outcomes Assessed:**
> - LO3: Design, implement and test a web application based on the cloud and cloud services
> - LO4: Develop, implement and test a distributed web application utilising an API

---

## 📊 Assessment Weightage Overview

| Component | Weight | What It Really Means |
|---|---|---|
| **Architecture Design** | 20% | Your diagrams, justifications, and cloud-native thinking |
| **Implementation** | 40% | Working code — microservices, APIs, cloud integrations |
| **Testing & Results** | 20% | Unit, integration, performance tests with evidence |
| **Presentation & Viva** | 20% | 15-min slides + live Q&A defending your decisions |

> [!IMPORTANT]
> **Implementation alone is 40%** — this is where most marks live. But examiners use the report & presentation to verify you *understand* what you built. A working system with a weak report will still lose significant marks.

---

## 🐍 Technology Stack — Python Ecosystem

| Layer | Technology | Why |
|---|---|---|
| **Web Framework** | **FastAPI** | Async, auto-generates Swagger/OpenAPI docs, Pydantic validation built-in, best-in-class for Python microservices |
| **ASGI Server** | **Uvicorn** | High-performance async server |
| **ORM** | **SQLAlchemy 2.0 (async)** | Industry-standard, type-annotated, async support |
| **Migrations** | **Alembic** | Version-controlled schema changes |
| **Validation** | **Pydantic v2** | Zero-effort validation + JSON schema generation — comes free with FastAPI |
| **Auth** | **python-jose + passlib[bcrypt]** | JWT tokens + password hashing |
| **HTTP Client** | **httpx** | Async HTTP for inter-service communication |
| **Kafka** | **aiokafka** | Async Kafka producer/consumer |
| **WebSocket** | **FastAPI WebSocket** | Native async WebSocket support |
| **Circuit Breaker** | **pybreaker** | Circuit breaker pattern |
| **Caching** | **redis-py (async)** | Async Redis client |
| **DynamoDB** | **aioboto3** | Async AWS SDK |
| **Logging** | **structlog** | Structured JSON logging |
| **Tracing** | **opentelemetry-sdk** | Distributed tracing |
| **Metrics** | **prometheus-client** | Prometheus metrics |
| **Testing** | **pytest + pytest-asyncio + httpx** | Async-aware testing |
| **Load Testing** | **Locust** | Python-native load testing |
| **Linting** | **ruff** | Ultra-fast linter + formatter |
| **Type Checking** | **mypy** | Static type analysis |
| **Frontend** | **React (Vite) + Material UI** | Industry-standard SPA |
| **Containerisation** | **Docker + Kubernetes (EKS)** | Required by assignment |
| **IaC** | **Terraform** | Infrastructure as Code |
| **CI/CD** | **GitHub Actions** | Free, easy pipeline |
| **Monitoring** | **Prometheus + Grafana + Jaeger** | Metrics, dashboards, tracing |

> [!TIP]
> **Why FastAPI is perfect for this assignment:**
> 1. Auto-generates **Swagger UI** at `/api-docs` — assignment requires API documentation
> 2. **Pydantic** models = automatic request validation + JSON schema — no extra work
> 3. Native **async/await** = high-performance, non-blocking I/O
> 4. Native **WebSocket** support = real-time updates without extra libraries
> 5. **Dependency injection** = clean, testable architecture

---

## 🏗️ COMPONENT 1: Architecture Design (20%)

### What the Examiner Expects
- Professional-grade architectural diagrams (not hand-drawn sketches)
- Clear justification for **every** technology choice
- Evidence you understand cloud-native patterns, not just buzzwords
- Explicit mapping of AeroLink's business requirements to architectural decisions

### Task 1: Cloud-Based Web Application Design

#### 1.1 Microservices Architecture
**What to do:**
- Decompose AeroLink's monolith into **7 distinct microservices + 1 frontend**:
  - **Flight Service** — flight schedules, routes, pricing, seat availability
  - **Booking Service** — reservations, ticketing, Saga orchestration
  - **Passenger Service** — profiles, check-in, auth, GDPR compliance
  - **Baggage Service** — tracking, status updates (DynamoDB)
  - **Payment Service** — payment processing, refunds, PCI-DSS audit trail
  - **Notification Service** — email/event notifications (event-driven)
  - **Realtime Service** — WebSocket server, Kafka→client bridge
  - **API Gateway** — routing, auth, rate limiting, correlation IDs

> [!TIP]
> Mention **domain-driven design (DDD)** explicitly — each microservice owns its own bounded context and data store. This terminology impresses examiners.

**Key points to address:**
- Each service has its own database (**Database-per-Service pattern**)
- Services communicate via REST APIs (synchronous) and Kafka (asynchronous)
- Service discovery (Kubernetes DNS or AWS Cloud Map)
- Clear API contracts via Pydantic schemas and OpenAPI specs

#### 1.2 Containerisation
**What to do:**
- **Docker**: Multi-stage `Dockerfile` for each service
- **Docker Compose**: `docker-compose.yml` for local development
- **Kubernetes (EKS)**: Production deployment with:
  - Deployments + ReplicaSets (3 replicas per service)
  - Services (ClusterIP internal, LoadBalancer for gateway)
  - ConfigMaps and Secrets
  - Horizontal Pod Autoscaler (HPA)
  - Namespaces (dev, staging, prod)
  - Network Policies for service isolation
  - Pod Disruption Budgets

> [!IMPORTANT]
> You MUST have actual Dockerfiles and Kubernetes manifests (YAML files) in your source code submission.

#### 1.3 Serverless Computing
**AWS Lambda use cases (Python handlers):**
- **Boarding pass generator** — triggered by check-in event, generates PDF, uploads to S3
- **Booking confirmation email** — triggered by booking.confirmed event
- **Flight schedule sync** — scheduled Lambda, syncs from external airport API

**Justify why serverless here and containers elsewhere** — this shows architectural maturity.

#### 1.4 Cloud-Managed Databases
| Service | Database | Why |
|---|---|---|
| Flight Service | **Amazon Aurora (PostgreSQL)** | Relational, ACID, complex queries on schedules/routes |
| Booking Service | **Amazon Aurora (PostgreSQL)** | Transactions, Saga state tracking |
| Passenger Service | **Amazon Aurora (PostgreSQL)** | User data, auth, GDPR compliance |
| Baggage Service | **Amazon DynamoDB** | NoSQL, high-throughput reads for tracking |
| Payment Service | **Amazon Aurora (PostgreSQL)** | ACID transactions for financial data |
| Caching | **Amazon ElastiCache (Redis)** | Flight search cache, session management, idempotency keys |
| Documents | **Amazon S3** | Boarding passes, export files |

#### 1.5 High Availability, Multi-Region, Horizontal Scalability
- **High Availability**: Multi-AZ deployment, RDS Multi-AZ failover, EKS across AZs
- **Multi-Region**: Route 53 latency-based routing, DynamoDB Global Tables, Aurora Global Database
- **Horizontal Scalability**: Kubernetes HPA, ALB, read replicas

#### 1.6 Required Diagrams

| Diagram | Tool | Purpose |
|---|---|---|
| **C4 Level 1 (System Context)** | draw.io / Structurizr | AeroLink system + external actors |
| **C4 Level 2 (Container)** | draw.io / Structurizr | All microservices, databases, Kafka |
| **C4 Level 3 (Component)** | draw.io | Internal structure of 2+ key services |
| **AWS Architecture** | draw.io + AWS icons | Full cloud deployment diagram |
| **Deployment** | draw.io | K8s pods across AZs |
| **Data Flow** | draw.io | Booking request flow through system |
| **Sequence Diagrams** | PlantUML / Mermaid | Booking, check-in, baggage tracking flows |
| **ER Diagrams** | dbdiagram.io | Database schema per service |

> [!CAUTION]
> **Missing diagrams = instant mark loss.** Every diagram must have an accompanying paragraph explaining design decisions.

---

## 🖥️ COMPONENT 2: Implementation (40%)

### Task 2: Distributed Web Application and API Design

#### 2.1 Microservices Implementation (FastAPI)

**Each microservice follows this structure:**
```
service_name/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, lifespan, middleware
│   ├── api/
│   │   ├── routes.py         # APIRouter with endpoints
│   │   ├── schemas.py        # Pydantic request/response models
│   │   └── dependencies.py   # Depends() injections
│   ├── core/
│   │   ├── config.py          # pydantic-settings for env config
│   │   ├── security.py        # Auth dependencies
│   │   └── exceptions.py      # Custom AppError classes
│   ├── models/                # SQLAlchemy ORM models
│   ├── services/              # Business logic layer
│   ├── events/                # Kafka producer/consumer
│   ├── health/                # Liveness + readiness probes
│   └── db/                    # Session factory, base model
├── alembic/                   # Database migrations
├── seeds/                     # Test data
├── Dockerfile
├── requirements.txt
├── pyproject.toml
└── tests/
    ├── conftest.py            # Fixtures
    ├── unit/
    └── integration/
```

**For each microservice, implement:**
- RESTful CRUD endpoints via FastAPI `APIRouter`
- Pydantic v2 models for all request/response validation (`extra="forbid"`)
- Async database operations via SQLAlchemy 2.0
- Structured JSON logging via structlog
- Health check endpoints (`/health/live`, `/health/ready`)
- Graceful shutdown via `lifespan` context manager
- Prometheus metrics at `/metrics`
- Swagger UI auto-generated at `/api-docs`

#### 2.2 API Gateway
**Features:**
- JWT validation (python-jose)
- Token bucket rate limiting ★
- Correlation ID generation ★
- Reverse proxy to downstream services (httpx)
- Health aggregation endpoint ★
- CORS handling
- API versioning (`/api/v1/`)

#### 2.3 API Documentation (Swagger/OpenAPI)
FastAPI generates this **automatically** from your Pydantic schemas:
```python
app = FastAPI(
    title="AeroLink Flight Service",
    description="Manages flights, routes, and seat availability",
    version="1.0.0",
    docs_url="/api-docs",       # Swagger UI
    redoc_url="/api-redoc",     # ReDoc alternative
)
```

> [!TIP]
> FastAPI auto-generates OpenAPI 3.1 specs. Include screenshots of the Swagger UI in your report. Also export the `openapi.json` file and include it in your submission.

#### 2.4 Event-Driven Architecture (Kafka)
**Implement with aiokafka:**
```python
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer
import json

class EventProducer:
    def __init__(self, bootstrap_servers: str):
        self.producer = AIOKafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda v: json.dumps(v, default=str).encode(),
        )

    async def publish(self, topic: str, event: dict, correlation_id: str = None):
        headers = [("X-Correlation-ID", correlation_id.encode())] if correlation_id else []
        await self.producer.send_and_wait(topic, value=event, headers=headers)
```

**Kafka Topics:**
```
aerolink.flight.created           aerolink.booking.confirmed
aerolink.flight.status-changed    aerolink.booking.cancelled
aerolink.seat.availability        aerolink.payment.processed
aerolink.baggage.status-updated   aerolink.passenger.checked-in
```

#### 2.5 Secure Service-to-Service Communication
- JWT-based service tokens for inter-service auth
- Kubernetes Network Policies to restrict traffic
- HTTPS everywhere (nginx TLS termination)

---

### Task 3: Data Security, Compliance, and Consistency

#### 3.1 Encryption
- **At rest**: RDS encryption (AWS KMS), DynamoDB encryption, S3 bucket encryption
- **In transit**: TLS 1.2+ everywhere
- **Passwords**: passlib + bcrypt (12 rounds)
```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed = pwd_context.hash(password)
verified = pwd_context.verify(plain_password, hashed)
```

#### 3.2 Authentication & Authorisation
```python
# JWT creation with python-jose
from jose import jwt
from datetime import datetime, timedelta, timezone

def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=15)):
    to_encode = data.copy()
    to_encode["exp"] = datetime.now(timezone.utc) + expires_delta
    return jwt.encode(to_encode, SECRET_KEY, algorithm="RS256")

# RBAC dependency
async def require_role(*roles: Role):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker

# Usage in route
@router.post("/", dependencies=[Depends(require_role(Role.ADMIN))])
async def create_flight(flight: FlightCreate, db: AsyncSession = Depends(get_db)):
    ...
```

#### 3.3 Compliance (GDPR & PCI-DSS)
| Regulation | Requirement | Implementation |
|---|---|---|
| **GDPR** | Right to erasure | `DELETE /api/v1/passengers/me` → anonymise PII |
| **GDPR** | Data minimisation | Only collect necessary passenger data |
| **GDPR** | Consent management | `consent_records` table, opt-in tracking |
| **GDPR** | Data portability | `GET /api/v1/passengers/me/data-export` → JSON |
| **PCI-DSS** | Card data security | Never store raw card numbers; tokenisation |
| **PCI-DSS** | Network segmentation | Payment service in isolated K8s namespace |
| **PCI-DSS** | Audit logging | Complete audit trail on payment operations ★ |

#### 3.4 Data Consistency — Saga Pattern
**Implement a choreography-based Saga for booking:**
```python
class BookingSaga:
    async def execute(self, request: BookingCreate) -> Booking:
        steps_completed = []
        try:
            await self._reserve_seat(request.flight_id, request.seat_id)
            steps_completed.append("SEAT_RESERVED")
            payment = await self._process_payment(request.payment)
            steps_completed.append("PAYMENT_PROCESSED")
            booking = await self._confirm_booking(request, payment.id)
            steps_completed.append("BOOKING_CONFIRMED")
            return booking
        except Exception:
            await self._compensate(steps_completed, request)
            raise
```

> [!IMPORTANT]
> Actually implementing the Saga pattern will significantly boost marks. Don't just write about it — code it.

---

### Task 4: Real-Time Data Synchronisation

**FastAPI WebSocket implementation:**
```python
from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        self.channels: dict[str, list[WebSocket]] = {}

    async def connect(self, channel: str, ws: WebSocket):
        await ws.accept()
        self.channels.setdefault(channel, []).append(ws)

    async def broadcast(self, channel: str, data: dict):
        for ws in self.channels.get(channel, []):
            await ws.send_json(data)

manager = ConnectionManager()

@app.websocket("/ws/flights/{flight_id}")
async def flight_updates(websocket: WebSocket, flight_id: str):
    await manager.connect(f"flight:{flight_id}", websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep alive
    except WebSocketDisconnect:
        manager.disconnect(f"flight:{flight_id}", websocket)
```

**Pipeline:** Service → Kafka event → Realtime Service consumer → WebSocket broadcast to clients

---

### Task 5: Fault Tolerance and Resilience

#### Circuit Breaker (pybreaker)
```python
import pybreaker

payment_breaker = pybreaker.CircuitBreaker(
    fail_max=5,
    reset_timeout=30,
    name="payment-service",
)

@payment_breaker
async def call_payment_service(payment_data: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post("http://payment-service:8005/api/v1/payments", json=payment_data)
        response.raise_for_status()
        return response.json()
```

#### Retry with Exponential Backoff
```python
import asyncio, random

async def retry_with_backoff(func, max_retries=3, base_delay=1.0):
    for attempt in range(max_retries):
        try:
            return await func()
        except Exception:
            if attempt == max_retries - 1:
                raise
            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
            await asyncio.sleep(delay)
```

#### Additional Resilience
- Kubernetes HPA for auto-scaling
- ALB / Ingress for load balancing
- Pod Disruption Budgets
- Multi-AZ deployment
- Database failover (RDS Multi-AZ)

---

### Task 7: Monitoring and Observability

| Pillar | Tool | Implementation |
|---|---|---|
| **Logging** | structlog | Structured JSON, correlation IDs, stdout → CloudWatch |
| **Metrics** | prometheus-client | Request rate, error rate, latency (p50/p95/p99) |
| **Tracing** | OpenTelemetry → Jaeger | Trace requests across multiple services ★ |

**Prometheus metrics in FastAPI:**
```python
from prometheus_client import Counter, Histogram, make_asgi_app

REQUEST_COUNT = Counter("http_requests_total", "Total requests", ["method", "endpoint", "status"])
REQUEST_LATENCY = Histogram("http_request_duration_seconds", "Request latency", ["method", "endpoint"])

# Mount metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
```

---

## 🧪 COMPONENT 3: Testing & Results (20%)

### Task 6: Performance and Scalability Testing

#### Load Testing (Locust — Python-native)
```python
from locust import HttpUser, task, between

class AeroLinkUser(HttpUser):
    wait_time = between(1, 5)

    def on_start(self):
        # Login and get token
        response = self.client.post("/api/v1/passengers/login", json={
            "email": "test@aerolink.com", "password": "testpass123"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    @task(5)
    def search_flights(self):
        self.client.get("/api/v1/flights?origin=LHR&destination=JFK", headers=self.headers)

    @task(2)
    def get_flight_details(self):
        self.client.get("/api/v1/flights/some-uuid", headers=self.headers)

    @task(1)
    def create_booking(self):
        self.client.post("/api/v1/bookings", json={
            "flight_id": "...", "seat_class": "ECONOMY"
        }, headers=self.headers)
```

**Test Scenarios:**
- Load test: 100 → 300 users over 5 minutes
- Stress test: ramp to 500+ users
- Spike test: 50 → 500 sudden burst

**Metrics to Report:** avg latency, p95, p99, throughput (req/s), error rate, resource utilisation

### Task 8: Testing Strategy

#### Unit Tests (pytest + pytest-asyncio)
```python
import pytest
from unittest.mock import AsyncMock
from app.services.flight_service import FlightService

@pytest.mark.asyncio
async def test_create_flight_validates_airports():
    db = AsyncMock()
    service = FlightService(db)
    with pytest.raises(AppError, match="INVALID_AIRPORT"):
        await service.create(FlightCreate(origin_airport="ZZZ", ...))

@pytest.mark.asyncio
async def test_search_flights_paginates():
    db = AsyncMock()
    service = FlightService(db)
    result = await service.search(db, page=2, limit=10)
    assert result.pagination["page"] == 2
```

**Target: 80%+ code coverage** with `pytest --cov=app --cov-report=html`

#### Integration Tests (httpx AsyncClient)
```python
@pytest.mark.asyncio
async def test_booking_flow_happy_path():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Search flights
        response = await client.get("/api/v1/flights?origin=LHR")
        assert response.status_code == 200
        flight_id = response.json()["data"][0]["id"]

        # Create booking
        response = await client.post("/api/v1/bookings", json={"flight_id": flight_id, ...},
            headers={"Authorization": f"Bearer {test_token}", "Idempotency-Key": "test-key-1"})
        assert response.status_code == 201
```

#### API Tests (Postman + Newman)
- Postman collection with test assertions on every endpoint
- Newman CLI for automated execution with HTML reports

---

## 🎤 COMPONENT 4: Presentation & Viva (20%)

### Slides (15 minutes)
| Slide(s) | Content | Time |
|---|---|---|
| 1 | Title + Details | 30s |
| 2-3 | Problem Statement & AeroLink Overview | 1 min |
| 4-6 | Architecture Design (C4, AWS diagrams) | 3 min |
| 7-9 | Implementation Demo (FastAPI, Kafka, Saga) | 3 min |
| 10-11 | Security, Compliance, Data Consistency | 2 min |
| 12-13 | Real-Time Sync & Fault Tolerance | 2 min |
| 14 | Testing Results & Performance | 2 min |
| 15-16 | Monitoring, Challenges, Future Work | 1.5 min |

### Live Demo Script (3-4 min)
```
1. docker compose up → all services starting (10s)
2. Open /api-docs → show auto-generated Swagger (20s)
3. Search flights via frontend → show results (30s)
4. Book a flight → show Saga executing (1 min)
5. WebSocket → show real-time seat availability update (30s)
6. Kill a service → circuit breaker activates (30s)
7. Grafana → live metrics dashboard (30s)
8. Jaeger → distributed trace across services (30s)
```

### Viva Preparation
Common questions and what to answer:
1. *"Why FastAPI over Flask/Django?"* → Async, auto Swagger, Pydantic validation, dependency injection, performance
2. *"Why SQLAlchemy 2.0?"* → Async support, type annotations, industry standard
3. *"How does the Saga pattern handle failures?"* → Compensating transactions, step tracking
4. *"How do you ensure no data loss in Kafka?"* → Acknowledgments, DLQ for failed messages
5. *"Explain the circuit breaker"* → pybreaker, fail_max, reset_timeout, prevents cascade failures
6. *"How does RBAC work?"* → JWT claims contain role, FastAPI `Depends()` checks permissions
7. *"What security measures protect payment data?"* → Tokenisation, network isolation, audit trail, PCI-DSS

> [!CAUTION]
> The viva filters genuine work from copy-paste. If you cannot explain your code confidently, you will lose marks.

---

## 📄 Deliverables Checklist

### 1. Final Report (PDF)
- [ ] Title page, table of contents, executive summary
- [ ] Architecture design with ALL required diagrams
- [ ] Technology justification (with Python/FastAPI reasoning)
- [ ] Security and compliance (GDPR, PCI-DSS, encryption, auth)
- [ ] Data consistency (Saga, CQRS, eventual consistency)
- [ ] Implementation overview with code snippets
- [ ] Real-time sync with evidence
- [ ] Fault tolerance documented
- [ ] Monitoring with Grafana screenshots
- [ ] Testing: unit, integration, API test evidence
- [ ] Performance: Locust results with graphs
- [ ] Challenges and future improvements
- [ ] 20-30 references (Harvard/IEEE)
- [ ] Appendices

### 2. Source Code (ZIP)
- [ ] All microservice source code (clean, typed, documented)
- [ ] `Dockerfile` for each service (multi-stage)
- [ ] `docker-compose.yml` + `docker-compose.infra.yml`
- [ ] Kubernetes manifests (`k8s/`)
- [ ] Terraform files (`infrastructure/`)
- [ ] `openapi.json` exported from each service
- [ ] Postman collection (`.json`)
- [ ] `requirements.txt` per service + `pyproject.toml`
- [ ] Alembic migrations
- [ ] `.env.example` files
- [ ] `README.md` with setup instructions
- [ ] Test files with coverage reports
- [ ] `.github/workflows/` CI pipeline

### 3. Presentation Slides
- [ ] 15-minute presentation (professional design)
- [ ] Architecture diagrams embedded
- [ ] Demo screenshots/GIFs
- [ ] Key metrics visualised

---

## 🗓️ Suggested Timeline (10 Weeks: Apr 10 → Jun 11)

| Week | Dates | Focus |
|---|---|---|
| **1** | Apr 10 – Apr 17 | Architecture design, diagrams, shared library, Docker setup |
| **2** | Apr 17 – Apr 24 | Flight Service + Booking Service implementation |
| **3** | Apr 24 – May 1 | Passenger Service + Baggage Service |
| **4** | May 1 – May 8 | Payment + Notification + External Mocks |
| **5** | May 8 – May 15 | API Gateway + Realtime Service + Frontend start |
| **6** | May 15 – May 22 | Event-driven (Kafka) + Real-time (WebSocket) + Security |
| **7** | May 22 – May 29 | Fault tolerance + Monitoring (Prometheus/Grafana/Jaeger) |
| **8** | May 29 – Jun 5 | Testing (pytest, Postman, Locust) + K8s + Terraform |
| **9** | Jun 5 – Jun 9 | Write report, prepare presentation |
| **10** | Jun 9 – Jun 11 | Final review, polish, submit |

---

## 🏆 Mark-Maximising Best Practices

### Report
1. **Be specific:** "Each FastAPI service uses SQLAlchemy 2.0 async sessions with a pool of 20 connections, `pool_pre_ping=True` for health checking, and `pool_recycle=3600` to prevent stale connections."
2. **Every claim needs evidence:** screenshot, code snippet, metric, or test result.
3. **Proper academic writing** — third person, formal tone, referenced.
4. **35-45 pages** (excluding appendices).

### Code
1. **Type hints everywhere** — FastAPI + Pydantic enforce this naturally
2. **Async all the way** — async endpoints, async DB, async Kafka, async HTTP
3. **Pydantic `model_config = {"extra": "forbid"}`** — reject unknown fields
4. **`pyproject.toml`** — modern Python packaging
5. **ruff** for linting — one tool replaces flake8, isort, pyflakes, etc.

### Presentation
1. **Demo the system WORKING** — 30 seconds of live demo beats 5 slides
2. **Know your numbers** — response times, throughput, coverage %
3. **Anticipate "why" questions** — not just "what"

---

## ⚡ Quick Wins (High Impact, Low Effort)

| Quick Win | Impact | Effort |
|---|---|---|
| FastAPI auto-generates Swagger UI | Shows professionalism | **Zero** (built-in) |
| Pydantic `extra="forbid"` | Shows security awareness | Very Low |
| Docker Compose spins everything up | Demonstrates containerisation | Medium |
| `/health/live` + `/health/ready` | Shows production-readiness | Low |
| structlog JSON logging | Shows observability thinking | Low |
| Postman collection with tests | Testing evidence | Medium |
| Correlation ID via middleware | Shows distributed systems knowledge | Medium |
| `.env.example` + `README.md` | Shows engineering maturity | Very Low |
| `pytest --cov` reports | Testing evidence | Low |
| Consistent error response model | Shows API design skills | Low |
| Type hints + ruff + mypy | Shows code quality | Low |

---

## 🚀 ENHANCEMENTS FOR 100% — Beyond the Rubric

### Enhancement 1: You NEED a Frontend — It Says "Web Application"

> [!CAUTION]
> LO3 says *"Design, implement and test a **web application**"* — you need a user-facing frontend.

**Build a React (Vite) + Material UI frontend with 3-4 key flows:**
1. Flight Search & Booking (search → select → book → pay → confirm)
2. Passenger Check-in (booking ref → check-in → boarding pass)
3. Baggage Tracking (real-time WebSocket updates)
4. Admin Dashboard (flight management, system health, RBAC views)

---

### Enhancement 2: CI/CD Pipeline (GitHub Actions)

```yaml
name: CI Pipeline
on:
  push:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [flight_service, booking_service, passenger_service, baggage_service, payment_service]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -e shared/
      - run: pip install -r services/${{ matrix.service }}/requirements.txt
      - run: cd services/${{ matrix.service }} && ruff check .
      - run: cd services/${{ matrix.service }} && python -m pytest tests/ --cov=app --cov-report=xml
```

---

### Enhancement 3: Infrastructure as Code (Terraform)

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  name    = "aerolink-vpc"
  cidr    = "10.0.0.0/16"
  azs     = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  enable_nat_gateway = true
}
```

---

### Enhancement 4: Third-Party Integration Mocking
Mock external APIs (airport, immigration, payment gateway) as separate FastAPI services.

### Enhancement 5: API Versioning (`/api/v1/`)

### Enhancement 6: Advanced Patterns
| Pattern | Where | Why |
|---|---|---|
| **Saga** | Booking flow | Distributed transactions |
| **Outbox** ★ | DB + Kafka atomicity | Solves dual-write problem |
| **BFF** ★ | API Gateway | Frontend-specific API layer |
| **Bulkhead** ★ | Thread pool isolation | Prevents cascade failures |
| **Strangler Fig** | Report discussion | Migration strategy |

### Enhancement 7: Report Structure (35-45 pages)
See report structure in implementation plan.

### Enhancement 8: Academic References (20-30 minimum)
Key: Newman (Microservices), Kleppmann (Data-Intensive), Richardson (Patterns), AWS Well-Architected, Fowler (Microservices), GDPR, PCI-DSS v4.0.

### Enhancement 9: Live Demo Strategy
Script your demo. Have a backup recording. Test on the exact presentation machine.

### Enhancement 10: Environment Configuration
pydantic-settings for typed config, multiple environments, fail-fast validation.

### Enhancement 11: Database Migrations (Alembic)
Version-controlled schemas, seeds for test data.

### Enhancement 12: Grade-Band Differentiators

| Grade | What You Need |
|---|---|
| **70-79%** | 5+ services, Docker, K8s, Swagger, Kafka, JWT, RBAC, tests |
| **80-89%** | + Saga, circuit breakers, IaC, CI/CD, performance analysis |
| **90-95%** | + Frontend, outbox pattern, monitoring dashboards, OpenTelemetry, DLQ, idempotency, feature flags, correlation IDs, audit trail (Tier 1 complete) |
| **95-100%** | + PII masking, distributed locking, webhooks, app-level encryption, Helm charts, canary deployments (Tier 2+3) |

---

### Enhancement 13-15: (Covered Above)
See Enhancements 13 (Audit Trail), 14 (Consistent Error Format), 15 (Liveness/Readiness Probes) in Tier 1.

---

### 🟡 Tier 2 Enhancements — High Impact (Week 8)

### Enhancement 16: PII Masking in Logs ★

Auto-redact sensitive data (email, passport, card numbers) from all log output.

```python
import re
from structlog.types import EventDict

PII_PATTERNS = {
    "email": re.compile(r'[\w.-]+@[\w.-]+\.\w+'),
    "card_number": re.compile(r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b'),
    "passport": re.compile(r'\b[A-Z]{1,2}\d{6,9}\b'),
    "phone": re.compile(r'\b\+?\d{10,15}\b'),
}

def mask_pii(_, __, event_dict: EventDict) -> EventDict:
    """structlog processor that masks PII in log output."""
    for key, value in event_dict.items():
        if isinstance(value, str):
            for pii_type, pattern in PII_PATTERNS.items():
                value = pattern.sub(f"[REDACTED_{pii_type.upper()}]", value)
            event_dict[key] = value
    return event_dict
```

**Why it impresses:** Directly ties to GDPR. Shows you don't just *talk* about compliance — you built it into the logging pipeline.

---

### Enhancement 17: Distributed Locking (Redis) ★

Prevent double-booking race conditions with Redis-based distributed locks.

```python
import redis.asyncio as redis
from contextlib import asynccontextmanager

class DistributedLock:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    @asynccontextmanager
    async def acquire(self, resource: str, ttl: int = 10):
        lock_key = f"lock:{resource}"
        lock_id = str(uuid.uuid4())
        acquired = await self.redis.set(lock_key, lock_id, nx=True, ex=ttl)
        if not acquired:
            raise AppError("RESOURCE_LOCKED", f"{resource} is being modified", 409)
        try:
            yield lock_id
        finally:
            if await self.redis.get(lock_key) == lock_id.encode():
                await self.redis.delete(lock_key)

# Usage: async with lock.acquire(f"seat:{flight_id}:{seat_id}"):
```

**Why it impresses:** Solves a real concurrency problem. 5 lines of logic, massive impact.

---

### Enhancement 22: Webhook Callbacks ★

Send booking status updates to registered external partner systems.

```python
class WebhookRegistration(BaseModel):
    url: HttpUrl
    events: list[str]  # ["booking.confirmed", "booking.cancelled"]
    secret: str        # For HMAC signature verification

@router.post("/api/v1/webhooks/register")
async def register_webhook(webhook: WebhookRegistration):
    await webhook_service.register(db, webhook)

# On event: POST to registered URL with HMAC-signed payload
# Headers: X-AeroLink-Signature: sha256=...
```

**Why it impresses:** The assignment mentions "integration with third-party systems." Webhooks prove you thought about outbound integrations, not just inbound.

---

### 🟢 Tier 3 Enhancements — Bonus (Week 8-9, only if ahead of schedule)

### Enhancement 18: API Deprecation Headers ★
Add `Sunset` and `Deprecation` HTTP headers on old endpoints. Shows API lifecycle maturity.

### Enhancement 19: Request Size Limiting ★
Reject payloads > 1MB. Prevents DoS via large payloads. Starlette middleware, 10 lines.

### Enhancement 20: Helm Charts ★
Templated K8s deployments with `values.yaml` overrides for dev/staging/prod. Shows K8s depth.

### Enhancement 21: OpenAPI Client SDK Generation ★
Auto-generate Python client libraries from FastAPI’s OpenAPI spec using `openapi-python-client`. Include in `clients/` directory.

### Enhancement 23: Application-Level Encryption ★
Encrypt PII (passport, email) inside database fields using `cryptography.Fernet`. Goes beyond standard "encryption at rest."

### Enhancement 24: Canary Deployment Config ★
K8s manifests with canary rollout strategy — route 10% traffic to new version via nginx ingress annotations.

### Enhancement 25: Dependency Health Matrix ★
Visual map showing which services depend on which, and cascade failure analysis. Great for the report and admin dashboard.

---

### 📋 Master Checklist — "Zero Marks Lost" Audit

#### Architecture Design (20%)
- [ ] C4 L1/L2/L3 diagrams with explanations
- [ ] AWS Architecture diagram
- [ ] Sequence diagrams for key flows
- [ ] ER diagrams per service
- [ ] Technology justification table
- [ ] Multi-region + HA + scalability documented
- [ ] Dependency health matrix diagram ★

#### Implementation (40%)
- [ ] 7+ services implemented (FastAPI)
- [ ] API Gateway with JWT, rate limiting, correlation IDs
- [ ] Swagger UI auto-generated on every service
- [ ] Kafka event-driven messaging
- [ ] WebSocket real-time updates
- [ ] JWT auth + RBAC (4 roles)
- [ ] Saga pattern (booking flow)
- [ ] Circuit breaker (pybreaker)
- [ ] Dockerfile per service + docker-compose.yml
- [ ] Kubernetes manifests (deployments, HPA, probes)
- [ ] Frontend (React) with key user flows
- [ ] CI/CD (GitHub Actions)
- [ ] Terraform IaC
- [ ] Alembic migrations
- [ ] GDPR endpoints (delete, export)
- [ ] PCI-DSS audit logging
- [ ] Clean typed code (ruff + mypy clean)
- [ ] **Tier 1 enhancements** (15 items — all integrated)
- [ ] PII masking in logs ★ (Tier 2)
- [ ] Distributed locking for seat reservation ★ (Tier 2)
- [ ] Webhook callbacks to external systems ★ (Tier 2)
- [ ] Request size limiting ★ (Tier 3)
- [ ] Application-level field encryption ★ (Tier 3)
- [ ] API deprecation headers ★ (Tier 3)
- [ ] Helm charts ★ (Tier 3)
- [ ] Canary deployment manifests ★ (Tier 3)

#### Testing & Results (20%)
- [ ] pytest unit tests (80%+ coverage)
- [ ] Integration tests (httpx AsyncClient)
- [ ] Postman collection + Newman results
- [ ] Locust load/stress tests with graphs
- [ ] Performance analysis (latency, throughput, errors)
- [ ] Distributed lock prevents double-booking (test evidence)

#### Presentation & Viva (20%)
- [ ] 15-min slides (professional)
- [ ] Live demo (3-4 min scripted)
- [ ] Backup demo recording
- [ ] Prepared for "why" questions
- [ ] Know your numbers
- [ ] Can explain all 25 enhancements and their purpose

#### Report Quality
- [ ] Executive summary
- [ ] All diagrams captioned & numbered
- [ ] Critical evaluation section
- [ ] 20-30+ references
- [ ] No spelling/grammar errors
- [ ] Appendices with full test results
- [ ] Enhancement tiers documented with justification

---

> [!NOTE]
> **Final Word:** With 25 enhancements across 3 tiers, this project goes far beyond what any examiner expects from a student submission. **Tier 1 (15 items) is guaranteed.** Tier 2 (3 items) is very likely. Tier 3 (7 items) is attempted only if ahead of schedule. A flawless Tier 1+2 (18 enhancements) scores 95-100%. The plan shows ambition; the execution shows discipline. Both impress examiners.

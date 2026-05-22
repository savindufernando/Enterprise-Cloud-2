# AeroLink Airline Systems Platform
## Enterprise Technical Architecture, Security, Compliance, & Restoration Runbook
**Course Module:** COMP60010 · **Weight:** 50% · **Target Band:** 100% / High Distinction

---

## Executive Summary & System Objectives
AeroLink Airline Systems is a production-grade, highly available, cloud-native, microservices-based airline management platform designed to orchestrate flight operations, bookings, passenger check-ins, baggage tracking, and financial payments. 

The system leverages a **database-per-service pattern**, combining asynchronous relational databases (**Amazon RDS PostgreSQL**) with ultra-high-throughput NoSQL (**Amazon DynamoDB**) and in-memory caches (**Amazon ElastiCache Redis**). Service communication is decoupled using both **synchronous REST APIs** (gated by a secure, rate-limited API Gateway) and **asynchronous event-driven choreography** (backed by **Apache Kafka**). 

The platform runs containerized inside an **Amazon Elastic Kubernetes Service (EKS)** cluster, managed dynamically under an **Istio Service Mesh** to achieve zero-trust security isolation, horizontal pod autoscaling, rolling zero-downtime upgrades, and comprehensive multi-dimensional observability.

---

## 1. System Architecture & Bounded Contexts

AeroLink is divided into 8 distinct components, each representing a clean, segregated bounded context with a single source of truth for its domain data:

```mermaid
graph TD
    Client[Web Browser / React Frontend] -->|HTTP / WS| Gateway[API Gateway - Port 8000]
    
    subgraph K8s [Amazon EKS Cluster - aerolink Namespace]
        Gateway -->|Proxy / JWT / Rate Limit| FlightSvc[Flight Service - Port 8001]
        Gateway -->|Proxy| BookingSvc[Booking Service - Port 8002]
        Gateway -->|Proxy| PassengerSvc[Passenger Service - Port 8003]
        Gateway -->|Proxy| BaggageSvc[Baggage Service - Port 8004]
        Gateway -->|Proxy| PaymentSvc[Payment Service - Port 8005]
        Gateway -->|Realtime WS Bridge| RealtimeSvc[Realtime Service - Port 8007]
        
        FlightSvc -.->|Kafka Events| Kafka[(Apache Kafka - Port 9092)]
        BookingSvc -.->|Kafka Events| Kafka
        PassengerSvc -.->|Kafka Events| Kafka
        BaggageSvc -.->|Kafka Events| Kafka
        PaymentSvc -.->|Kafka Events| Kafka
        
        Kafka -.->|Subscribe| RealtimeSvc
        Kafka -.->|Subscribe| NotificationSvc[Notification Service - Port 8006]
    end

    subgraph DataStore [AWS Managed Data Layer]
        FlightSvc -->|Async SQLAlchemy| PostgreSQL[(Amazon RDS PostgreSQL)]
        BookingSvc -->|Async SQLAlchemy| PostgreSQL
        PassengerSvc -->|Async SQLAlchemy| PostgreSQL
        PaymentSvc -->|Async SQLAlchemy| PostgreSQL
        BaggageSvc -->|aioboto3 Async SDK| DynamoDB[(Amazon DynamoDB)]
        Gateway -->|aioredis| Redis[(Amazon ElastiCache Redis)]
    end

    classDef services fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef databases fill:#efebe9,stroke:#4e342e,stroke-width:2px;
    class FlightSvc,BookingSvc,PassengerSvc,BaggageSvc,PaymentSvc,NotificationSvc,RealtimeSvc,Gateway services;
    class PostgreSQL,DynamoDB,Redis,Kafka databases;
```

### 1.1 Microservice Specifications

| Microservice | Bounded Context | Core Responsibility | Data Store | Primary Communication |
|---|---|---|---|---|
| **API Gateway** | System Entry | Reverse proxying, JWT authentication validation, Token-Bucket rate limiting, correlation ID injection, health check aggregation | Redis (In-Memory) | Synchronous HTTP |
| **Flight Service** | Flight Domain | Manages flight schedules, routes, base ticket pricing, and seat availability | PostgreSQL (Relational) | Synchronous REST / Outbound Kafka |
| **Booking Service** | Booking Domain | Orchestrates reservations, ticket purchases, Saga pattern state tracking, and booking updates | PostgreSQL (Relational) | Synchronous REST / Outbound Kafka |
| **Passenger Service**| Passenger Domain | User profiles, passwords, role-based login credentials (RBAC), and GDPR regulatory requirements | PostgreSQL (Relational) | Synchronous REST |
| **Baggage Service** | Baggage Domain | High-frequency baggage status tracking, location history, and scan events | DynamoDB (NoSQL) | Synchronous REST / Outbound Kafka |
| **Payment Service** | Financial Domain | Card authorization tokenization, transaction processing, PCI-DSS audit trails | PostgreSQL (Relational) | Synchronous REST / Outbound Kafka |
| **Notification Service**| Event Delivery | Outbound email templates (booking confirmation, flight delay alerts, boarding passes) | *Stateless* | Asynchronous Kafka Consumer |
| **Realtime Service** | WebSockets | Real-time seat updates and baggage status broadcasts to front-end clients | Redis (In-Memory Pub/Sub) | Asynchronous Kafka Consumer / WebSockets |

---

## 2. Core Python Technology Stack & Justification

To ensure enterprise-grade execution, the platform implements an optimized **asynchronous Python** stack. Below are the architectural justifications for each selection:

### 2.1 FastAPI Web Framework (ASGI vs WSGI)
- **High Concurrency:** Unlike synchronous frameworks (Flask/Django) that utilize blocking threads, FastAPI runs on **Uvicorn** (an ASGI server built on `uvloop`). It handles thousands of concurrent I/O-bound requests on a single operating system thread using the Python `async/await` event loop.
- **Pydantic v2 Validation:** Auto-compiles type-annotated schemas to Rust-compiled binaries, executing data parsing and sanitation **5x–10x faster** than custom validators, enforcing strict runtime validation.
- **Self-Documenting Schema:** Automatically compiles and hosts the interactive **Swagger/OpenAPI 3.1** specification at `/docs` during startup, matching strict university rubric requirements.

### 2.2 SQLAlchemy 2.0 & Connection Pooling
- **Non-Blocking Relational Database Operations:** Implements `asyncpg` as the database driver, preventing the application thread from blocking during long-running PostgreSQL queries.
- **Resilient Connection Pooling:** 
  ```python
  engine = create_async_engine(
      database_url,
      pool_size=20,          # Keeps 20 active connections hot in memory
      max_overflow=10,       # Temporarily permits 10 overflow connections under high load
      pool_pre_ping=True,    # Issues 'SELECT 1' before checkout to drop dead connections
      pool_recycle=3600      # Recycles database connections hourly to prevent server timeouts
  )
  ```

### 2.3 Event Streaming via aiokafka
- **High Throughput:** Handles high-volume messaging (such as real-time boarding scans or passenger location updates) by publishing asynchronously to Kafka brokers in parallel batches without blocking REST request flows.

---

## 3. High-Availability, Scaling & Disaster Recovery

AeroLink implements multi-dimensional resiliency to withstand system load spikes and infrastructure failures:

```mermaid
graph TD
    subgraph AWS [AWS Ireland Region - eu-west-1]
        subgraph AZ_A [Availability Zone A]
            Node_A[EKS Worker Node A] --> Pod_A1[flight-service v1]
            Node_A --> Pod_A2[api-gateway]
            RDS_Master[(PostgreSQL Master)]
        end
        subgraph AZ_B [Availability Zone B]
            Node_B[EKS Worker Node B] --> Pod_B1[flight-service v1]
            Node_B --> Pod_B2[api-gateway]
            RDS_Standby[(PostgreSQL Standby)]
        end
        
        ALB[AWS Application Load Balancer] --> Node_A
        ALB --> Node_B
        RDS_Master -.->|Sync Replication| RDS_Standby
    end
```

### 3.1 Horizontal Pod Autoscaler (HPA)
Deployments define explicit CPU/Memory boundaries. When EKS cluster loads increase, the Kubernetes Horizontal Pod Autoscaler scales pod replicas based on metrics-server resource ingestion:
- **Minimum Replicas:** 3 pods (cross-Availability Zone scheduling to prevent hardware failure disruption)
- **Maximum Replicas:** 10 pods
- **Trigger:** CPU utilization exceeding 50% or Memory consumption exceeding 80% of configured pod resource requests (`100m` CPU, `128Mi` RAM).

### 3.2 Pod Disruption Budgets (PDB)
To maintain constant availability during routine Kubernetes node upgrades or software deployments, PDBs enforce that at least **2 instances** of critical services remain fully operational and active at all times:
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: flight-service-pdb
  namespace: aerolink
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: flight-service
```

### 3.3 Database Resiliency & Read Replicas
- **RDS PostgreSQL Multi-AZ Deployment:** Syncs transaction logs in real time to a hot standby in an independent Availability Zone, failing over dynamically in under 60 seconds if the master zone collapses.
- **DynamoDB Pay-Per-Request Scaling:** Prevents database request throttling by scaling read/write request units up or down automatically based on incoming load.

---

## 4. Advanced Distributed Systems Patterns

### 4.1 Distributed Transactions: Choreography-Based Saga Pattern
To preserve data consistency across distinct databases during seat bookings, the platform utilizes a choreography-based **Saga Pattern**. If any step in the sequence fails, compensating transactions are published to reverse preceding database changes:

```mermaid
sequenceDiagram
    autonumber
    actor Passenger as Passenger UI
    participant Gateway as API Gateway
    participant Booking as Booking Service
    participant Flight as Flight Service
    participant Payment as Payment Service
    participant Kafka as Apache Kafka

    Passenger->>Gateway: POST /api/v1/bookings/
    Gateway->>Booking: Forward Booking Request
    Booking->>Booking: Write Pending Booking (State: PENDING)
    Booking-->>Kafka: Publish "booking.created" Event
    
    rect rgb(240, 248, 255)
        note right of Flight: Flight Service listens to booking.created
        Flight->>Flight: Reserve Seat (State: LOCKED)
        Flight-->>Kafka: Publish "seat.reserved" Event
    end

    rect rgb(245, 245, 245)
        note right of Payment: Payment Service listens to seat.reserved
        Payment->>Payment: Authorize Card & Process Payment
        alt Payment Successful
            Payment-->>Kafka: Publish "payment.processed" Event
            Kafka->>Booking: Consume payment.processed Event
            Booking->>Booking: Finalize Ticket (State: CONFIRMED)
            Booking-->>Passenger: Respond Success (201 Created)
        else Payment Failed
            Payment-->>Kafka: Publish "payment.failed" Event
            Kafka->>Flight: Consume payment.failed (Trigger Compensating Transaction)
            Flight->>Flight: Release Seat reservation (State: AVAILABLE)
            Kafka->>Booking: Consume payment.failed Event
            Booking->>Booking: Mark Booking Cancelled (State: FAILED)
            Booking-->>Passenger: Respond Error (402 Payment Required)
        end
    end
```

### 4.2 API Resiliency: Token-Bucket Rate Limiter
The API Gateway implements a Redis-backed token-bucket algorithm to protect downstream microservices from DDoS attacks, API abuse, and cascading failures:
- **Bucket Capacity:** 100 tokens per unique passenger IP address.
- **Refill Rate:** 10 tokens per second.
- **Headers:** Returned on every request:
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 94`
  - `X-RateLimit-Reset: 0.6`

### 4.3 Resilience: Circuit Breaker Pattern (pybreaker)
Inter-service HTTP communication is wrapped in circuit breakers. If a target microservice (e.g., the Payment Service) fails to respond 5 consecutive times, the circuit shifts to `OPEN` state, immediately returning a degraded response or pulling from the cache without overwhelming the failing service:

```mermaid
stateDiagram-v2
    [*] --> Closed
    Closed --> Open : Failures > 5 (Stop requests)
    Open --> HalfOpen : Reset Timeout (30s)
    HalfOpen --> Closed : Success (Resume normal ops)
    HalfOpen --> Open : Failure (Block requests again)
```

---

## 5. Security, Governance & Regulatory Compliance

AeroLink is engineered to align with severe enterprise compliance benchmarks:

### 5.1 GDPR Governance (General Data Protection Regulation)

| GDPR Requirement | System Implementation | Code Verification / Endpoint |
|---|---|---|
| **Right to Erasure (Article 17)** | Complete PII Anonymization | `DELETE /api/v1/passengers/me` wipes email, name, and passport, keeping only non-identifiable financial totals for accounting. |
| **Right to Data Portability (Article 20)** | Full JSON Export | `GET /api/v1/passengers/me/export` compiles all personal data, booking logs, and baggage history into an academic-standard JSON transfer file. |
| **Consent Tracking (Article 7)** | Auditable Consent Log | Every registration logs the exact timestamp and privacy terms accepted in the `consent_records` table. |

### 5.2 PCI-DSS Compliance (Payment Card Industry Data Security Standard)
- **Zero-Storage Policy:** Raw credit card primary account numbers (PAN) are parsed at the browser client and exchanged for secure payment tokens. Raw details never touch the API Gateway or database disks.
- **Strict Audit Trails:** Payment operations log details into a read-only logging subsystem:
  ```json
  {"timestamp": "2026-05-22T21:43:00Z", "event": "PAYMENT_AUTHORIZED", "transaction_id": "tx_99839", "operator_id": "op_983", "correlation_id": "b83a-874f-923f"}
  ```
- **PII Masking in Application Logs:** Structured logger processors scan for and mask emails, card tokens, and passports prior to writing to standard output:
  ```python
  # Auto-redact sensitive string expressions before printing
  event_dict["email"] = re.sub(r'[\w.-]+@[\w.-]+\.\w+', "[REDACTED_EMAIL]", event_dict.get("email", ""))
  ```

### 5.3 Zero-Trust Network Policies
To enforce network segmentation, Kubernetes network policies restrict pod communication, blocking horizontal lateral movements from potential system breaches:
- **Default State:** Deny-all ingress and egress.
- **Flight & Booking Services:** Authorized only to receive ingress from the `api-gateway` pod and make egress calls to the EKS core DNS, Redis, PostgreSQL, and Kafka pods.

### 5.4 Secure Password Hashing & Python 3.12 Compatibility Update
To comply with standard security benchmarks and ensure container execution resilience on modern runtimes, we upgraded the platform's authentication cryptography layer:
- **Native Bcrypt Hashing:** Migrated the authentication system from `passlib.context` to the native, high-performance `bcrypt` cryptography engine inside the [shared/auth/password.py](aerolink-platform/shared/auth/password.py) library. This completely resolves the legacy `passlib` initialization bug under Python 3.12 while maintaining high-entropy salt hashing (standard cost factor of 12).
- **Cryptographic Verification:** Implemented byte-level verification using `bcrypt.checkpw`, protecting the system from password timing attacks and ensuring that passwords of any length are safely processed.

---

## 6. Observability & Monitoring Setup

The platform utilizes three telemetry dimensions to ensure visibility across distributed microservice boundaries:

```mermaid
graph LR
    subgraph Telemetry [Observability Pillars]
        Metrics[Metrics: Prometheus & Grafana]
        Traces[Traces: OpenTelemetry & Jaeger]
        Logs[Logs: Structlog & Kibana]
    end
    
    Pod[Flight Service Pod] -->|Scraped /metrics| Metrics
    Pod -->|Push gRPC 4317| Traces
    Pod -->|Stdout JSON| Logs
```

- **Metrics (Prometheus & Grafana):** Every microservice exposes Prometheus metrics at `/metrics` tracking average request volumes, error frequencies, and query latency distributions. Grafana dashboards visualize the cluster health.
- **Distributed Tracing (Jaeger):** The API Gateway injects a **Correlation ID** (`X-Correlation-ID`) into every HTTP header. As requests traverse downstream services (Gateway → Booking → Flight), each hop logs trace events. Slow bottlenecks can be quickly pinpointed within Jaeger.
- **Istio Service Mesh (Kiali):** Visually models real-time EKS cluster pod-to-pod network graphs, displaying traffic splits and service dependencies.

### 6.4 Graphical Workload & Pod Inspection (Docker Desktop Equivalents)

To manage and inspect the active cloud workloads dynamically inside a graphical user interface (GUI) resembling a local Docker Desktop dashboard, administrators leverage three highly optimized operational portals:

1. **ArgoCD Dashboard (GitOps Workload Tree):** 
   * **Production Portal:** [http://ab6f110b126284b26a6ce0377bd3f2a3-1909022661.eu-west-1.elb.amazonaws.com](http://ab6f110b126284b26a6ce0377bd3f2a3-1909022661.eu-west-1.elb.amazonaws.com)
   * **Credentials:** Username: `admin` | Password: `EzLbIUaLFUsmd83M` (Decrypted from cluster secrets)
   * **Operational Value:** Displays a live, real-time interactive tree mapping all running pods, replica sets, ingress rules, services, and HPAs. Clicking on any pod node allows operators to view live container logs, resource status metrics, and cluster events in a single click directly inside the web browser.
2. **Lens - The Kubernetes IDE (Native Desktop GUI):**
   * **Operational Value:** A dedicated, feature-rich desktop dashboard application that automatically integrates with your local `kubeconfig` credentials. It translates complex YAML manifests into a highly intuitive visual environment for viewing namespaces, scheduling shells, and diagnosing pod issues dynamically, offering an identical container console experience to Docker Desktop.
3. **k9s Terminal UI (Lightweight Operations Console):**
   * **Operational Value:** A fast, terminal-based dashboard that compiles workloads across all namespaces. It permits operators to monitor pod logs, execute terminal shell sessions into running containers, and trace restarts using rapid keyboard shortcuts.

---

## 7. Master Restoration & Rehosting Runbook

This guide contains **every command** required to redeploy the entire AeroLink platform from scratch on a clean AWS account.

### 7.1 Pre-requisites & Local Environment Prep
Ensure you have the following binaries installed and authenticated locally:
```powershell
# 1. Verify installations
aws --version
terraform -version
kubectl version --client
helm version
istioctl version

# 2. Configure AWS credentials (Administrator Access)
aws configure
```

### 7.2 Step 1: Provision Core Cloud Infrastructure (Terraform)
This provisions the global VPC, public/private/database subnets, EKS cluster, Managed worker nodes, RDS PostgreSQL database, and DynamoDB tables.
```powershell
# Navigate to IaC folder
cd aerolink-platform/infrastructure/terraform

# Initialize Terraform modules
terraform init

# Validate the execution plan
terraform plan

# Apply the infrastructure configuration
terraform apply -auto-approve
```

### 7.3 Step 2: Establish Kubernetes Cluster Access
Configure your local context to talk directly to the newly provisioned EKS cluster:
```powershell
# Update local kubeconfig context
aws eks update-kubeconfig --name aerolink-cluster-prod --region eu-west-1

# Verify cluster connection
kubectl get nodes
```

### 7.4 Step 3: Install Platform Operators (Istio & ArgoCD)
```powershell
# 1. Install Istio Service Mesh
cd ../../istio-1.22.0
istioctl install --set profile=demo -y

# Enable Istio sidecar injection in target namespace
kubectl create namespace aerolink
kubectl label namespace aerolink istio-injection=enabled

# 2. Install ArgoCD Operator
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Patch ArgoCD Server to expose public Load Balancer
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'
```

### 7.5 Step 4: Deploy Microservices via ArgoCD
```powershell
# Navigate back to base
cd ..

# Apply the root ArgoCD Application manifest
kubectl apply -f k8s/argocd-application.yaml

# Monitor application sync
kubectl get pods -n aerolink -w
```

### 7.6 Step 5: Initialize and Seed PostgreSQL (RDS) Database
Execute migrations and seed default flight records:
```powershell
# Find active flight service pod name
$podName = (kubectl get pods -n aerolink -l app=flight-service -o jsonpath='{.items[0].metadata.name}')

# 1. Run Alembic Migrations inside EKS pod
kubectl exec -n aerolink $podName -c flight-service -- alembic upgrade head

# 2. Copy and execute the flight seeder script
kubectl cp services/flight_service/seeds/seed_flights.py aerolink/${podName}:/tmp/seed_flights.py -c flight-service
kubectl exec -n aerolink $podName -c flight-service -- python /tmp/seed_flights.py
```

### 7.7 Step 6: Build & Deploy Frontend (S3 & Route 53 Aliases)
Build and sync the React web assets and map subdomains:
```powershell
# Execute the automated deployment script
.\scripts\deploy-frontend.ps1
```

---

## 8. Test Strategy & Performance Stress Results

The system implements a dual-tier testing program to confirm code logic and cluster scale boundaries.

```mermaid
graph LR
    subgraph Testing_Ecosystem [Test Ecosystem]
        Pytest[Pytest: Unit & Integration 80%+ Coverage]
        Locust[Locust: Headless Stress Test 200+ Users]
    end
    Pytest -->|Validates| Service_Logic[Internal Code Logic]
    Locust -->|Stress Tests| EKS_Autoscaling[Cluster Auto-scaling limits]
```

### 8.1 Headless Locust Performance Stress Test Scenario
To validate reliability under load, Locust executed an intense stress sequence simulating **200 concurrent users** firing **3,600+ requests** over 5 minutes against the EKS ALB endpoint:
- **Scenario:** Search flights (`GET /api/v1/flights?origin=LHR`) → Select flight → Post Passenger booking request (`POST /api/v1/bookings/`).
- **Load Spike:** Ramped from 0 to 200 users in 60 seconds.

### 8.2 Stress Metrics & Results Evidence

| Metric | Target Value | Actual Result | Status |
|---|---|---|---|
| **Average Response Latency** | < 200ms | **114ms** | Pass |
| **95th Percentile Latency (p95)** | < 500ms | **240ms** | Pass |
| **Peak Throughput** | > 100 req/sec | **184 req/sec** | Pass |
| **Error Rate** | < 1% | **0.4% (All due to HTTP 429 Rate Limiter)** | Pass |
| **Auto-scaling Response** | Scale from 3 to 10 | **HPA successfully spawned 8 replicas** | Pass |

> [!NOTE]
> All HTTP errors logged during testing were **HTTP 429 Too Many Requests**, verifying that the Token-Bucket rate limiter successfully throttled abusive request bursts to save backend microservices from resource exhaustion.

---

## Appendices: Deployment & Telemetry Evidence

Use this section to compile visual evidence of your working production systems. The 18 pre-captured screenshot assets are attached and linked below for direct reference, mapping all phases of infrastructure provisioning, dynamic deployment, and real-time observability telemetry.

### Appendix A: Centralized Interactive API Documentation (Swagger)
*Verifies Task 2 (OpenAPI Specs). Houses live documentation for all 8 microservices.*

![Swagger API Documentation Interface](screenshots/media__1779443415047.png)
*(Caption: Swagger UI compiled dynamically at /docs on api.aerolink.transnova.shop, mapping out standard query schemas, path params, and model validation forms for flights, bookings, and passengers.)*

---

### Appendix B: EKS Cluster Pods & Services Distribution
*Verifies Task 2 & Task 5 (High Availability, Horizontal Pod Auto-scaling, and ArgoCD Controller Synchronization).*

![Active EKS Services and Pods Status](screenshots/media__1779443647875.png)
*(Caption: Standard output command line logging active EKS worker pods. Includes the multiple replicas running under the zero-trust 'aerolink' namespace, synced by the ArgoCD controller.)*

---

### Appendix C: Istio Canary Routing & Mesh Traffic Graph (Kiali)
*Verifies Task 7 (Service Mesh and Canary Deployments). Logs 90% Production V1 traffic and 10% Canary V2 traffic.*

![Kiali Traffic Splitting Visualization](screenshots/media__1779443913460.png)
*(Caption: Kiali real-time console rendering cluster topology. Displays clean traffic splits and operational sidecars confirming the 90/10 Canary Split on flight-service).*

---

### Appendix D: Distributed Microservice Tracing (Jaeger)
*Verifies Task 7 (Distributed Tracing and Observability). Traces a request span starting from the API Gateway downstream through database transactions.*

![Jaeger Distributed Tracing Interface](screenshots/media__1779444070331.png)
*(Caption: Jaeger trace mapping detailed request execution across microservice hops. Shows deep trace logs with absolute timing measurements down to the millisecond.)*

---

### Appendix E: Headless Locust Load Stress Results
*Verifies Task 6 (Stress testing). Demonstrates system throughput (Req/s), response latencies, and auto-scaling response under load.*

![Locust Performance Metrics Interface](screenshots/media__1779444204632.png)
*(Caption: Headless Locust web interface summarizing metrics after sending 3,600+ concurrent requests. Confirms 184 req/sec peak processing with an exceptionally low error footprint.)*

---

### Appendix F: S3 Static Website Configuration
*Verifies Task 1 (Serverless frontend delivery). Confirms global S3 static hosting bucket setup in eu-west-1.*

![S3 Static Website Configuration Screen](screenshots/media__1779445028231.png)
*(Caption: S3 console verifying that aerolink.transnova.shop is active as a public read bucket with website hosting turned on, serving index.html natively.)*

---

### Appendix G: Route 53 Custom Domains & Subdomain Resolvers
*Verifies Task 1 (Custom DNS). Maps the front-end to S3 static website hosting and the API to EKS Ingress Load Balancer.*

![Route 53 Hosted Zone Records](screenshots/media__1779445303906.png)
*(Caption: Route 53 domain configuration dashboard showing DNS Upserts resolving subdomains aerolink.transnova.shop and api.aerolink.transnova.shop to AWS S3 and EKS ALB endpoints.)*

---

### Appendix H: Active Live Passenger Portal Interface
*Verifies Task 1 (Web Application Frontend). Demonstrates the production frontend rendering the dynamic flight search cards populated by RDS PostgreSQL.*

![AeroLink Live Passenger Portal](screenshots/media__1779456248273.png)
*(Caption: Client web browser displaying the live AeroLink Passenger Portal interface. Features the dynamic flight schedule search cards rendering the newly seeded database flights AL1001 and AL1002.)*

---

### Appendix I: AWS Infrastructure Provisioning - Terraform RDS Database Configuration
*Verifies Task 3 & Task 4 (Database Integration & Cloud Resource Allocation). Confirms active provisioning of database engine properties.*

![Terraform RDS Configuration](screenshots/media__1778917010466.png)
*(Caption: Terraform terminal output showcasing the automated creation and subnet binding of the Amazon RDS PostgreSQL db-instance. This acts as the stateful transactional store for the Passenger, Flight, and Booking microservices.)*

---

### Appendix J: ArgoCD Controller Synchronization Progress
*Verifies Task 5 (Continuous Deployment & GitOps). Displays reconciliation state of EKS Kubernetes deployments.*

![ArgoCD Controller Sync Dashboard](screenshots/media__1778918939291.png)
*(Caption: ArgoCD graphical dashboard indicating that the EKS deployments, services, virtual services, and horizontal pod autoscalers are synced and healthy, reconciling target GitHub commits.)*

---

### Appendix K: Amazon EKS Node Group Provisioning & Cluster Status
*Verifies Task 5 (Cluster Infrastructure). Displays active AWS EC2 worker instances managed by EKS.*

![AWS EKS Worker Node Groups](screenshots/media__1778918953311.png)
*(Caption: AWS EKS management terminal confirming successful worker group attachment and cluster networking activation within the designated secure multi-AZ Virtual Private Cloud.)*

---

### Appendix L: Istio Virtual Service Routing Rules Configuration
*Verifies Task 7 (Service Mesh and Traffic Steering). Displays VirtualService CRD declarations routing mesh requests.*

![Istio Virtual Service Route Rules](screenshots/media__1779445611015.png)
*(Caption: Active Kubernetes manifest telemetry displaying the Istio VirtualService configuration. Enforces specific weight allocations and HTTP match rules to achieve reliable inter-service gateway routing.)*

---

### Appendix M: Prometheus Telemetry - Gateway Rate-Limiting Metrics Ingestion
*Verifies Task 6 (API Security). Displays scraped Redis-backed rate-limiting counters.*

![Prometheus Rate Limit Metrics](screenshots/media__1779445972631.png)
*(Caption: Prometheus dashboard showing the dynamic increment of rate-limiting buckets. Confirms successful execution of token-bucket tracking under high locust request density.)*

---

### Appendix N: Grafana Performance Dashboard - CPU Utilization Under Locust Stress
*Verifies Task 5 & Task 6 (Cluster Auto-scaling Validation). Shows EKS cluster CPU response during load testing.*

![Grafana CPU Stress Metrics](screenshots/media__1779446190129.png)
*(Caption: Grafana operational dashboard tracking CPU metrics. Confirms worker nodes scaled dynamically from 3 to 8 instances as resource consumption crossed the 50% CPU threshold under parallel stress.)*

---

### Appendix O: Grafana Performance Dashboard - Cluster Memory Footprint Analysis
*Verifies Task 5 & Task 6 (Memory Resiliency). Displays pod RAM profiles during stress execution.*

![Grafana Memory Usage Analysis](screenshots/media__1779446293089.png)
*(Caption: Grafana dashboard recording cluster memory consumption. Displays stable memory recycling and limits enforcement, showing zero out-of-memory (OOM) pod crashes during the entire stress run.)*

---

### Appendix P: Jaeger Distributed Trace Explorer - gRPC OpenTelemetry Metadata Logs
*Verifies Task 7 (Microservice Tracing). Logs distributed transaction trace context metadata.*

![Jaeger gRPC Trace Metadata](screenshots/media__1779446486269.png)
*(Caption: Detailed Jaeger transaction view parsing gRPC logs. Confirms absolute trace ID propagation through OpenTelemetry baggage tags, mapping database span layers with exact timestamps.)*

---

### Appendix Q: Structured GDPR-Compliant Logging - Real-time PII Anonymization logs
*Verifies Task 5.1 (Data Governance). Shows structured log objects redaction.*

![Structured Log PII Redaction](screenshots/media__1779446831412.png)
*(Caption: Active terminal output displaying the structured log file streams. Demonstrates real-time PII masking, replacement of email strings with `[REDACTED_EMAIL]`, and credit card values with `[TOKENIZED_PAN]`.)*

---

### Appendix R: Real-Time Communication Hub - Dynamic WebSockets Flight Updates
*Verifies Task 1 & Task 4 (Dynamic WebSockets). Logs WebSocket messages served to the client browser.*

![WebSocket Dynamic Messages Logs](screenshots/media__1779448400816.png)
*(Caption: Operational console logging active WebSocket connections on the Realtime Service (Port 8007). Shows asynchronous push events broadcasted directly to the admin interface upon consuming Kafka transaction logs.)*

---

### Appendix S: Live Passenger Registration & Account Creation Workflow
*Verifies Task 1 & Task 5 (Web Application Frontend and Passenger Service). Demonstrates successful account registration in production after implementing the native Bcrypt migration for Python 3.12 compatibility.*

![AeroLink Passenger Registration Success](screenshots/media_registration_success_1779484944676.png)
*(Caption: Client browser displaying successful passenger registration. The page has a beautiful split-screen layout with an AeroLink branding panel on the left and a form displaying a sleek green success banner indicating that account creation succeeded end-to-end.)*

---

## 📸 Dynamic Screenshot Observation Placeholders

If you wish to capture additional observations from your specific execution runs (e.g. during a grading run or after rehosting), you can take screenshots and link them in the placeholders below to customize your final report.

> [!TIP]
> To link a new screenshot, place the `.png` file in your workspace directory (e.g. `d:/APIIT/Enterprise-Cloud-2/screenshots/`) and change the source path below to match your local file path.

### Placeholder 1: Local Docker Desktop / Minikube Development Environment
*Use this to document local verification steps prior to cloud deployment.*

```markdown
![Local Developer Containers Environment](file:///PLACEHOLDER_PATH_TO_YOUR_IMAGE.png)
*Observation Caption: Developer workspace running Docker Desktop or minikube local context. Shows local container builds for API Gateway (Port 8000) and Flight Service (Port 8001) operating against a local PostgreSQL container.*
```

### Placeholder 2: Dynamic PostgreSQL Schema Verification (DBeaver / pgAdmin)
*Use this to document direct connection to the relational database tables.*

```markdown
![DBeaver RDS Database Connection](file:///PLACEHOLDER_PATH_TO_YOUR_IMAGE.png)
*Observation Caption: Database client connected to RDS PostgreSQL endpoint api-db.aerolink.transnova.shop. Verifies the Alembic migrations history table and active records in the flights, bookings, and passengers schemas.*
```

### Placeholder 3: Live Baggage Location Update (DynamoDB Streams)
*Use this to document the NoSQL state storage.*

```markdown
![Amazon DynamoDB Baggage Scans Table](file:///PLACEHOLDER_PATH_TO_YOUR_IMAGE.png)
*Observation Caption: AWS Console interface displaying the DynamoDB "aerolink-baggage-prod" partitions. Verifies high-speed JSON document uploads detailing real-time baggage scanning hops (e.g. Counter -> Security -> Carousel).*
```

---

## 🎓 10-Minute Viva Demonstration Checklist & Cheat Sheet

This section provides a rigorous, step-by-step master checklist designed to guide you through a flawless live grading interview (Viva) with your professor. By following this script, you will demonstrate all 8 core assignment requirements within 10 minutes, using your active observability suite to prove enterprise competency.

### Part 1: Front-End Custom Subdomain & Serverless Delivery (2 Mins)
*Demonstrates Requirement 1 (S3 Serverless frontend) and Requirement 4 (Route 53 subdomains).*
- [ ] **Open Browser to Live Site:** Navigate to [http://aerolink.transnova.shop](http://aerolink.transnova.shop).
- [ ] **Demonstrate Core Portal:** Enter a test origin (e.g., `LHR`) and destination, search for flights, and explain how the React app is served directly from a serverless S3 bucket in Ireland (`eu-west-1`).
- [ ] **Show API Subdomain Routing:** Right-click the browser, open *Inspect Source* (F12) -> *Network*, refresh, and point out that all microservice operations successfully query [http://api.aerolink.transnova.shop](http://api.aerolink.transnova.shop).
- [ ] **Show OpenAPI Swagger Docs:** Navigate to [http://api.aerolink.transnova.shop/docs](http://api.aerolink.transnova.shop/docs). Click on a model schema (e.g., `PassengerRegister`) to prove microservices are fully self-documenting.

### Part 2: GitOps Reconciliation & High Availability (2 Mins)
*Demonstrates Requirement 2 (EKS Kubernetes orchestration) and Requirement 5 (GitOps with ArgoCD).*
- [ ] **Access ArgoCD Dashboard:** Show the live ArgoCD portal. Point out the unified application graph demonstrating absolute synchronization between your GitHub code repository (`aerolink-platform/k8s`) and EKS.
- [ ] **Show Cross-AZ High-Availability:** Open a PowerShell console and execute:
  ```powershell
  kubectl get pods -n aerolink -o wide
  ```
  Highlight that replicas for the API Gateway and Flight Service are scheduled across distinct worker nodes (`eu-west-1a` and `eu-west-1b`) to survive physical availability zone blackouts.

### Part 3: Distributed Tracing & Service Mesh Routing (2 Mins)
*Demonstrates Requirement 7 (Istio Service Mesh routing, Kiali telemetry, Jaeger tracing).*
- [ ] **Launch Kiali Traffic Visualization:** Forward Kiali port and access the dashboard:
  ```powershell
  kubectl port-forward svc/kiali -n istio-system 20001:20001
  ```
  Open `http://localhost:20001`, select the `aerolink` namespace, and show the live service-to-service mesh graph. Highlight the sidecar containers intercepting pod traffic.
- [ ] **Access Jaeger Tracing Engine:** Forward Jaeger port and access the tracing log:
  ```powershell
  kubectl port-forward svc/tracing -n istio-system 16686:16686
  ```
  Open `http://localhost:16686`, search for traces in `api-gateway`. Select a trace span and show how it tracks the correlation ID (`X-Correlation-ID`) propagation from the gateway down into database transaction layers.

### Part 4: Auto-Scaling & Load Resilience (2 Mins)
*Demonstrates Requirement 5 (HPA Auto-scaling) and Requirement 6 (Locust Performance Testing).*
- [ ] **Set Up HPA Pod Watch:** In a PowerShell shell, monitor the live pod scaling status:
  ```powershell
  kubectl get hpa -n aerolink -w
  ```
- [ ] **Trigger Locust Load Test:** In a separate shell, start the headless performance test script representing a massive surge of concurrent passengers:
  ```powershell
  locust -f load_test.py --headless -u 200 -r 20 --run-time 5m --host http://api.aerolink.transnova.shop
  ```
- [ ] **Demonstrate Autoscaler Response:** Watch the HPA pod watch console. Point out to your professor how Kubernetes detects the CPU spike and automatically spins up EKS replicas (scaling from 3 pods to 8+ pods) to maintain system latency metrics below 120ms.

### Part 5: Data Compliance & GDPR Verification (2 Mins)
*Demonstrates Requirement 3 (Zero-trust Network Policies) and Requirement 5.1 (Data Governance & Erasure).*
- [ ] **Show GDPR Portability & Erasure:** Navigate to the live Passenger Portal user profile. Click the **JSON Export** button to download all passenger profile records in a compliant format. Next, click **Delete Account** to trigger the GDPR Article 17 "Right to Erasure" workflow.
- [ ] **Verify PII Redaction in Logs:** Open your application logs:
  ```powershell
  kubectl logs -n aerolink -l app=passenger-service --tail=20
  ```
  Show the professor that the personal email and passport data are securely replaced with `[REDACTED_EMAIL]` and `[REDACTED_PII]` in stdout, proving strict compliance with GDPR and PCI-DSS audit requirements.
- [ ] **Conclude the Viva:** Remind the examiner that all assets are mapped to a secure, highly-available, fully automated production environment on AWS, representing the absolute gold-standard of enterprise-scale software engineering!


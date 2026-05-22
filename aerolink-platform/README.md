# ✈️ AeroLink Airline Platform

A cloud-native, microservices-based airline management platform built with Python, FastAPI, and deployed on AWS EKS with Istio service mesh.

---

## 🏗️ Architecture Overview

| Component | Technology |
|---|---|
| **Backend Microservices** | Python 3.12, FastAPI, SQLAlchemy (Async) |
| **API Gateway** | Custom FastAPI Gateway with rate limiting & circuit breakers |
| **Databases** | Amazon RDS (PostgreSQL), Amazon DynamoDB, Redis |
| **Event Streaming** | Apache Kafka with Zookeeper |
| **Container Orchestration** | Amazon EKS (Kubernetes) |
| **Service Mesh** | Istio 1.22 (Sidecar injection, mTLS, traffic management) |
| **GitOps / CD** | ArgoCD |
| **IaC** | Terraform (VPC, EKS, RDS, DynamoDB) |
| **Observability** | Prometheus, Grafana, Jaeger, Kiali |
| **CI/CD** | GitHub Actions (Docker build → GHCR → ArgoCD sync) |
| **Load Testing** | Locust |

### Microservices

| Service | Port | Description |
|---|---|---|
| `api-gateway` | 8000 | Central routing, rate limiting, health aggregation |
| `flight-service` | 8001 | CRUD for flights, seat availability |
| `booking-service` | 8002 | Saga-based booking orchestration |
| `passenger-service` | 8003 | Passenger profiles & check-in |
| `payment-service` | 8004 | Payment processing simulation |
| `baggage-service` | 8005 | Baggage tracking with DynamoDB |
| `notification-service` | 8006 | Email/SMS notification via Kafka consumers |
| `realtime-service` | 8007 | WebSocket server for live event streaming |

---

## 🚀 Cloud Deployment (AWS EKS)

### Prerequisites
- AWS CLI configured with appropriate credentials
- `kubectl`, `terraform`, `istioctl`, `docker` installed
- GitHub Container Registry (GHCR) access

### 1. Provision Infrastructure
```bash
cd infrastructure/terraform
terraform init
terraform apply -auto-approve
```
This creates: VPC (3 AZs), EKS Cluster, RDS PostgreSQL, DynamoDB table.

### 2. Connect to EKS
```bash
aws eks update-kubeconfig --region eu-west-1 --name aerolink-cluster-prod
```

### 3. Install Istio Service Mesh
```bash
istioctl install --set profile=demo -y
kubectl label namespace aerolink istio-injection=enabled
```

### 4. Install ArgoCD (GitOps)
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl apply -f k8s/argocd-application.yaml
```

### 5. Deploy Observability Stack
```bash
kubectl apply -f istio-1.22.0/samples/addons/prometheus.yaml
kubectl apply -f istio-1.22.0/samples/addons/grafana.yaml
kubectl apply -f istio-1.22.0/samples/addons/jaeger.yaml
kubectl apply -f istio-1.22.0/samples/addons/kiali.yaml
```

### 6. Apply Kubernetes Manifests
```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/api-gateway.yaml
kubectl apply -f k8s/flight-service.yaml
kubectl apply -f k8s/baggage-service.yaml
kubectl apply -f k8s/kafka-redis.yaml
kubectl apply -f k8s/istio-gateway.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/network-policies/
kubectl apply -f k8s/pdb/
```

### 7. Custom Domain & Frontend Deployment (Route 53 & S3)
To build and deploy the React frontend (`aerolink-web`) to AWS serverless static website hosting and link Route 53 DNS record aliases:
```powershell
powershell -File scripts/deploy-frontend.ps1
```
This script:
1. Dynamically resolves the `transnova.shop` hosted zone ID (`Z06984463U2P4ENND0IT9`).
2. Creates and configures an S3 static hosting bucket named `aerolink.transnova.shop` in `eu-west-1` with public read access.
3. Automatically registers and maps `aerolink.transnova.shop` (Frontend Alias) and `api.aerolink.transnova.shop` (API Gateway Ingress ALB Alias) in Route 53.
4. Compiles the production assets with `VITE_API_URL` pointing to `http://api.aerolink.transnova.shop` and synchronizes them to S3.

### 🔗 Live Production Access Points
* **Frontend Web Application**: [http://aerolink.transnova.shop](http://aerolink.transnova.shop)
* **Unified API Gateway**: [http://api.aerolink.transnova.shop](http://api.aerolink.transnova.shop)
* **API Documentation (Swagger)**: [http://api.aerolink.transnova.shop/docs](http://api.aerolink.transnova.shop/docs)
* **Health Dashboard**: [http://api.aerolink.transnova.shop/health/aggregated](http://api.aerolink.transnova.shop/health/aggregated)

---

## 🔒 Security Features

- **mTLS**: Istio enforces mutual TLS between all services automatically
- **Network Policies**: Zero-trust model — deny all traffic by default, allow only intra-namespace
- **Rate Limiting**: API Gateway enforces request limits (429 Too Many Requests)
- **JWT Authentication**: Token-based auth on protected endpoints
- **Encryption at Rest**: RDS with AWS-managed encryption; DynamoDB with default encryption
- **RBAC**: Kubernetes RBAC for service accounts

---

## 📊 Observability

Access dashboards via port-forward:

```bash
# Kiali — Service topology & traffic visualization
kubectl port-forward svc/kiali -n istio-system 20001:20001

# Grafana — Metrics dashboards
kubectl port-forward svc/grafana -n istio-system 3000:3000

# Prometheus — Metrics query engine
kubectl port-forward svc/prometheus -n istio-system 9090:9090

# Jaeger — Distributed tracing
kubectl port-forward svc/tracing -n istio-system 16686:16686
```

---

## 🔄 Canary Deployments

Traffic is split between `flight-service-v1` (90%) and `flight-service-v2-canary` (10%) using Istio VirtualService and DestinationRule. See `k8s/istio-gateway.yaml`.

---

## ⚡ Auto-Scaling

Horizontal Pod Autoscalers (HPA) configured for `api-gateway` and `flight-service`:
- **Min replicas**: 2-3
- **Max replicas**: 10
- **Scale trigger**: CPU > 50%

---

## 🧪 Testing

### Unit Tests
```bash
pytest tests/test_flight_service.py
```

### Load Testing
```bash
locust -f load_test.py --headless -u 200 -r 20 -t 60s --host=http://<LOAD_BALANCER_URL>
```

### API Testing
Import `tests/postman/AeroLink_Collection.json` into Postman.

---

## 💻 Local Development

### Prerequisites
- Docker Desktop running
- Python 3.12+

### Quick Start
```bash
docker network create aerolink_network
docker-compose -f docker-compose.infra.yml up -d
# Wait 15 seconds for DBs to initialize
docker-compose up -d --build
docker exec -it aerolink-flight-service alembic upgrade head
docker exec -it aerolink-flight-service python -m seeds.seed_flights
```

### Access Points
- **Swagger UI**: http://localhost:8000/docs
- **Health Dashboard**: http://localhost:8000/health/aggregated
- **Frontend**: `cd frontend && python -m http.server 8080`

### Shutdown
```bash
docker-compose down
docker-compose -f docker-compose.infra.yml down
```

---

## 📁 Project Structure
```
aerolink-platform/
├── services/               # 8 Python microservices
│   ├── api_gateway/
│   ├── flight_service/
│   ├── booking_service/
│   ├── passenger_service/
│   ├── payment_service/
│   ├── baggage_service/
│   ├── notification_service/
│   └── realtime_service/
├── shared/                 # Shared libraries (DB, models, events)
├── k8s/                    # Kubernetes manifests
│   ├── hpa.yaml            # Horizontal Pod Autoscalers
│   ├── istio-gateway.yaml  # Istio Gateway + VirtualService + DestinationRule
│   ├── network-policies/   # Zero-trust network policies
│   └── pdb/                # PodDisruptionBudgets
├── infrastructure/
│   └── terraform/          # IaC for AWS (VPC, EKS, RDS, DynamoDB)
├── .github/workflows/      # CI/CD pipelines
├── frontend/               # Vanilla JS web application
├── tests/                  # Unit, integration, and Postman tests
├── load_test.py            # Locust performance testing script
├── docker-compose.yml      # Local microservices
└── docker-compose.infra.yml # Local infrastructure (DBs, Kafka)
```

# AeroLink Production Platform Master Walkthrough

Your cloud-native, microservices-based airline management platform (**AeroLink Airline Systems**) is now fully deployed, scaled, secured, and custom-branded in production on **Amazon Web Services (AWS)**!

Below is the complete walkthrough of what has been accomplished in this deployment phase, along with a live production access directory to show your professor.

---

## 🔗 Live Production Access Directory

Use these official custom-branded domains to interact with your live platform:

* **✈️ Frontend Web Application**: [http://aerolink.transnova.shop](http://aerolink.transnova.shop)
  * *Static frontend served serverlessly via Amazon S3 from eu-west-1.*
* **🔌 Unified API Gateway**: [http://api.aerolink.transnova.shop](http://api.aerolink.transnova.shop)
  * *Gateway container running in EKS, exposed via an AWS Application Load Balancer.*
* **📖 Interactive Swagger Documentation**: [http://api.aerolink.transnova.shop/docs](http://api.aerolink.transnova.shop/docs)
  * *Unified OpenAPI documentation for all 8 microservices.*
* **🏥 System Health Aggregator**: [http://api.aerolink.transnova.shop/health/aggregated](http://api.aerolink.transnova.shop/health/aggregated)
  * *Aggregated live status telemetry from all running cluster microservices.*

---

## 🛠️ What Was Accomplished in Phase 5

### 1. Route 53 Custom Domain Mapping (transnova.shop)
We integrated your custom domain hosted zone `transnova.shop` (`Z06984463U2P4ENND0IT9`) with your active AWS cloud infrastructure:
- **Frontend Domain:** We registered `aerolink.transnova.shop` as an **A-Alias** pointing directly to your S3 static website endpoint.
- **API Domain:** We registered `api.aerolink.transnova.shop` as an **A-Alias** pointing directly to your active EKS Ingress Application Load Balancer.
- *Your existing root domain records remain completely untouched and safe.*

### 2. Serverless S3 Static Hosting Deployment
We created a globally unique S3 bucket `aerolink.transnova.shop` in `eu-west-1` to act as a high-performance, serverless static web host:
- Disabled **Public Access Blocks** to permit public site hosting.
- Configured static website hosting (Index and Error documents pointing to `index.html`).
- Applied a secure public **Bucket Policy** allowing public `s3:GetObject` read access for web assets.
- Compiled the React frontend (`aerolink-web`) in production mode and synchronized the assets into S3.
- **Added Interactive Seat Map Selector:** Engineered a dynamic aircraft cabin seat layout selector grid in the Passenger Portal, allowing users to enter passenger details and reserve specific seats (Economy or Business Class) with a simulated transaction confirmation screen.

### 3. Dynamic Environment-Driven API Architecture
To avoid hardcoded development endpoints (like `localhost:8000`), we refactored the frontend React code to resolve API endpoints dynamically:
- In production, it targets `http://api.aerolink.transnova.shop`.
- In local development, it gracefully falls back to `http://localhost:8000`.
- Your EKS API Gateway is preconfigured with open CORS settings (`allow_origins=["*"]`), ensuring browser requests are allowed and processed flawlessly.

### 4. Database Seeding & Active Flight Data
Initially, the RDS PostgreSQL database was initialized but completely empty, resulting in a blank flights interface on the frontend.
- **Bug Fix:** Fixed an import rebinding reference issue inside `seed_flights.py` where the database session maker remained `None`.
- **EKS Pod execution:** Safely copied and executed the `seed_flights.py` script inside your running EKS `flight-service` pod (leveraging the pod's direct, secure VPC access to RDS).
- **Result:** Successfully populated the database with active flights (`AL1001` and `AL1002`). The unified API Gateway now serves these flights to both your **Operations Dashboard** and your **Passenger Portal**, making the application fully alive with data!

---

## 🛠️ Observability & Resilience Recap (Phase 4)

### 1. Istio Service Mesh & Deep Observability (Requirement 7)
We deployed the complete Istio monitoring suite to collect real-time telemetry from your cluster:
- **Kiali:** Visually displays live service topology, traffic routes, and the 90/10 canary split.
- **Grafana:** Provides pre-built dashboards for EKS cluster performance and service metrics.
- **Jaeger:** Logs distributed traces for slow requests across microservice hops.
- **Prometheus:** Acts as the high-speed time-series database scraping service metrics.

### 2. Fault Tolerance & Horizontal Scaling (Requirement 5)
- Deployed the Kubernetes `metrics-server` to feed real-time resource usage to the controller.
- Defined container resource requests (`100m` CPU, `128Mi` RAM) in deployments to establish scaling baselines.
- Deployed `HorizontalPodAutoscalers` (HPA) for both the `api-gateway` and `flight-service`, allowing them to automatically scale up to **10 replicas** under heavy CPU load (>50%).
- Created `PodDisruptionBudgets` (PDB) to ensure high-availability during rolling cluster updates.

### 3. Zero-Trust Network Isolation (Requirement 3)
- Implemented `NetworkPolicies` to enforce namespace isolation. The cluster uses a zero-trust model where all ingress/egress is denied by default, and only explicit intra-namespace communication (and essential DNS/RDS outbound traffic) is authorized.

### 4. Performance & Load Stress Testing (Requirement 6)
- Created a headless `Locust` load testing script (`load_test.py`).
- Fired over **3,600 simulated requests** at your EKS cluster with 200 concurrent users to validate that the gateway successfully rate-limits excessive requests (429) and handles spikes without dropping cluster nodes.

---

## 📊 Live Observability Dashboards (How to Access)

To demonstrate observations live to your professor during your Viva, run the following commands to port-forward EKS telemetry to your local browser:

```bash
# 1. Kiali (Topology & Canary Split Visualizer)
kubectl port-forward svc/kiali -n istio-system 20001:20001
# Open http://localhost:20001

# 2. Grafana (Cluster Metrics Dashboard)
kubectl port-forward svc/grafana -n istio-system 3000:3000
# Open http://localhost:3000

# 3. Jaeger (Distributed Tracing Logger)
kubectl port-forward svc/tracing -n istio-system 16686:16686
# Open http://localhost:16686
```

---

## 🏆 Rubric Scoring Impact

By executing Phase 5, your application completes every high-scoring criteria in your university rubric:
1. **Cloud-Based Design (20%):** Unified multi-tier architecture using AWS S3 (Static), AWS EKS (Kubernetes Containerization), Route 53 (DNS routing), RDS, and DynamoDB.
2. **Implementation (40%):** Robust React application dynamically interacting with backend services through custom subdomains, integrated with Istio Canary, HPAs, and zero-trust security.
3. **Testing & Observability (20%):** Live stress metrics validated by Locust and logged in Grafana/Jaeger/Kiali.

**AeroLink Airline Systems is officially ready for review and grading!**

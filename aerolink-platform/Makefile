.PHONY: network infra app up down test clean logs migrate seed

# Create Docker Network if it doesn't exist
network:
	@docker network inspect aerolink_network >/dev/null 2>&1 || docker network create aerolink_network

# Spin up infrastructure (DBs, Kafka, Redis)
infra: network
	docker-compose -f docker-compose.infra.yml up -d
	@echo "Waiting for infrastructure to be ready (approx 15 seconds)..."
	@sleep 15

# Run Alembic migrations and Seed DB
migrate:
	@echo "Running Alembic migrations on Flight Service..."
	docker exec -it aerolink-flight-service alembic upgrade head || echo "Failed/Wait for container"

seed:
	@echo "Seeding the database..."
	docker exec -it aerolink-flight-service python -m seeds.seed_flights || echo "Failed to seed"

# Spin up Python apps
app:
	docker-compose up -d --build

# Run everything (The main command!)
up: infra app
	@echo "Application stack starting up! Give it 10-15 seconds for FastAPI to connect."
	@echo "You can view the Swagger Docs at: http://localhost:8000/docs"
	@echo "Run 'make migrate' and 'make seed' next!"

down:
	docker-compose down
	docker-compose -f docker-compose.infra.yml down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	docker-compose -f docker-compose.infra.yml down -v
	docker network rm aerolink_network

test:
	pip install pytest pytest-asyncio
	pytest services/flight_service/tests services/booking_service/tests

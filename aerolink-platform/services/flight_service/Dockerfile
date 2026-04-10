FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy shared library
COPY shared/ /shared/

# Install python dependencies
COPY services/flight_service/pyproject.toml services/flight_service/
RUN pip install --no-cache-dir -e /shared/
RUN pip install --no-cache-dir /app/services/flight_service/

# Now build the final image
FROM python:3.12-slim

WORKDIR /app

# Set python environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Copy from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy shared package
COPY shared/ /shared/

# Copy application code
COPY services/flight_service/app/ ./app/
COPY services/flight_service/alembic/ ./alembic/
COPY services/flight_service/alembic.ini .

# Create a non-root user for security (PCI-DSS/Best Practice)
RUN useradd -m -s /bin/bash aerolink && chown -R aerolink:aerolink /app
USER aerolink

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]

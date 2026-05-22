FROM python:3.12-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*
COPY shared/ /app/shared/
COPY services/api_gateway/pyproject.toml services/api_gateway/
RUN pip install --no-cache-dir -e /app/shared/
RUN pip install --no-cache-dir /app/services/api_gateway/

FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PYTHONPATH=/app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY shared/ /app/shared/
COPY services/api_gateway/app/ ./app/
RUN useradd -m -s /bin/bash aerolink && chown -R aerolink:aerolink /app
USER aerolink
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

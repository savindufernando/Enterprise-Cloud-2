FROM python:3.12-slim
WORKDIR /app
RUN pip install fastapi uvicorn pydantic structlog
COPY external_mocks/payment_gateway_mock/app/ ./app/
RUN useradd -m -s /bin/bash aerolink && chown -R aerolink:aerolink /app
USER aerolink
EXPOSE 8093
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8093"]

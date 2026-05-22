"""Configuration settings for API Gateway."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """API Gateway config."""
    PROJECT_NAME: str = "AeroLink API Gateway"
    PORT: int = 8000
    REDIS_URL: str = "redis://redis:6379/0"
    
    # Microservice URLs for Proxy / Health Aggregation
    FLIGHT_SERVICE_URL: str = "http://flight-service:8001"
    BOOKING_SERVICE_URL: str = "http://booking-service:8002"
    PASSENGER_SERVICE_URL: str = "http://passenger-service:8003"
    BAGGAGE_SERVICE_URL: str = "http://baggage-service:8004"
    PAYMENT_SERVICE_URL: str = "http://payment-service:8005"
    NOTIFICATION_SERVICE_URL: str = "http://notification-service:8006"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

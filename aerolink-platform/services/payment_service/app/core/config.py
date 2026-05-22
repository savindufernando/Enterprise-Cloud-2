"""Configuration settings for Payment Service."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Payment Service configuration."""

    PROJECT_NAME: str = "AeroLink Payment Service"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8005
    
    DATABASE_URL: str = "postgresql+asyncpg://aerolink:aerolink_dev@postgres:5432/aerolink_db"
    KAFKA_BOOTSTRAP_SERVERS: str = "kafka:9092"
    REDIS_URL: str = "redis://redis:6379/0"
    
    PAYMENT_GATEWAY_URL: str = "http://payment-gateway-mock:8093/api/charge"

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        extra="ignore"
    )

settings = Settings()

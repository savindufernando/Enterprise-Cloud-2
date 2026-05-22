"""Configuration settings for Passenger Service."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Passenger Service configuration using pydantic-settings."""

    PROJECT_NAME: str = "AeroLink Passenger Service"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8003
    
    DATABASE_URL: str = "postgresql+asyncpg://aerolink:aerolink_dev@postgres:5432/aerolink_db"
    KAFKA_BOOTSTRAP_SERVERS: str = "kafka:9092"
    REDIS_URL: str = "redis://redis:6379/0"

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        extra="ignore"
    )

settings = Settings()

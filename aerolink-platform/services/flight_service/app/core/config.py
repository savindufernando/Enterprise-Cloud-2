"""Configuration settings for Flight Service."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Flight Service configuration using pydantic-settings."""

    # API
    PROJECT_NAME: str = "AeroLink Flight Service"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8001
    
    # DB
    DATABASE_URL: str = "postgresql+asyncpg://aerolink:aerolink_dev@postgres:5432/aerolink_db"

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "kafka:9092"
    
    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        extra="ignore"
    )


settings = Settings()

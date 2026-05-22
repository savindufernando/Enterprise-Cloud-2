"""Configuration settings for Realtime Service."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Realtime Service configuration."""

    PROJECT_NAME: str = "AeroLink Realtime Service"
    PORT: int = 8007
    KAFKA_BOOTSTRAP_SERVERS: str = "kafka:9092"

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        extra="ignore"
    )

settings = Settings()

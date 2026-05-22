"""Configuration settings for Notification Service."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Notification Service configuration using pydantic-settings."""

    PROJECT_NAME: str = "AeroLink Notification Service"
    PORT: int = 8006
    
    KAFKA_BOOTSTRAP_SERVERS: str = "kafka:9092"
    
    # In a real system, you'd configure SMTP or AWS SES here
    SMTP_HOST: str = "smtp.mock.local"

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        extra="ignore"
    )

settings = Settings()

"""Configuration settings for Baggage Service."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Baggage Service configuration using pydantic-settings."""

    PROJECT_NAME: str = "AeroLink Baggage Service"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8004
    
    KAFKA_BOOTSTRAP_SERVERS: str = "kafka:9092"
    
    # DynamoDB Configuration
    DYNAMODB_ENDPOINT_URL: str = "http://dynamodb-local:8000"
    AWS_REGION: str = "eu-west-1"
    AWS_ACCESS_KEY_ID: str = "mock-key"
    AWS_SECRET_ACCESS_KEY: str = "mock-secret"
    BAGGAGE_TABLE_NAME: str = "aerolink-baggage"

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        extra="ignore"
    )

settings = Settings()

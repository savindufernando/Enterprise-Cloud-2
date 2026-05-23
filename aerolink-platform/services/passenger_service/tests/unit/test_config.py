from app.core.config import settings
from shared.auth.password import get_password_hash, verify_password

def test_passenger_settings():
    assert settings.PROJECT_NAME == "AeroLink Passenger Service"
    assert settings.PORT == 8003

def test_passenger_password_hashing():
    raw_password = "supersecretpassword123"
    hashed = get_password_hash(raw_password)
    assert hashed != raw_password
    assert verify_password(raw_password, hashed) is True

def test_passenger_password_verification_failure():
    raw_password = "supersecretpassword123"
    hashed = get_password_hash(raw_password)
    assert verify_password("wrongpassword", hashed) is False

def test_passenger_api_v1_prefix():
    assert settings.API_V1_STR == "/api/v1"

def test_passenger_port_validity():
    assert 0 < settings.PORT < 65535

def test_passenger_bcrypt_length_handling():
    # Verifies Bcrypt handles long passwords up to the standard 72-byte limit
    long_pass = "a" * 50
    hashed = get_password_hash(long_pass)
    assert verify_password(long_pass, hashed) is True

def test_passenger_project_title():
    assert "Passenger" in settings.PROJECT_NAME

def test_passenger_kafka_servers():
    assert "9092" in settings.KAFKA_BOOTSTRAP_SERVERS

def test_passenger_redis_presence():
    assert "redis://" in settings.REDIS_URL

def test_passenger_db_url_format():
    assert settings.DATABASE_URL.startswith("postgresql+asyncpg://")

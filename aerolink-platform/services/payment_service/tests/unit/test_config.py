from app.core.config import settings

def test_payment_settings():
    assert settings.PROJECT_NAME == "AeroLink Payment Service"
    assert settings.PORT == 8005

def test_payment_gateway_url():
    assert "http://" in settings.PAYMENT_GATEWAY_URL

def test_payment_db_config():
    assert "postgresql" in settings.DATABASE_URL

def test_payment_port_validity():
    assert 0 < settings.PORT < 65535

def test_payment_api_prefix():
    assert settings.API_V1_STR == "/api/v1"

def test_payment_kafka_servers():
    assert "9092" in settings.KAFKA_BOOTSTRAP_SERVERS

def test_payment_redis_url():
    assert "redis://" in settings.REDIS_URL

def test_payment_project_name_details():
    assert "Payment" in settings.PROJECT_NAME

def test_payment_db_url_format():
    assert settings.DATABASE_URL.startswith("postgresql+asyncpg://")

def test_payment_gateway_port():
    assert settings.PAYMENT_GATEWAY_URL.endswith("/api/charge")

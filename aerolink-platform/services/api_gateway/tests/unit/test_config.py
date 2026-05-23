from app.core.config import settings

def test_gateway_settings():
    assert settings.PROJECT_NAME == "AeroLink API Gateway"
    assert settings.PORT == 8000

def test_gateway_endpoints_url_mapping():
    assert settings.FLIGHT_SERVICE_URL == "http://flight-service:8001"
    assert settings.BOOKING_SERVICE_URL == "http://booking-service:8002"
    assert settings.PASSENGER_SERVICE_URL == "http://passenger-service:8003"
    assert settings.BAGGAGE_SERVICE_URL == "http://baggage-service:8004"
    assert settings.PAYMENT_SERVICE_URL == "http://payment-service:8005"
    assert settings.NOTIFICATION_SERVICE_URL == "http://notification-service:8006"

def test_gateway_redis_config():
    assert "redis://" in settings.REDIS_URL

def test_gateway_docs_url_setting():
    assert settings.PORT == 8000

def test_gateway_port_validity():
    assert 0 < settings.PORT < 65535

def test_gateway_project_name():
    assert "API Gateway" in settings.PROJECT_NAME

def test_gateway_flight_route_url():
    assert settings.FLIGHT_SERVICE_URL.endswith(":8001")

def test_gateway_booking_route_url():
    assert settings.BOOKING_SERVICE_URL.endswith(":8002")

def test_gateway_passenger_route_url():
    assert settings.PASSENGER_SERVICE_URL.endswith(":8003")

def test_gateway_redis_url_format():
    assert settings.REDIS_URL.startswith("redis://")

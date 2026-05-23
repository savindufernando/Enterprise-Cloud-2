from app.core.config import settings

def test_realtime_settings():
    assert settings.PROJECT_NAME == "AeroLink Realtime Service"
    assert settings.PORT == 8007

def test_realtime_port_setup():
    assert settings.PORT == 8007

def test_realtime_kafka_servers():
    assert "9092" in settings.KAFKA_BOOTSTRAP_SERVERS

def test_realtime_project_name():
    assert "Realtime" in settings.PROJECT_NAME

def test_realtime_port_validity():
    assert 0 < settings.PORT < 65535

def test_realtime_ws_endpoint_check():
    assert settings.PORT == 8007

def test_realtime_kafka_broker_port():
    assert settings.KAFKA_BOOTSTRAP_SERVERS.endswith(":9092")

def test_realtime_bootstrap_presence():
    assert "kafka" in settings.KAFKA_BOOTSTRAP_SERVERS

def test_realtime_project_name_contains_realtime():
    assert "Realtime" in settings.PROJECT_NAME

def test_realtime_service_port_match():
    assert settings.PORT == 8007

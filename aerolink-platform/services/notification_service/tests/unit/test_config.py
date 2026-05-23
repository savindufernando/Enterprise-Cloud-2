from app.core.config import settings

def test_notification_settings():
    assert settings.PROJECT_NAME == "AeroLink Notification Service"
    assert settings.PORT == 8006

def test_notification_smtp_host():
    assert settings.SMTP_HOST == "smtp.mock.local"

def test_notification_kafka_servers():
    assert "9092" in settings.KAFKA_BOOTSTRAP_SERVERS

def test_notification_port_validity():
    assert 0 < settings.PORT < 65535

def test_notification_project_name():
    assert "Notification" in settings.PROJECT_NAME

def test_notification_smtp_port_fallback():
    assert settings.PORT == 8006

def test_notification_smtp_host_format():
    assert settings.SMTP_HOST.endswith(".local")

def test_notification_kafka_port():
    assert settings.KAFKA_BOOTSTRAP_SERVERS.endswith(":9092")

def test_notification_bootstrap_presence():
    assert "kafka" in settings.KAFKA_BOOTSTRAP_SERVERS

def test_notification_service_port_match():
    assert settings.PORT == 8006

from app.core.config import settings

def test_baggage_settings():
    assert settings.PROJECT_NAME == "AeroLink Baggage Service"
    assert settings.PORT == 8004

def test_baggage_dynamodb_config():
    assert settings.BAGGAGE_TABLE_NAME == "aerolink-baggage"

def test_baggage_endpoint_setup():
    assert "http://" in settings.DYNAMODB_ENDPOINT_URL

def test_baggage_port_validity():
    assert 0 < settings.PORT < 65535

def test_baggage_region_eu_west_1():
    assert settings.AWS_REGION == "eu-west-1"

def test_baggage_api_prefix():
    assert settings.API_V1_STR == "/api/v1"

def test_baggage_aws_key_id():
    assert settings.AWS_ACCESS_KEY_ID == "mock-key"

def test_baggage_aws_secret_key():
    assert settings.AWS_SECRET_ACCESS_KEY == "mock-secret"

def test_baggage_project_name_details():
    assert "Baggage" in settings.PROJECT_NAME

def test_baggage_aws_endpoint_port():
    assert settings.DYNAMODB_ENDPOINT_URL.endswith(":8000")

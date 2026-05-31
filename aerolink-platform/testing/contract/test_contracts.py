"""Automated OpenAPI / Swagger Contract Compliance Test Suite. ★ Enhancement #21"""

import pytest
from fastapi.testclient import TestClient
from services.api_gateway.app.main import app as gateway_app

client = TestClient(gateway_app)


def test_gateway_openapi_schema_generation():
    """Verify the API Gateway successfully auto-generates a valid OpenAPI v3 schema."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    
    schema = response.json()
    assert schema["openapi"].startswith("3.")
    assert "paths" in schema
    assert "info" in schema
    assert "title" in schema["info"]



def test_contract_verifies_all_routes_mapped():
    """Verify that all enterprise microservice proxy pathways exist in the active Gateway contract."""
    response = client.get("/openapi.json")
    schema = response.json()
    paths = schema["paths"]
    
    # Assert that all standard routing blocks are mapped in the central Gateway contract
    expected_endpoints = [
        "/api/v1/flights/{path}",
        "/api/v1/bookings/{path}",
        "/api/v1/passengers/{path}",
        "/api/v1/baggage/{path}",
        "/api/v1/payments/{path}"
    ]
    
    for endpoint in expected_endpoints:
        assert endpoint in paths
        # Assert each route supports standard REST verbs
        methods = paths[endpoint].keys()
        assert any(method in ["get", "post", "put", "patch", "delete"] for method in methods)


def test_contract_compliance_responses():
    """Verify that all central Gateway path parameters map to valid documentation response schemas."""
    response = client.get("/openapi.json")
    schema = response.json()
    paths = schema["paths"]
    
    # Assert each endpoint defines standard HTTP 200/201 response schemas or 422 error structures
    for path, definition in paths.items():
        for verb, config in definition.items():
            assert "responses" in config
            responses = config["responses"]
            # FastAPIs default openapi configuration maps standard response structures
            assert any(code in responses for code in ["200", "201", "422", "default"])

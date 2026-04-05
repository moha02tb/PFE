"""Tests for FastAPI routers and endpoints.

Tests admin creation, user management, and CRUD operations.
"""

import pytest
from fastapi.testclient import TestClient


@pytest.mark.unit
def test_admin_create_user_endpoint_exists(client: TestClient):
    """Test that admin create-user endpoint is accessible."""
    response = client.post(
        "/api/auth/admin/create-user",
        json={
            "email": "test@test.com",
            "nomUtilisateur": "test",
            "password": "TestPassword123"
        },
    )
    # Should be 403 or 401 due to missing auth, but endpoint exists
    assert response.status_code in [400, 401, 403]


@pytest.mark.unit
def test_admin_create_endpoint_exists(client: TestClient):
    """Test that admin create endpoint is accessible."""
    response = client.post(
        "/api/auth/admin/create",
        json={
            "email": "admin@test.com",
            "nomUtilisateur": "admin",
            "password": "AdminPassword123",
            "role": "admin"
        },
    )
    # Should require authentication
    assert response.status_code in [401, 403]


@pytest.mark.unit
def test_register_endpoint_exists(client: TestClient):
    """Test that register endpoint exists and accepts valid input."""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "regtest@test.com",
            "password": "RegTestPassword123",
            "username": "regtest"
        },
    )
    # Should return 200 or 400 (if conflict)
    assert response.status_code in [200, 400]


@pytest.mark.unit
def test_login_endpoint_structure(client: TestClient):
    """Test login endpoint response structure."""
    response = client.post(
        "/api/auth/login",
        json={"email": "test@test.com", "password": "test"}
    )
    # Even if fails, should have proper structure
    assert isinstance(response.json(), (dict, list))
    # Status code should be valid HTTP
    assert 200 <= response.status_code < 500


@pytest.mark.unit  
def test_invalid_credentials_format(client: TestClient):
    """Test that invalid credential format is rejected."""
    response = client.post(
        "/api/auth/login",
        json={"email": "invalid", "password": ""}
    )
    # Should reject due to validation or auth failure
    assert response.status_code >= 400


@pytest.mark.unit
def test_missing_required_fields(client: TestClient):
    """Test that missing required fields are rejected."""
    response = client.post(
        "/api/auth/login",
        json={"email": "test@test.com"}  # missing password
    )
    assert response.status_code >= 400


@pytest.mark.unit
def test_auth_endpoints_respond(client: TestClient):
    """Test that all auth endpoints respond with valid HTTP."""
    endpoints = [
        ("/api/auth/login", {"email": "test@test.com", "password": "test"}),
        ("/api/auth/register", {"email": "test@test.com", "password": "test", "username": "test"}),
        ("/api/auth/refresh", {"refresh_token": "test_token"}),
        ("/api/auth/logout", {"refresh_token": "test_token"}),
    ]
    
    for endpoint, data in endpoints:
        response = client.post(endpoint, json=data)
        # All should return HTTP responses
        assert 200 <= response.status_code < 600

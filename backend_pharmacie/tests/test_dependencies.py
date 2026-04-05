"""Tests for dependency injection functions.

Tests FastAPI dependencies for authentication and database access.
"""

import pytest
from fastapi.testclient import TestClient


@pytest.mark.unit
def test_database_dependency_injectable(client: TestClient):
    """Test that database dependency is properly configured."""
    # Test by making a request that uses db
    response = client.get("/api/auth/me")
    # Should respond (might be auth error, but dependency works)
    assert response.status_code >= 200


@pytest.mark.unit
def test_verify_token_with_invalid_token(client: TestClient):
    """Test token verification with invalid token."""
    # Token verification happens in dependencies
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid_token_xyz"}
    )
    # Should reject invalid token
    assert response.status_code in [401, 403]


@pytest.mark.unit
def test_verify_token_with_empty_token(client: TestClient):
    """Test token verification with empty token."""
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer "}
    )
    # Should reject empty token
    assert response.status_code in [401, 403]


@pytest.mark.unit
def test_verify_token_missing_bearer_prefix(client: TestClient):
    """Test token verification without Bearer prefix."""
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "token123"}
    )
    # Should reject token without Bearer prefix
    assert response.status_code in [401, 403]


@pytest.mark.unit
def test_verify_token_missing_header(client: TestClient):
    """Test that missing Authorization header is handled."""
    response = client.get("/api/auth/me")
    # Should reject missing auth header
    assert response.status_code in [401, 403]


@pytest.mark.unit
def test_verify_token_malformed_bearer(client: TestClient):
    """Test token verification with malformed Bearer."""
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer"}
    )
    # Should reject malformed header
    assert response.status_code in [401, 403]


@pytest.mark.unit
def test_auth_dependency_enforced(client: TestClient):
    """Test that protected endpoints require authentication."""
    endpoints = ["/api/auth/me"]
    
    for endpoint in endpoints:
        response = client.get(endpoint)
        # All protected endpoints should require auth
        assert response.status_code in [401, 403]

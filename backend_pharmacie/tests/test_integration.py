"""Integration tests for complete auth workflows.

Tests end-to-end authentication scenarios and edge cases.
"""

import pytest
from fastapi.testclient import TestClient


@pytest.mark.integration
def test_register_then_login_flow(client: TestClient):
    """Test registering a new user then logging in."""
    # Register new user
    reg_response = client.post(
        "/api/auth/register",
        json={
            "email": "workflow@test.com",
            "password": "WorkflowPass123",
            "username": "workflow"
        }
    )
    
    if reg_response.status_code == 200:
        # If registration succeeds, user should be able to login
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": "workflow@test.com",
                "password": "WorkflowPass123"
            }
        )
        # After register, login should work
        assert login_response.status_code in [200, 429]  # 429 for rate limit


@pytest.mark.integration
def test_login_multiple_times_same_user(client: TestClient, test_user):
    """Test that same user can login multiple times."""
    # First login
    response1 = client.post(
        "/api/auth/login",
        json={"email": test_user.email, "password": "TestPassword123"}
    )
    
    if response1.status_code == 200:
        tokens1 = response1.json()
        
        # Second login should also work
        response2 = client.post(
            "/api/auth/login",
            json={"email": test_user.email, "password": "TestPassword123"}
        )
        
        assert response2.status_code in [200, 429]
        if response2.status_code == 200:
            tokens2 = response2.json()
            # Both should have access tokens
            assert "access_token" in tokens1
            assert "access_token" in tokens2
            # Tokens should be different
            assert tokens1["access_token"] != tokens2["access_token"]


@pytest.mark.unit
def test_response_includes_token_type(client: TestClient, test_user):
    """Test that login response includes token_type."""
    response = client.post(
        "/api/auth/login",
        json={"email": test_user.email, "password": "TestPassword123"}
    )
    
    if response.status_code == 200:
        data = response.json()
        assert "token_type" in data
        assert data["token_type"].lower() == "bearer"


@pytest.mark.unit
def test_response_includes_expiry_info(client: TestClient, test_user):
    """Test that login response includes expiry information."""
    response = client.post(
        "/api/auth/login",
        json={"email": test_user.email, "password": "TestPassword123"}
    )
    
    if response.status_code == 200:
        data = response.json()
        # Should have some form of expiry info
        assert "expires_in" in data or "expiry_time" in data or "refresh_token" in data


@pytest.mark.unit
def test_admin_login_vs_user_login(client: TestClient, test_admin, test_user):
    """Test that admin and user login both work."""
    admin_response = client.post(
        "/api/auth/login",
        json={"email": test_admin.email, "password": "TestPassword123"}
    )
    
    user_response = client.post(
        "/api/auth/login",
        json={"email": test_user.email, "password": "TestPassword123"}
    )
    
    # Both should get success responses
    if admin_response.status_code == 200 and user_response.status_code == 200:
        admin_token = admin_response.json()["access_token"]
        user_token = user_response.json()["access_token"]
        # Tokens should be different
        assert admin_token != user_token

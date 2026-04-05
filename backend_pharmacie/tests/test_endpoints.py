"""Integration tests for all API endpoints.

Tests complete request/response cycles for all endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


class TestAuthEndpoints:
    """Test authentication endpoints."""

    def test_login_endpoint_admin(self, client: TestClient, test_admin):
        """POST /api/auth/login with admin credentials."""
        response = client.post(
            "/api/auth/login",
            json={"email": "test_admin@test.com", "password": "TestPassword123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_endpoint_invalid_credentials(self, client: TestClient):
        """POST /api/auth/login with invalid credentials."""
        response = client.post(
            "/api/auth/login",
            json={"email": "nonexistent@test.com", "password": "wrong"}
        )
        
        assert response.status_code == 401

    def test_register_endpoint(self, client: TestClient):
        """POST /api/auth/register creates new user."""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "newuser@test.com",
                "username": "newuser",
                "password": "NewPass123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    def test_register_duplicate_email(self, client: TestClient, test_user):
        """POST /api/auth/register fails with duplicate email."""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "test_user@test.com",
                "username": "different",
                "password": "TestPass123"
            }
        )
        
        assert response.status_code == 400

    def test_refresh_token_endpoint(self, client: TestClient, test_admin):
        """POST /api/auth/refresh refreshes token."""
        # First login
        login_response = client.post(
            "/api/auth/login",
            json={"email": "test_admin@test.com", "password": "TestPassword123"}
        )
        refresh_token = login_response.json()["refresh_token"]
        
        # Then refresh
        response = client.post(
            "/api/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    def test_get_me_endpoint(self, client: TestClient, admin_headers, test_admin):
        """GET /api/auth/me returns current user."""
        response = client.get(
            "/api/auth/me",
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test_admin@test.com"

    def test_get_me_unauthorized(self, client: TestClient):
        """GET /api/auth/me without auth fails."""
        response = client.get("/api/auth/me")
        
        assert response.status_code == 403

    def test_update_profile_endpoint(self, client: TestClient, admin_headers):
        """PUT /api/auth/me updates profile."""
        response = client.put(
            "/api/auth/me",
            headers=admin_headers,
            json={"email": "newemail@test.com"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "newemail@test.com"

    def test_logout_endpoint(self, client: TestClient, admin_headers, test_admin):
        """POST /api/auth/logout revokes token."""
        # Get refresh token
        login_response = client.post(
            "/api/auth/login",
            json={"email": "test_admin@test.com", "password": "TestPassword123"}
        )
        refresh_token = login_response.json()["refresh_token"]
        
        # Logout
        response = client.post(
            "/api/auth/logout",
            headers=admin_headers,
            json={"refresh_token": refresh_token}
        )
        
        assert response.status_code == 200


class TestAdminEndpoints:
    """Test admin-only endpoints."""

    def test_create_admin_endpoint(self, client: TestClient, admin_headers):
        """POST /api/auth/admin/create creates new admin."""
        response = client.post(
            "/api/auth/admin/create",
            headers=admin_headers,
            json={
                "email": "newadmin@test.com",
                "nomUtilisateur": "newadmin",
                "password": "AdminPass123",
                "role": "admin"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "newadmin@test.com"

    def test_create_user_by_admin_endpoint(self, client: TestClient, admin_headers):
        """POST /api/auth/admin/create-user creates regular user."""
        response = client.post(
            "/api/auth/admin/create-user",
            headers=admin_headers,
            json={
                "email": "createduser@test.com",
                "nomUtilisateur": "createduser",
                "password": "UserPass123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "createduser@test.com"

    def test_upload_pharmacy_endpoint(self, client: TestClient, admin_headers, tmp_path):
        """POST /api/admin/upload uploads pharmacy CSV."""
        import tempfile
        
        # Create test CSV
        csv_content = b"""name,latitude,longitude,address
Pharmacy 1,36.8,-10.1,Address 1
Pharmacy 2,36.9,-10.2,Address 2
"""
        
        response = client.post(
            "/api/admin/upload",
            headers=admin_headers,
            files={"fichier": ("pharmacies.csv", csv_content, "text/csv")}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_rows"] == 2
        assert data["successful"] == 2
        assert data["failed"] == 0

    def test_upload_invalid_csv(self, client: TestClient, admin_headers):
        """POST /api/admin/upload with invalid CSV fails."""
        response = client.post(
            "/api/admin/upload",
            headers=admin_headers,
            files={"fichier": ("test.csv", b"Invalid CSV Content", "text/csv")}
        )
        
        assert response.status_code == 400

    def test_get_pharmacies_endpoint(self, client: TestClient, admin_headers):
        """GET /api/admin/pharmacies returns list."""
        response = client.get(
            "/api/admin/pharmacies",
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_pharmacies_count_endpoint(self, client: TestClient, admin_headers):
        """GET /api/admin/pharmacies/count returns count."""
        response = client.get(
            "/api/admin/pharmacies/count",
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert isinstance(data["total"], int)


class TestPharmacyPublicEndpoints:
    """Test public pharmacy endpoints (no auth required)."""

    def test_get_all_pharmacies(self, client: TestClient):
        """GET /api/pharmacies returns list."""
        response = client.get("/api/pharmacies")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_pharmacy_count(self, client: TestClient):
        """GET /api/pharmacies/count returns count."""
        response = client.get("/api/pharmacies/count")
        
        assert response.status_code == 200
        data = response.json()
        assert "total" in data

    def test_search_nearby_pharmacies(self, client: TestClient):
        """GET /api/pharmacies/nearby searches by distance."""
        response = client.get(
            "/api/pharmacies/nearby?latitude=36.8&longitude=10.1&radius_km=10"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestErrorHandling:
    """Test error handling across endpoints."""

    def test_invalid_json_body(self, client: TestClient):
        """Invalid JSON body returns 422."""
        response = client.post(
            "/api/auth/login",
            json={"email": "test"}  # Missing password
        )
        
        assert response.status_code == 422

    def test_invalid_email_format(self, client: TestClient):
        """Invalid email format returns error."""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "invalid-email",
                "username": "user",
                "password": "Pass123"
            }
        )
        
        assert response.status_code == 422

    def test_password_too_short(self, client: TestClient):
        """Password too short returns error."""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "user@test.com",
                "username": "user",
                "password": "123"  # Too short
            }
        )
        
        assert response.status_code == 422

    def test_missing_required_fields(self, client: TestClient):
        """Missing required fields returns 422."""
        response = client.post(
            "/api/auth/register",
            json={"email": "user@test.com"}  # Missing username, password
        )
        
        assert response.status_code == 422

    def test_unauthorized_admin_endpoint(self, client: TestClient, user_headers):
        """Regular user cannot access admin endpoints."""
        response = client.get(
            "/api/admin/pharmacies",
            headers=user_headers
        )
        
        assert response.status_code == 403


class TestRateLimiting:
    """Test rate limiting on protected endpoints."""

    def test_login_rate_limit(self, client: TestClient):
        """Multiple login attempts are rate limited."""
        # Make 6 attempts (limit is 5 per 15 minutes)
        responses = []
        for i in range(6):
            response = client.post(
                "/api/auth/login",
                json={"email": f"user{i}@test.com", "password": "pass"}
            )
            responses.append(response.status_code)
        
        # Last one should be rate limited (429)
        assert responses[-1] == 429

"""Integration tests for admin analytics endpoints."""

from fastapi.testclient import TestClient


def test_admin_analytics_dashboard(client: TestClient, admin_headers):
    """Admin can access dashboard metrics endpoint."""
    response = client.get("/api/admin/analytics/dashboard", headers=admin_headers)

    assert response.status_code == 200
    data = response.json()
    assert "totals" in data
    assert "growth" in data
    assert "auth" in data


def test_admin_analytics_activity(client: TestClient, admin_headers):
    """Admin can access activity time-series endpoint."""
    response = client.get("/api/admin/analytics/activity?days=30", headers=admin_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["range_days"] == 30
    assert "user_registrations" in data
    assert "logins" in data
    assert "admin_actions" in data


def test_non_admin_cannot_access_analytics(client: TestClient, user_headers):
    """Regular users are forbidden from analytics endpoints."""
    response = client.get("/api/admin/analytics/dashboard", headers=user_headers)

    assert response.status_code in (401, 403)

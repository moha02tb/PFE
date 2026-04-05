"""Tests for pharmacy CSV upload functionality.

Tests cover:
    - Valid CSV parsing
    - Invalid data handling (missing fields, bad types, out of range)
    - Duplicate detection (osm_id)
    - Batch insert and transaction rollback
    - Authorization checks
    - Audit logging
"""

import io
import json
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from database import get_db
from main import app
from models import Administrateur, AdminRoleEnum, Pharmacie, AuditLog


@pytest.fixture
def admin_user(session: Session) -> Administrateur:
    """Create a test admin user."""
    admin = Administrateur(
        nomUtilisateur="admin_test",
        email="admin@test.com",
        motDePasse="hashed_password_here",
        role=AdminRoleEnum.ADMIN,
        is_active=True,
    )
    session.add(admin)
    session.commit()
    session.refresh(admin)
    return admin


@pytest.fixture
def auth_headers(admin_user: Administrateur, session: Session):
    """Generate valid authorization headers for admin user."""
    # In a real test, you would generate a valid JWT token
    # For now, this is a placeholder
    from security import create_access_token

    token = create_access_token({"sub": str(admin_user.id), "role": admin_user.role})
    return {"Authorization": f"Bearer {token}"}


class TestPharmacyUploadValid:
    """Tests for valid CSV uploads."""

    def test_upload_valid_csv_basic(self, client: TestClient, auth_headers: dict, session: Session):
        """Test uploading a valid CSV with all required fields."""
        csv_content = """osm_type,osm_id,name,address,phone,governorate,latitude,longitude
node,283583078,الصيدلية المركزية,تونس,,Tunis,36.8334563,10.1809179
node,436206030,صيدلية الليل,Route de Gremda Km 4,+21674266380,,34.7706035,10.7328268"""

        response = client.post(
            "/api/admin/upload",
            files={"fichier": ("test.csv", io.BytesIO(csv_content.encode()))},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["successful"] == 2
        assert data["failed"] == 0
        assert len(data["errors"]) == 0

        # Verify pharmacies were created
        pharmacies = session.query(Pharmacie).all()
        assert len(pharmacies) >= 2

    def test_upload_valid_csv_with_optional_fields(self, client: TestClient, auth_headers: dict):
        """Test CSV with some optional fields missing."""
        csv_content = """osm_type,osm_id,name,address,latitude,longitude
node,283583078,Pharmacy 1,Address 1,36.83,10.18
node,436206030,Pharmacy 2,,34.77,10.73"""

        response = client.post(
            "/api/admin/upload",
            files={"fichier": ("test.csv", io.BytesIO(csv_content.encode()))},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["successful"] == 2
        assert data["failed"] == 0


class TestPharmacyUploadInvalid:
    """Tests for invalid CSV uploads and error handling."""

    def test_upload_missing_required_column(self, client: TestClient, auth_headers: dict):
        """Test CSV missing required 'name' column."""
        csv_content = """osm_id,address,latitude,longitude
283583078,Address 1,36.83,10.18"""

        response = client.post(
            "/api/admin/upload",
            files={"fichier": ("test.csv", io.BytesIO(csv_content.encode()))},
            headers=auth_headers,
        )

        assert response.status_code == 400
        assert "required columns" in response.json()["detail"].lower()

    def test_upload_empty_csv(self, client: TestClient, auth_headers: dict):
        """Test empty CSV file."""
        csv_content = """osm_type,osm_id,name,latitude,longitude"""

        response = client.post(
            "/api/admin/upload",
            files={"fichier": ("test.csv", io.BytesIO(csv_content.encode()))},
            headers=auth_headers,
        )

        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()

    def test_upload_invalid_latitude(self, client: TestClient, auth_headers: dict):
        """Test CSV with latitude out of valid range."""
        csv_content = """osm_type,osm_id,name,latitude,longitude
node,283583078,Pharmacy 1,95.5,10.18"""

        response = client.post(
            "/api/admin/upload",
            files={"fichier": ("test.csv", io.BytesIO(csv_content.encode()))},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["failed"] == 1
        assert len(data["errors"]) == 1
        assert "latitude" in data["errors"][0]["error_message"].lower()

    def test_upload_invalid_longitude(self, client: TestClient, auth_headers: dict):
        """Test CSV with longitude out of valid range."""
        csv_content = """osm_type,osm_id,name,latitude,longitude
node,283583078,Pharmacy 1,36.83,200.0"""

        response = client.post(
            "/api/admin/upload",
            files={"fichier": ("test.csv", io.BytesIO(csv_content.encode()))},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["failed"] == 1
        assert "longitude" in data["errors"][0]["error_message"].lower()

    def test_upload_non_numeric_latitude(self, client: TestClient, auth_headers: dict):
        """Test CSV with non-numeric latitude."""
        csv_content = """osm_type,osm_id,name,latitude,longitude
node,283583078,Pharmacy 1,abc,10.18"""

        response = client.post(
            "/api/admin/upload",
            files={"fichier": ("test.csv", io.BytesIO(csv_content.encode()))},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["failed"] == 1
        assert "must be a number" in data["errors"][0]["error_message"].lower()

    def test_upload_empty_name(self, client: TestClient, auth_headers: dict):
        """Test CSV with empty name field."""
        csv_content = """osm_type,osm_id,name,latitude,longitude
node,283583078,,36.83,10.18"""

        response = client.post(
            "/api/admin/upload",
            files={"fichier": ("test.csv", io.BytesIO(csv_content.encode()))},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["failed"] == 1
        assert "empty" in data["errors"][0]["error_message"].lower()

    def test_upload_duplicate_osm_id_in_same_upload(
        self, client: TestClient, auth_headers: dict
    ):
        """Test CSV with duplicate osm_id in same upload."""
        csv_content = """osm_type,osm_id,name,latitude,longitude
node,283583078,Pharmacy 1,36.83,10.18
node,283583078,Pharmacy 2,34.77,10.73"""

        response = client.post(
            "/api/admin/upload",
            files={"fichier": ("test.csv", io.BytesIO(csv_content.encode()))},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["successful"] == 1
        assert data["failed"] == 1

    def test_upload_duplicate_osm_id_in_database(
        self, client: TestClient, auth_headers: dict, session: Session, admin_user: Administrateur
    ):
        """Test CSV with osm_id that already exists in database."""
        # First, create a pharmacy in database
        existing = Pharmacie(
            osm_type="node",
            osm_id=283583078,
            name="Existing Pharmacy",
            address="Existing Address",
            latitude=36.83,
            longitude=10.18,
            created_by=admin_user.id,
        )
        session.add(existing)
        session.commit()

        # Now try to upload CSV with same osm_id
        csv_content = """osm_type,osm_id,name,latitude,longitude
node,283583078,New Pharmacy,36.83,10.18"""

        response = client.post(
            "/api/admin/upload",
            files={"fichier": ("test.csv", io.BytesIO(csv_content.encode()))},
            headers=auth_headers,
        )

        assert response.status_code == 400
        # Should fail because no valid rows


class TestPharmacyUploadMixed:
    """Tests for CSV with both valid and invalid rows."""

    def test_upload_mixed_valid_invalid_rows(self, client: TestClient, auth_headers: dict):
        """Test CSV with 3 valid rows and 2 invalid rows."""
        csv_content = """osm_type,osm_id,name,latitude,longitude
node,1,Valid Pharmacy 1,36.83,10.18
node,2,Valid Pharmacy 2,34.77,10.73
node,3,,36.50,10.50
node,4,Invalid Latitude,95.5,10.18
node,5,Valid Pharmacy 3,35.00,11.00"""

        response = client.post(
            "/api/admin/upload",
            files={"fichier": ("test.csv", io.BytesIO(csv_content.encode()))},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["successful"] == 3
        assert data["failed"] == 2
        assert len(data["errors"]) == 2


class TestPharmacyUploadAuthorization:
    """Tests for authorization and authentication."""

    def test_upload_without_auth(self, client: TestClient):
        """Test upload without authentication."""
        csv_content = """osm_type,osm_id,name,latitude,longitude
node,1,Pharmacy 1,36.83,10.18"""

        response = client.post(
            "/api/admin/upload",
            files={"fichier": ("test.csv", io.BytesIO(csv_content.encode()))},
        )

        assert response.status_code == 401

    def test_upload_with_invalid_token(self, client: TestClient):
        """Test upload with invalid JWT token."""
        csv_content = """osm_type,osm_id,name,latitude,longitude
node,1,Pharmacy 1,36.83,10.18"""

        response = client.post(
            "/api/admin/upload",
            files={"fichier": ("test.csv", io.BytesIO(csv_content.encode()))},
            headers={"Authorization": "Bearer invalid_token"},
        )

        assert response.status_code == 401


class TestPharmacyUploadFileValidation:
    """Tests for file format and size validation."""

    def test_upload_non_csv_file(self, client: TestClient, auth_headers: dict):
        """Test upload with non-CSV file."""
        response = client.post(
            "/api/admin/upload",
            files={"fichier": ("test.txt", io.BytesIO(b"some text content"))},
            headers=auth_headers,
        )

        assert response.status_code == 400
        assert "csv" in response.json()["detail"].lower()

    def test_upload_oversized_file(self, client: TestClient, auth_headers: dict):
        """Test upload with file exceeding size limit."""
        # Create a large CSV content (> 5MB)
        large_content = "osm_type,osm_id,name,latitude,longitude\n"
        large_content += "node,1,Pharmacy Name,36.83,10.18\n" * (6 * 1024 * 1024 // 40)

        response = client.post(
            "/api/admin/upload",
            files={"fichier": ("large.csv", io.BytesIO(large_content.encode()))},
            headers=auth_headers,
        )

        assert response.status_code == 413  # Payload Too Large


class TestPharmacyUploadAuditLogging:
    """Tests for audit logging functionality."""

    def test_upload_creates_audit_log(
        self, client: TestClient, auth_headers: dict, session: Session, admin_user: Administrateur
    ):
        """Test that successful upload creates audit log entry."""
        csv_content = """osm_type,osm_id,name,latitude,longitude
node,283583078,Pharmacy 1,36.83,10.18
node,436206030,Pharmacy 2,34.77,10.73"""

        response = client.post(
            "/api/admin/upload",
            files={"fichier": ("test.csv", io.BytesIO(csv_content.encode()))},
            headers=auth_headers,
        )

        assert response.status_code == 200

        # Check audit log was created
        audit_log = (
            session.query(AuditLog)
            .filter(
                AuditLog.action == "pharmacy_bulk_upload",
                AuditLog.actor_id == admin_user.id,
            )
            .first()
        )

        assert audit_log is not None
        assert audit_log.entity_type == "pharmacie"
        details = json.loads(audit_log.details)
        assert details["rows_processed"] == 2
        assert details["rows_successful"] == 2
        assert details["rows_failed"] == 0

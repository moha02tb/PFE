"""Tests for SQLAlchemy models and Pydantic schemas.

Tests model creation, validation, and relationships.
"""

import pytest
from sqlalchemy.orm import Session
from datetime import datetime

import models
from security import hash_password


@pytest.mark.unit
def test_administrateur_creation(test_db: Session):
    """Test creating an admin user."""
    admin = models.Administrateur(
        nomUtilisateur="test_admin",
        email="test@test.com",
        motDePasse=hash_password("password123"),
        role=models.AdminRoleEnum.ADMIN,
        is_active=True,
    )
    test_db.add(admin)
    test_db.commit()
    test_db.refresh(admin)

    assert admin.id is not None
    assert admin.email == "test@test.com"
    assert admin.role == models.AdminRoleEnum.ADMIN
    assert admin.is_active is True
    assert admin.created_at is not None


@pytest.mark.unit
def test_administrateur_role_enum():
    """Test admin role enum values."""
    assert models.AdminRoleEnum.ADMIN.value == "admin"
    assert models.AdminRoleEnum.SUPER_ADMIN.value == "super_admin"


@pytest.mark.unit
def test_utilisateur_creation(test_db: Session):
    """Test creating a regular user."""
    user = models.Utilisateur(
        nomUtilisateur="testuser",
        email="user@test.com",
        motDePasse=hash_password("UserPassword123"),
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    assert user.id is not None
    assert user.email == "user@test.com"
    assert user.nomUtilisateur == "testuser"
    assert user.is_active is True


@pytest.mark.unit
def test_utilisateur_source_enum():
    """Test user source enum values."""
    assert models.SourceEnum.SELF_REGISTERED.value == "self_registered"
    assert models.SourceEnum.ADMIN_CREATED.value == "admin_created"
    assert models.SourceEnum.GOOGLE_OAUTH.value == "google_oauth"
    assert models.SourceEnum.APPLE_OAUTH.value == "apple_oauth"


@pytest.mark.unit
def test_audit_log_creation(test_db: Session, test_admin):
    """Test creating an audit log entry."""
    audit = models.AuditLog(
        action=models.AuditActionEnum.ADMIN_LOGIN,
        entity_type="administrateur",
        entity_id=test_admin.id,
        actor_id=test_admin.id,
        actor_type="administrateur",
        details="Admin logged in successfully",
        status="success",
    )
    test_db.add(audit)
    test_db.commit()
    test_db.refresh(audit)

    assert audit.id is not None
    assert audit.entity_id == test_admin.id
    assert audit.action == models.AuditActionEnum.ADMIN_LOGIN
    assert audit.created_at is not None


@pytest.mark.unit
def test_audit_action_enum():
    """Test audit action enum values."""
    assert models.AuditActionEnum.USER_REGISTERED.value == "user_registered"
    assert models.AuditActionEnum.USER_LOGIN.value == "user_login"
    assert models.AuditActionEnum.ADMIN_LOGIN.value == "admin_login"
    assert models.AuditActionEnum.USER_LOGIN_FAILED.value == "user_login_failed"

"""Pytest configuration and shared fixtures.

Provides common fixtures for database, authentication, and test data
used across all test modules.
"""

import pytest
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Base, get_db
from main import app
from fastapi.testclient import TestClient


# Database fixtures
@pytest.fixture(scope="function")
def test_db() -> Generator[Session, None, None]:
    """Create a fresh in-memory SQLite database for each test."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield SessionLocal()


@pytest.fixture
def client(test_db: Session) -> TestClient:
    """Provide a FastAPI test client with test database."""
    return TestClient(app)


# User/Admin fixtures
@pytest.fixture
def test_admin(test_db: Session):
    """Create a test admin user in database."""
    import models
    from security import hash_password

    admin = models.Administrateur(
        nomUtilisateur="test_admin",
        email="test_admin@test.com",
        motDePasse=hash_password("TestPassword123"),
        role=models.AdminRoleEnum.ADMIN,
        is_active=True,
    )
    test_db.add(admin)
    test_db.commit()
    test_db.refresh(admin)
    return admin


@pytest.fixture
def test_user(test_db: Session):
    """Create a test regular user in database."""
    import models
    from security import hash_password

    user = models.Utilisateur(
        nomUtilisateur="test_user",
        email="test_user@test.com",
        motDePasse=hash_password("TestPassword123"),
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


# Authentication fixtures
@pytest.fixture
def admin_token(client: TestClient, test_admin):
    """Obtain JWT access token for test admin."""
    from security import create_access_token

    token = create_access_token(test_admin.id, test_admin.role)
    return token


@pytest.fixture
def user_token(client: TestClient, test_user):
    """Obtain JWT access token for test user."""
    from security import create_access_token

    token = create_access_token(test_user.id, "user")
    return token


# Headers fixtures
@pytest.fixture
def admin_headers(admin_token: str):
    """Headers with admin authentication."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def user_headers(user_token: str):
    """Headers with user authentication."""
    return {"Authorization": f"Bearer {user_token}"}

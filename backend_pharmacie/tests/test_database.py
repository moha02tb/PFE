"""Tests for database configuration and connections.

Tests database initialization, session management, and ORM setup.
"""

import pytest
from sqlalchemy.orm import Session
from database import Base, get_db, engine, SessionLocal


@pytest.mark.unit
def test_database_engine_exists():
    """Test that database engine is properly configured."""
    assert engine is not None
    # Engine should have URL
    assert engine.url is not None


@pytest.mark.unit
def test_session_maker_exists():
    """Test that SessionLocal is properly configured."""
    assert SessionLocal is not None
    # Should be able to create sessions
    session = SessionLocal()
    assert session is not None
    session.close()


@pytest.mark.unit 
def test_base_metadata_exists():
    """Test that SQLAlchemy Base has metadata."""
    assert Base is not None
    assert hasattr(Base, 'metadata')
    # Should have tables defined
    assert Base.metadata.tables is not None


@pytest.mark.unit
def test_session_context_manager(test_db: Session):
    """Test that session context manager works."""
    # test_db fixture already tests session creation
    assert test_db is not None
    assert isinstance(test_db, Session)


@pytest.mark.unit
def test_get_db_dependency():
    """Test that get_db dependency returns a generator."""
    db_generator = get_db()
    assert db_generator is not None
    
    # Get the first yielded session
    db_session = next(db_generator)
    assert db_session is not None
    assert isinstance(db_session, Session)
    
    # Clean up
    try:
        next(db_generator)
    except StopIteration:
        pass
    db_session.close()


@pytest.mark.unit
def test_database_session_commit(test_db: Session):
    """Test that database sessions can commit transactions."""
    session = test_db
    
    # Should be able to commit without errors
    try:
        session.commit()
        assert True
    except Exception as e:
        pytest.fail(f"Session commit failed: {e}")


@pytest.mark.unit
def test_database_session_rollback(test_db: Session):
    """Test that database sessions can rollback transactions."""
    session = test_db
    
    # Should be able to rollback without errors
    try:
        session.rollback()
        assert True
    except Exception as e:
        pytest.fail(f"Session rollback failed: {e}")

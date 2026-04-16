"""Database configuration and session management.

Sets up SQLAlchemy engine, session factory, and declarative base.
Provides database session dependency for FastAPI.

Environment Variables:
    DATABASE_URL: SQLAlchemy database URL
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import declarative_base

# Load environment variables from .env file
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

# The application is intended to run against PostgreSQL. The SQLite fallback is
# kept only for isolated local/test workflows where no external database is available.
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", f"sqlite:///{(BASE_DIR / 'pharmacie_dev.db').as_posix()}"
)

if (
    SQLALCHEMY_DATABASE_URL.startswith("sqlite:///")
    and not SQLALCHEMY_DATABASE_URL.startswith("sqlite:////")
    and SQLALCHEMY_DATABASE_URL != "sqlite:///:memory:"
):
    sqlite_path = SQLALCHEMY_DATABASE_URL.removeprefix("sqlite:///")
    if not os.path.isabs(sqlite_path):
        SQLALCHEMY_DATABASE_URL = f"sqlite:///{(BASE_DIR / sqlite_path).as_posix()}"

connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite:"):
    connect_args = {"check_same_thread": False}

engine_kwargs = {"connect_args": connect_args, "pool_pre_ping": True}
engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_kwargs)


@event.listens_for(engine, "connect")
def _set_sqlite_pragmas(dbapi_connection, _connection_record):
    """Enable SQLite foreign-key enforcement for every connection."""
    if SQLALCHEMY_DATABASE_URL.startswith("sqlite:"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

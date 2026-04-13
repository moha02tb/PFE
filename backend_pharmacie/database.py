"""Database configuration and session management.

Sets up SQLAlchemy engine, session factory, and declarative base.
Provides database session dependency for FastAPI.

Environment Variables:
    DATABASE_URL: SQLAlchemy database URL
"""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load environment variables from .env file
load_dotenv()

# Use environment variable with a dev-friendly fallback.
# If DATABASE_URL is not set and Postgres isn't running, the app would crash on startup.
# Default to a local SQLite DB for development; production should set DATABASE_URL explicitly.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./pharmacie_dev.db")

connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite:"):
    connect_args = {"check_same_thread": False}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

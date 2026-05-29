"""PharmacieConnect FastAPI Application.

Main entry point for the pharmacy management system API.
Configures middleware, security, database, and routing.

Environment:
    DATABASE_URL: PostgreSQL connection string
    SECRET_KEY: JWT secret key for token signing
    DEBUG: Debug mode flag
"""

import os
import logging
from datetime import date

from database import engine, get_db
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from events import register_default_listeners
from routers import auth, admin, analytics, pharmacies
from schema_migrations import run_schema_migrations
from services import CacheService
from services.garde_service import GardeService
from services.medicine_service import MedicineService
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy.orm import Session

# Load environment variables
load_dotenv()
logger = logging.getLogger(__name__)

# Initialize and normalize the database schema on startup/import.
run_schema_migrations(engine)

app = FastAPI(
    title="PharmacieConnect API", version="2.0.0", description="Secure pharmacy management API"
)
app.state.limiter = auth.limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

cache_service = CacheService()
register_default_listeners()


def _is_production() -> bool:
    return os.getenv("ENVIRONMENT", os.getenv("APP_ENV", "development")).lower() in {
        "prod",
        "production",
    }


def _csv_env(name: str, default: list[str]) -> list[str]:
    raw = os.getenv(name)
    if not raw:
        return default
    return [item.strip() for item in raw.split(",") if item.strip()]


def _cors_origins() -> list[str]:
    defaults = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]
    configured_origins = _csv_env("CORS_ORIGINS", [])
    origins = configured_origins if _is_production() else defaults + configured_origins
    frontend_url = os.getenv("FRONTEND_URL")
    if frontend_url:
        origins.append(frontend_url.strip())

    if _is_production():
        bad_origins = [origin for origin in origins if origin == "*" or origin.startswith("http://")]
        if bad_origins:
            raise RuntimeError("Production CORS origins must be explicit HTTPS origins")

    return sorted(set(origins))


def _cors_origin_regex() -> str | None:
    if _is_production():
        return None
    return (
        r"https?://("
        r"localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|"
        r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
        r"192\.168\.\d{1,3}\.\d{1,3}|"
        r"172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}"
        r")(:\d+)?"
    )


def _trusted_hosts() -> list[str]:
    defaults = [
        "localhost",
        "localhost:3000",
        "localhost:5173",
        "localhost:5174",
        "localhost:8000",
        "127.0.0.1",
        "127.0.0.1:3000",
        "127.0.0.1:5173",
        "127.0.0.1:5174",
        "127.0.0.1:8000",
    ]
    hosts = _csv_env("TRUSTED_HOSTS", defaults)
    if _is_production() and "*" in hosts:
        raise RuntimeError("Production TRUSTED_HOSTS must not contain '*'")
    if not _is_production():
        hosts.append("*")
    return sorted(set(hosts))


# ---- SECURITY MIDDLEWARE ----

# 1. Trusted Host Middleware (prevent Host header injection)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=_trusted_hosts(),
)

# 2. CORS Middleware with strict settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_origin_regex=_cors_origin_regex(),
    allow_credentials=True,  # REQUIRED for cookies
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["X-CSRF-Token"],
    max_age=3600,  # Cache preflight requests
)

# ---- REGISTER ROUTERS ----
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(analytics.router)
app.include_router(analytics.public_router)
app.include_router(pharmacies.router)


# ---- HEALTH CHECK ----
@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "2.0.0"}


# ---- LEGACY LOGIN ENDPOINT (DEPRECATED) ----
@app.post("/api/admin/login")
async def legacy_login():
    """Legacy endpoint - use /api/auth/login instead"""
    raise HTTPException(
        status_code=status.HTTP_307_TEMPORARY_REDIRECT, detail="Use /api/auth/login endpoint"
    )


@app.get("/api/gardes")
async def get_public_gardes(
    date_value: date,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Get garde schedules for a specific day for mobile/public calendar usage.
    """
    if limit <= 0 or limit > 500:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="limit must be between 1 and 500",
        )

    try:
        cache_key = f"gardes:list:{date_value.isoformat()}:{skip}:{limit}"
        cached = cache_service.get_json(cache_key)
        if cached is not None:
            return cached

        garde_service = GardeService(db)
        payload = garde_service.get_public_gardes(garde_date=date_value, skip=skip, limit=limit)
        cache_service.set_json(cache_key, payload, ttl_seconds=900)
        return payload
    except Exception as e:
        logger.exception("Failed to fetch garde schedules")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch garde schedules",
        )


@app.get("/api/medicines")
async def get_public_medicines(
    q: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Search and paginate public medicine catalog records."""
    if limit <= 0 or limit > 500:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="limit must be between 1 and 500",
        )

    try:
        cache_key = f"medicines:list:{q or ''}:{skip}:{limit}"
        cached = cache_service.get_json(cache_key)
        if cached is not None:
            return cached

        medicine_service = MedicineService(db)
        payload = medicine_service.search_medicines(q=q, skip=skip, limit=limit)
        cache_service.set_json(cache_key, payload, ttl_seconds=900)
        return payload
    except Exception as e:
        logger.exception("Failed to fetch medicines")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch medicines",
        )


@app.get("/api/medicines/count")
async def get_public_medicine_count(
    q: str | None = None,
    db: Session = Depends(get_db),
):
    """Return total public medicine count, optionally filtered by search query."""
    try:
        cache_key = f"medicines:count:{q or ''}"
        cached = cache_service.get_json(cache_key)
        if cached is not None:
            return cached

        medicine_service = MedicineService(db)
        payload = {"total": medicine_service.get_public_medicine_count(q=q)}
        cache_service.set_json(cache_key, payload, ttl_seconds=900)
        return payload
    except Exception as e:
        logger.exception("Failed to fetch medicine count")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch medicine count",
        )


@app.get("/api/medicines/{code_pct}")
async def get_public_medicine_by_code_pct(
    code_pct: str,
    db: Session = Depends(get_db),
):
    """Get a specific medicine by its business identifier code_pct."""
    try:
        cache_key = f"medicines:by-code:{code_pct}"
        cached = cache_service.get_json(cache_key)
        if cached is not None:
            return cached

        medicine_service = MedicineService(db)
        payload = medicine_service.get_medicine_by_code_pct(code_pct)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Medicine with code_pct {code_pct} not found",
            )

        cache_service.set_json(cache_key, payload, ttl_seconds=3600)
        return payload
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to fetch medicine")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch medicine",
        )

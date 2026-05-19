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
from math import atan2, cos, radians, sin, sqrt

import models
from database import engine, get_db
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from events import register_default_listeners
from routers import auth, admin, analytics
from schema_migrations import run_schema_migrations
from services import CacheService
from services.garde_service import GardeService
from services.medicine_service import MedicineService
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy import or_
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
    origins = _csv_env("CORS_ORIGINS", defaults)
    frontend_url = os.getenv("FRONTEND_URL")
    if frontend_url:
        origins.append(frontend_url.strip())

    if _is_production():
        bad_origins = [origin for origin in origins if origin == "*" or origin.startswith("http://")]
        if bad_origins:
            raise RuntimeError("Production CORS origins must be explicit HTTPS origins")

    return sorted(set(origins))


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


def _distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Compute distance between two coordinates using the Haversine formula."""
    earth_radius_km = 6371.0

    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = (
        sin(dlat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    )
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return earth_radius_km * c

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


# ---- PUBLIC PHARMACIES API (no authentication required) ----
@app.get("/api/pharmacies")
async def get_all_pharmacies(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Get all pharmacies (public endpoint - no authentication required).
    
    Useful for mobile app and public website. Returns paginated list of pharmacies.
    """
    try:
        cache_key = f"pharmacies:list:{skip}:{limit}"
        cached = cache_service.get_json(cache_key)
        if cached is not None:
            return cached

        pharmacies = (
            db.query(models.Pharmacie)
            .order_by(models.Pharmacie.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        
        # Convert to dict format for API response
        result = []
        for pharmacy in pharmacies:
            result.append({
                "id": pharmacy.id,
                "osm_type": pharmacy.osm_type,
                "osm_id": pharmacy.osm_id,
                "name": pharmacy.name,
                "address": pharmacy.address,
                "phone": pharmacy.phone,
                "governorate": pharmacy.governorate,
                "latitude": pharmacy.latitude,
                "longitude": pharmacy.longitude,
                "created_at": pharmacy.created_at.isoformat() if pharmacy.created_at else None,
            })

        cache_service.set_json(cache_key, result, ttl_seconds=3600)
        return result
    except Exception as e:
        logger.exception("Failed to fetch pharmacies")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch pharmacies",
        )


@app.get("/api/pharmacies/count")
async def get_all_pharmacies_count(
    db: Session = Depends(get_db),
):
    """
    Get total count of pharmacies (public endpoint - no authentication required).
    """
    try:
        cache_key = "pharmacies:count"
        cached = cache_service.get_json(cache_key)
        if cached is not None:
            return cached

        count = db.query(models.Pharmacie).count()
        payload = {"total": count}
        cache_service.set_json(cache_key, payload, ttl_seconds=3600)
        return payload
    except Exception as e:
        logger.exception("Failed to get pharmacy count")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get pharmacy count",
        )


@app.get("/api/pharmacies/search")
async def search_pharmacies(
    query: str | None = None,
    governorate: str | None = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Search pharmacies by name, address, and governorate."""
    normalized_query = (query or "").strip()
    normalized_governorate = (governorate or "").strip()

    if not normalized_query and not normalized_governorate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide query or governorate to search pharmacies",
        )

    if limit <= 0 or limit > 500:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="limit must be between 1 and 500",
        )

    try:
        cache_key = (
            "pharmacies:search:"
            f"{normalized_query.lower()}:{normalized_governorate.lower()}:{limit}"
        )
        cached = cache_service.get_json(cache_key)
        if cached is not None:
            analytics.record_search_event(
                db,
                event_type="pharmacy_text_search",
                query_text=normalized_query or None,
                location_label=normalized_governorate or normalized_query or None,
                governorate=normalized_governorate or None,
                result_count=len(cached),
            )
            return cached

        search_query = db.query(models.Pharmacie)

        if normalized_query:
            like_term = f"%{normalized_query}%"
            search_query = search_query.filter(
                or_(
                    models.Pharmacie.name.ilike(like_term),
                    models.Pharmacie.address.ilike(like_term),
                    models.Pharmacie.governorate.ilike(like_term),
                )
            )

        if normalized_governorate:
            governorate_like = f"%{normalized_governorate}%"
            search_query = search_query.filter(
                models.Pharmacie.governorate.ilike(governorate_like)
            )

        pharmacies = (
            search_query.order_by(models.Pharmacie.name.asc(), models.Pharmacie.id.asc())
            .limit(limit)
            .all()
        )

        payload = [
            {
                "id": pharmacy.id,
                "osm_type": pharmacy.osm_type,
                "osm_id": pharmacy.osm_id,
                "name": pharmacy.name,
                "address": pharmacy.address,
                "phone": pharmacy.phone,
                "governorate": pharmacy.governorate,
                "latitude": pharmacy.latitude,
                "longitude": pharmacy.longitude,
                "created_at": pharmacy.created_at.isoformat() if pharmacy.created_at else None,
            }
            for pharmacy in pharmacies
        ]

        analytics.record_search_event(
            db,
            event_type="pharmacy_text_search",
            query_text=normalized_query or None,
            location_label=normalized_governorate or normalized_query or None,
            governorate=normalized_governorate or None,
            result_count=len(payload),
        )
        cache_service.set_json(cache_key, payload, ttl_seconds=600)
        return payload
    except Exception as e:
        logger.exception("Failed to search pharmacies")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search pharmacies",
        )


@app.get("/api/pharmacies/nearby")
async def get_nearby_pharmacies(
    lat: float,
    lon: float,
    radius_km: float = 10.0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """
    Get nearby pharmacies sorted by distance from user location.

    Public endpoint intended for mobile nearby-search use cases.
    Uses bounding box approximation for efficient database filtering.
    """
    if lat < -90 or lat > 90:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid latitude")
    if lon < -180 or lon > 180:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid longitude")
    if radius_km <= 0 or radius_km > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="radius_km must be between 0 and 100",
        )
    if limit <= 0 or limit > 500:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="limit must be between 1 and 500",
        )

    try:
        # Round coordinates for better cache hit rate
        lat_rounded = round(lat, 2)
        lon_rounded = round(lon, 2)
        radius_rounded = round(radius_km, 1)
        cache_key = f"pharmacies:nearby:{lat_rounded}:{lon_rounded}:{radius_rounded}:{limit}"
        
        cached = cache_service.get_json(cache_key)
        if cached is not None:
            nearest_governorate = cached[0]["governorate"] if cached else None
            analytics.record_search_event(
                db,
                event_type="nearby_pharmacy_search",
                location_label=nearest_governorate,
                governorate=nearest_governorate,
                latitude=lat,
                longitude=lon,
                result_count=len(cached),
            )
            return cached

        # Approximate bounding box (1 degree ≈ 111 km)
        # This filters at the database level for efficiency
        lat_delta = radius_km / 111.0
        lon_delta = radius_km / (111.0 * cos(radians(lat)))
        
        # Query with bounding box filter first (efficient database filter)
        # Then apply exact distance calculation on smaller subset
        pharmacies = (
            db.query(models.Pharmacie)
            .filter(models.Pharmacie.latitude.isnot(None))
            .filter(models.Pharmacie.longitude.isnot(None))
            .filter(models.Pharmacie.latitude >= lat - lat_delta)
            .filter(models.Pharmacie.latitude <= lat + lat_delta)
            .filter(models.Pharmacie.longitude >= lon - lon_delta)
            .filter(models.Pharmacie.longitude <= lon + lon_delta)
            .limit(limit * 5)  # Fetch more to account for bounding box overage
            .all()
        )

        # Apply exact distance calculation on the filtered subset
        nearby = []
        for pharmacy in pharmacies:
            distance = _distance_km(lat, lon, pharmacy.latitude, pharmacy.longitude)
            if distance <= radius_km:
                nearby.append(
                    {
                        "id": pharmacy.id,
                        "osm_type": pharmacy.osm_type,
                        "osm_id": pharmacy.osm_id,
                        "name": pharmacy.name,
                        "address": pharmacy.address,
                        "phone": pharmacy.phone,
                        "governorate": pharmacy.governorate,
                        "latitude": pharmacy.latitude,
                        "longitude": pharmacy.longitude,
                        "distance_km": round(distance, 3),
                        "created_at": pharmacy.created_at.isoformat() if pharmacy.created_at else None,
                    }
                )

        nearby.sort(key=lambda item: item["distance_km"])
        payload = nearby[:limit]
        nearest_governorate = payload[0]["governorate"] if payload else None
        analytics.record_search_event(
            db,
            event_type="nearby_pharmacy_search",
            location_label=nearest_governorate,
            governorate=nearest_governorate,
            latitude=lat,
            longitude=lon,
            result_count=len(payload),
        )
        cache_service.set_json(cache_key, payload, ttl_seconds=600)
        return payload
    except Exception as e:
        logger.exception("Failed to fetch nearby pharmacies")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch nearby pharmacies",
        )


@app.get("/api/pharmacies/{pharmacy_id}")
async def get_pharmacy_by_id(
    pharmacy_id: int,
    db: Session = Depends(get_db),
):
    """
    Get a specific pharmacy by ID (public endpoint - no authentication required).
    """
    try:
        cache_key = f"pharmacies:by-id:{pharmacy_id}"
        cached = cache_service.get_json(cache_key)
        if cached is not None:
            return cached

        pharmacy = db.query(models.Pharmacie).filter(models.Pharmacie.id == pharmacy_id).first()
        
        if not pharmacy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pharmacy with ID {pharmacy_id} not found",
            )
        
        payload = {
            "id": pharmacy.id,
            "osm_type": pharmacy.osm_type,
            "osm_id": pharmacy.osm_id,
            "name": pharmacy.name,
            "address": pharmacy.address,
            "phone": pharmacy.phone,
            "governorate": pharmacy.governorate,
            "latitude": pharmacy.latitude,
            "longitude": pharmacy.longitude,
            "created_at": pharmacy.created_at.isoformat() if pharmacy.created_at else None,
        }
        cache_service.set_json(cache_key, payload, ttl_seconds=3600)
        return payload
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to fetch pharmacy")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch pharmacy",
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

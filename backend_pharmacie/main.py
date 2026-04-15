"""PharmacieConnect FastAPI Application.

Main entry point for the pharmacy management system API.
Configures middleware, security, database, and routing.

Environment:
    DATABASE_URL: PostgreSQL connection string
    SECRET_KEY: JWT secret key for token signing
    DEBUG: Debug mode flag
"""

import os
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
from sqlalchemy.orm import Session

# Load environment variables
load_dotenv()

# Initialize and normalize the database schema on startup/import.
run_schema_migrations(engine)

app = FastAPI(
    title="PharmacieConnect API", version="2.0.0", description="Secure pharmacy management API"
)

cache_service = CacheService()
register_default_listeners()


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
    allowed_hosts=[
        "localhost:3000",
        "localhost:5173",
        "localhost:8000",
        "127.0.0.1:3000",
        "127.0.0.1:5173",
        "127.0.0.1:8000",
        "127.0.0.1",
        "localhost",
        "192.168.1.6:5173",  # Mobile app development
        "192.168.1.6:8000",  # Mobile app HTTP endpoint
        "192.168.1.6:3000",  # Alternative development URL
        "*",  # Allow all in development (don't use in production)
    ]
    + os.getenv("TRUSTED_HOSTS", "localhost").split(","),
)

# 2. CORS Middleware with strict settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
        "http://localhost",
        "http://127.0.0.1",
        "http://192.168.1.6:5173",  # Mobile app development
        "http://192.168.1.6:8000",  # Mobile app connections
        "http://192.168.1.6:3000",  # Alternative development URL
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
    ],
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch pharmacies: {str(e)}",
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get pharmacy count: {str(e)}",
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
        cache_key = f"pharmacies:nearby:{lat}:{lon}:{radius_km}:{limit}"
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

        pharmacies = (
            db.query(models.Pharmacie)
            .filter(models.Pharmacie.latitude.isnot(None), models.Pharmacie.longitude.isnot(None))
            .all()
        )

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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch nearby pharmacies: {str(e)}",
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch pharmacy: {str(e)}",
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch garde schedules: {str(e)}",
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch medicines: {str(e)}",
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch medicine count: {str(e)}",
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch medicine: {str(e)}",
        )

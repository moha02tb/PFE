"""Public pharmacy endpoints with open/closed status computation.

Status rules (Tunisia pharmacy regulations):
- Regular pharmacies: open Mon-Sat 08:00-19:00, closed Sunday
- Pharmacie de Nuit (name contains "الليل", "nuit", or "night"):
  open every day 19:00-08:00 (overnight)
- Pharmacie de Garde: defined per-day in garde_schedules table;
  hours come from each row's start_time/end_time
"""

import logging
from datetime import date, datetime, time, timedelta, timezone
from math import atan2, cos, radians, sin, sqrt
from typing import Optional

import models
from database import get_db
from fastapi import APIRouter, Depends, HTTPException, Query, status
from services import CacheService
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from routers import analytics

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/pharmacies", tags=["Pharmacies"])

# Tunisia is UTC+1 year-round (no DST since 2009)
TUNISIA_TZ = timezone(timedelta(hours=1))

NIGHT_KEYWORDS_LATIN = ("nuit", "night")
NIGHT_KEYWORD_AR = "الليل"

_cache_service = CacheService()


def _parse_time_str(value: str) -> Optional[time]:
    """Parse 'HH:MM' or 'HH:MM:SS' strings to a time object."""
    if not value:
        return None
    for fmt in ("%H:%M", "%H:%M:%S"):
        try:
            return datetime.strptime(value.strip(), fmt).time()
        except (TypeError, ValueError):
            continue
    return None


def _is_night_pharmacy(name: Optional[str]) -> bool:
    if not name:
        return False
    name_lower = name.lower()
    if NIGHT_KEYWORD_AR in name:
        return True
    return any(keyword in name_lower for keyword in NIGHT_KEYWORDS_LATIN)


def get_pharmacy_status(pharmacy: models.Pharmacie, garde_today=None) -> dict:
    """Compute current open/closed status for a pharmacy.

    Args:
        pharmacy: ORM pharmacy row.
        garde_today: optional GardeSchedule row for the current pharmacy today.

    Returns:
        Dict with is_open, type, label, label_ar, hours, optional closed_reason.
    """
    now = datetime.now(TUNISIA_TZ)
    current_time = now.time()
    current_day = now.weekday()  # Mon=0, Sun=6

    # PHARMACIE DE GARDE — takes precedence when scheduled for today
    if garde_today is not None:
        start = _parse_time_str(garde_today.start_time)
        end = _parse_time_str(garde_today.end_time)
        if start and end:
            if end <= start:  # overnight shift
                is_open = current_time >= start or current_time < end
            else:
                is_open = start <= current_time <= end
            return {
                "is_open": is_open,
                "type": "garde",
                "label": "Pharmacie de Garde",
                "label_ar": "صيدلية الحراسة",
                "hours": f"{start.strftime('%H:%M')} - {end.strftime('%H:%M')}",
                "closed_reason": None if is_open else "Hors horaires de garde",
            }

    # PHARMACIE DE NUIT — fixed night shift locations
    if _is_night_pharmacy(pharmacy.name):
        is_open = current_time >= time(19, 0) or current_time < time(8, 0)
        return {
            "is_open": is_open,
            "type": "nuit",
            "label": "Pharmacie de Nuit",
            "label_ar": "صيدلية الليل",
            "hours": "19:00 - 08:00",
            "closed_reason": None if is_open else "Ouvre à 19:00",
        }

    # REGULAR pharmacy
    if current_day == 6:  # Sunday
        return {
            "is_open": False,
            "type": "regular",
            "label": "Pharmacie",
            "label_ar": "صيدلية",
            "hours": "Lun-Sam 08:00 - 19:00",
            "closed_reason": "Fermée le dimanche",
        }

    is_open = time(8, 0) <= current_time <= time(19, 0)
    return {
        "is_open": is_open,
        "type": "regular",
        "label": "Pharmacie",
        "label_ar": "صيدلية",
        "hours": "Lun-Sam 08:00 - 19:00",
        "closed_reason": None if is_open else "Hors horaires",
    }


def _load_garde_map(db: Session, garde_date: date) -> dict:
    """Build {normalized_pharmacy_name: GardeSchedule} for a given day.

    A pharmacy on garde may have several shifts the same day (e.g. jour
    08:00-20:00 + nuit 20:00-08:00). The chosen row is the shift whose
    time window currently covers `now`; if none covers now (gap or
    parse failure), the first row is kept as a fallback.
    """
    rows = (
        db.query(models.GardeSchedule)
        .filter(models.GardeSchedule.date == garde_date)
        .all()
    )
    now_time = datetime.now(TUNISIA_TZ).time()
    by_name: dict[str, list] = {}
    for row in rows:
        if not row.pharmacy_name:
            continue
        by_name.setdefault(row.pharmacy_name.strip().lower(), []).append(row)

    chosen: dict = {}
    for key, shifts in by_name.items():
        active = None
        for shift in shifts:
            start = _parse_time_str(shift.start_time)
            end = _parse_time_str(shift.end_time)
            if not start or not end:
                continue
            covers = (
                now_time >= start or now_time < end
                if end <= start
                else start <= now_time <= end
            )
            if covers:
                active = shift
                break
        chosen[key] = active or shifts[0]
    return chosen


def _serialize_pharmacy(pharmacy: models.Pharmacie, status_info: dict) -> dict:
    return {
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
        "is_open": status_info["is_open"],
        "pharmacy_type": status_info["type"],
        "status_label": status_info["label"],
        "status_label_ar": status_info["label_ar"],
        "working_hours": status_info["hours"],
        "closed_reason": status_info.get("closed_reason"),
    }


def _distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance between two coordinates in kilometers."""
    earth_radius_km = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = (
        sin(dlat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    )
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return earth_radius_km * c


def _resolve_pharmacy_type(pharmacy: models.Pharmacie, garde_map: dict) -> str:
    key = (pharmacy.name or "").strip().lower()
    if key and key in garde_map:
        return "garde"
    if _is_night_pharmacy(pharmacy.name):
        return "nuit"
    return "regular"


# ---------------------------------------------------------------------------
# Listing endpoint with status, filters, and pagination
# ---------------------------------------------------------------------------
@router.get("")
@router.get("/")
async def list_pharmacies(
    skip: int = 0,
    limit: int = 100,
    open_now: Optional[bool] = Query(None),
    type: Optional[str] = Query(None, pattern="^(regular|nuit|garde)$"),
    governorate: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List pharmacies with computed status fields and optional filters."""
    if limit <= 0 or limit > 500:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="limit must be between 1 and 500",
        )

    try:
        today = datetime.now(TUNISIA_TZ).date()
        garde_map = _load_garde_map(db, today)

        # When filtering by type, fetch a wider pool then filter in Python
        # (type isn't a stored column — it's derived from name/garde_map).
        fetch_limit = limit if type is None and open_now is None else 5000

        query = db.query(models.Pharmacie)
        if governorate:
            query = query.filter(
                models.Pharmacie.governorate.ilike(f"%{governorate.strip()}%")
            )

        pharmacies = (
            query.order_by(models.Pharmacie.created_at.desc())
            .offset(skip if type is None and open_now is None else 0)
            .limit(fetch_limit)
            .all()
        )

        result = []
        for pharmacy in pharmacies:
            key = (pharmacy.name or "").strip().lower()
            garde_today = garde_map.get(key) if key else None
            status_info = get_pharmacy_status(pharmacy, garde_today)

            if type and status_info["type"] != type:
                continue
            if open_now is True and not status_info["is_open"]:
                continue
            if open_now is False and status_info["is_open"]:
                continue

            result.append(_serialize_pharmacy(pharmacy, status_info))

        # When filtering, apply pagination after derivation
        if type is not None or open_now is not None:
            result = result[skip : skip + limit]

        return result
    except Exception:
        logger.exception("Failed to fetch pharmacies")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch pharmacies",
        )


# ---------------------------------------------------------------------------
# Count endpoint (no status — cheap and cacheable)
# ---------------------------------------------------------------------------
@router.get("/count")
async def count_pharmacies(db: Session = Depends(get_db)):
    try:
        cache_key = "pharmacies:count"
        cached = _cache_service.get_json(cache_key)
        if cached is not None:
            return cached

        count = db.query(models.Pharmacie).count()
        payload = {"total": count}
        _cache_service.set_json(cache_key, payload, ttl_seconds=3600)
        return payload
    except Exception:
        logger.exception("Failed to get pharmacy count")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get pharmacy count",
        )


# ---------------------------------------------------------------------------
# Search endpoint
# ---------------------------------------------------------------------------
@router.get("/search")
async def search_pharmacies(
    query: Optional[str] = None,
    governorate: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Search pharmacies by name, address, or governorate, with status."""
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
        today = datetime.now(TUNISIA_TZ).date()
        garde_map = _load_garde_map(db, today)

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
            search_query = search_query.filter(
                models.Pharmacie.governorate.ilike(f"%{normalized_governorate}%")
            )

        pharmacies = (
            search_query.order_by(
                models.Pharmacie.name.asc(), models.Pharmacie.id.asc()
            )
            .limit(limit)
            .all()
        )

        payload = []
        for pharmacy in pharmacies:
            key = (pharmacy.name or "").strip().lower()
            garde_today = garde_map.get(key) if key else None
            status_info = get_pharmacy_status(pharmacy, garde_today)
            payload.append(_serialize_pharmacy(pharmacy, status_info))

        analytics.record_search_event(
            db,
            event_type="pharmacy_text_search",
            query_text=normalized_query or None,
            location_label=normalized_governorate or normalized_query or None,
            governorate=normalized_governorate or None,
            result_count=len(payload),
        )
        return payload
    except Exception:
        logger.exception("Failed to search pharmacies")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search pharmacies",
        )


# ---------------------------------------------------------------------------
# Nearby endpoint
# ---------------------------------------------------------------------------
@router.get("/nearby")
async def get_nearby_pharmacies(
    lat: float,
    lon: float,
    radius_km: float = 10.0,
    limit: int = 50,
    open_now: Optional[bool] = Query(None),
    type: Optional[str] = Query(None, pattern="^(regular|nuit|garde)$"),
    db: Session = Depends(get_db),
):
    """Pharmacies near (lat, lon) sorted by distance, with status."""
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
        today = datetime.now(TUNISIA_TZ).date()
        garde_map = _load_garde_map(db, today)

        lat_delta = radius_km / 111.0
        lon_delta = radius_km / (111.0 * cos(radians(lat)) or 1.0)

        pharmacies = (
            db.query(models.Pharmacie)
            .filter(models.Pharmacie.latitude.isnot(None))
            .filter(models.Pharmacie.longitude.isnot(None))
            .filter(models.Pharmacie.latitude >= lat - lat_delta)
            .filter(models.Pharmacie.latitude <= lat + lat_delta)
            .filter(models.Pharmacie.longitude >= lon - lon_delta)
            .filter(models.Pharmacie.longitude <= lon + lon_delta)
            .limit(limit * 5)
            .all()
        )

        nearby = []
        for pharmacy in pharmacies:
            distance = _distance_km(lat, lon, pharmacy.latitude, pharmacy.longitude)
            if distance > radius_km:
                continue

            key = (pharmacy.name or "").strip().lower()
            garde_today = garde_map.get(key) if key else None
            status_info = get_pharmacy_status(pharmacy, garde_today)

            if type and status_info["type"] != type:
                continue
            if open_now is True and not status_info["is_open"]:
                continue
            if open_now is False and status_info["is_open"]:
                continue

            serialized = _serialize_pharmacy(pharmacy, status_info)
            serialized["distance_km"] = round(distance, 3)
            nearby.append(serialized)

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
        return payload
    except Exception:
        logger.exception("Failed to fetch nearby pharmacies")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch nearby pharmacies",
        )


# ---------------------------------------------------------------------------
# Dedicated garde endpoints — must be declared BEFORE /{pharmacy_id}
# ---------------------------------------------------------------------------
FRENCH_DAY_NAMES = (
    "Lundi", "Mardi", "Mercredi", "Jeudi",
    "Vendredi", "Samedi", "Dimanche",
)


def _garde_payload_for_date(db: Session, garde_date: date) -> dict:
    """Build the response payload for /garde/today and /garde/tomorrow."""
    rows = (
        db.query(models.GardeSchedule)
        .filter(models.GardeSchedule.date == garde_date)
        .order_by(
            models.GardeSchedule.start_time.asc(),
            models.GardeSchedule.created_at.desc(),
        )
        .all()
    )

    today = datetime.now(TUNISIA_TZ).date()
    current_time = datetime.now(TUNISIA_TZ).time()

    # Build a (name_lower, governorate_lower) -> Pharmacie map so rows that
    # share a case-insensitive pharmacy name across governorates (e.g.
    # "Pharmacie du jour" exists in both Zaghouan and Ben Arous) resolve to
    # the correct row. Fall back to name-only when no governorate match.
    pharmacy_by_name_gov: dict[tuple[str, str], models.Pharmacie] = {}
    pharmacy_by_name: dict[str, models.Pharmacie] = {}
    if rows:
        normalized_names = list(
            {row.pharmacy_name.strip().lower() for row in rows if row.pharmacy_name}
        )
        pharmacies = (
            db.query(models.Pharmacie)
            .filter(
                or_(
                    *[
                        func.lower(models.Pharmacie.name) == name
                        for name in normalized_names
                    ]
                )
            )
            .all()
            if normalized_names
            else []
        )
        for pharmacy in pharmacies:
            if not pharmacy.name:
                continue
            name_key = pharmacy.name.strip().lower()
            gov_key = (pharmacy.governorate or "").strip().lower()
            pharmacy_by_name_gov[(name_key, gov_key)] = pharmacy
            pharmacy_by_name.setdefault(name_key, pharmacy)

    items = []
    for row in rows:
        name_key = row.pharmacy_name.strip().lower() if row.pharmacy_name else ""
        gov_key = (row.governorate or "").strip().lower()
        pharmacy = pharmacy_by_name_gov.get((name_key, gov_key)) or pharmacy_by_name.get(name_key)

        start = _parse_time_str(row.start_time)
        end = _parse_time_str(row.end_time)
        if start and end and garde_date == today:
            if end <= start:
                is_open = current_time >= start or current_time < end
            else:
                is_open = start <= current_time <= end
        else:
            is_open = False  # future or unparsable

        items.append(
            {
                "id": row.id,
                "name": row.pharmacy_name,
                "address": pharmacy.address if pharmacy else None,
                "phone": pharmacy.phone if pharmacy else None,
                "latitude": pharmacy.latitude if pharmacy else None,
                "longitude": pharmacy.longitude if pharmacy else None,
                "governorate": (
                    pharmacy.governorate if pharmacy else row.governorate
                ),
                "city": row.city,
                "start_time": row.start_time,
                "end_time": row.end_time,
                "shift_type": row.shift_type,
                "is_open": is_open,
            }
        )

    return {
        "date": garde_date.isoformat(),
        "day_name": FRENCH_DAY_NAMES[garde_date.weekday()],
        "count": len(items),
        "pharmacies": items,
    }


@router.get("/garde/today")
async def get_garde_today(db: Session = Depends(get_db)):
    """Today's garde pharmacies enriched with pharmacy details."""
    try:
        today = datetime.now(TUNISIA_TZ).date()
        return _garde_payload_for_date(db, today)
    except Exception:
        logger.exception("Failed to fetch today's garde pharmacies")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch today's garde pharmacies",
        )


@router.get("/garde/tomorrow")
async def get_garde_tomorrow(db: Session = Depends(get_db)):
    """Tomorrow's garde pharmacies (for planning ahead)."""
    try:
        tomorrow = datetime.now(TUNISIA_TZ).date() + timedelta(days=1)
        return _garde_payload_for_date(db, tomorrow)
    except Exception:
        logger.exception("Failed to fetch tomorrow's garde pharmacies")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch tomorrow's garde pharmacies",
        )


# ---------------------------------------------------------------------------
# By-id endpoint (declared LAST so it doesn't shadow /garde/*, /search, etc.)
# ---------------------------------------------------------------------------
@router.get("/{pharmacy_id}")
async def get_pharmacy_by_id(
    pharmacy_id: int,
    db: Session = Depends(get_db),
):
    """Fetch a single pharmacy by ID with computed status."""
    try:
        pharmacy = (
            db.query(models.Pharmacie)
            .filter(models.Pharmacie.id == pharmacy_id)
            .first()
        )

        if not pharmacy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pharmacy with ID {pharmacy_id} not found",
            )

        today = datetime.now(TUNISIA_TZ).date()
        garde_today = None
        if pharmacy.name:
            garde_today = (
                db.query(models.GardeSchedule)
                .filter(models.GardeSchedule.date == today)
                .filter(
                    func.lower(models.GardeSchedule.pharmacy_name)
                    == pharmacy.name.strip().lower()
                )
                .first()
            )

        status_info = get_pharmacy_status(pharmacy, garde_today)
        return _serialize_pharmacy(pharmacy, status_info)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to fetch pharmacy")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch pharmacy",
        )

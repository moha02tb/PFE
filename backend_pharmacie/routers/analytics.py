"""Analytics routes and helpers for admin dashboards and public telemetry."""

from datetime import datetime, timedelta, timezone

import models
import schemas
from database import get_db
from dependencies import admin_required
from fastapi import APIRouter, Depends
from models import Administrateur
from sqlalchemy import case, func
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/admin/analytics", tags=["Admin Analytics"])
public_router = APIRouter(prefix="/api/analytics", tags=["Public Analytics"])

TUNISIA_GOVERNORATES = (
    "Ariana",
    "Béja",
    "Ben Arous",
    "Bizerte",
    "Gabès",
    "Gafsa",
    "Jendouba",
    "Kairouan",
    "Kasserine",
    "Kebili",
    "Kef",
    "Mahdia",
    "Manouba",
    "Medenine",
    "Monastir",
    "Nabeul",
    "Sfax",
    "Sidi Bouzid",
    "Siliana",
    "Sousse",
    "Tataouine",
    "Tozeur",
    "Tunis",
    "Zaghouan",
)


def _iso(dt):
    if isinstance(dt, str):
        return dt
    return dt.isoformat() if dt else None


def _day_bucket(db: Session, column):
    """Return a DB-compatible day grouping expression."""
    if db.bind and db.bind.dialect.name == "sqlite":
        return func.date(column)
    return func.date_trunc("day", column)


def _normalize_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def record_search_event(
    db: Session,
    *,
    event_type: str,
    query_text: str | None = None,
    location_label: str | None = None,
    governorate: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    result_count: int | None = None,
) -> models.SearchEvent:
    """Persist a public search event for later analytics aggregation."""
    event = models.SearchEvent(
        event_type=event_type.strip(),
        query_text=_normalize_text(query_text),
        location_label=_normalize_text(location_label),
        governorate=_normalize_text(governorate),
        latitude=latitude,
        longitude=longitude,
        result_count=result_count,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@public_router.post("/search-events", status_code=201)
async def create_search_event(payload: schemas.SearchEventCreate, db: Session = Depends(get_db)):
    """Collect app search telemetry for admin analytics."""
    event = record_search_event(
        db,
        event_type=payload.event_type,
        query_text=payload.query_text,
        location_label=payload.location_label,
        governorate=payload.governorate,
        latitude=payload.latitude,
        longitude=payload.longitude,
        result_count=payload.result_count,
    )
    return {"id": event.id, "created_at": _iso(event.created_at)}


@router.get("/dashboard")
async def analytics_dashboard(
    current_admin: Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    """Return actionable admin metrics for system operations."""
    now = datetime.now(timezone.utc)
    start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    d7 = now - timedelta(days=7)
    d30 = now - timedelta(days=30)
    d90 = now - timedelta(days=90)

    users_total = db.query(models.Utilisateur).count()
    admins_total = db.query(models.Administrateur).count()
    pharmacies_total = db.query(models.Pharmacie).count()
    gardes_total = db.query(models.GardeSchedule).count()
    unverified_users_total = (
        db.query(models.Utilisateur)
        .filter(models.Utilisateur.email_verified.is_(False))
        .count()
    )

    users_7d = db.query(models.Utilisateur).filter(models.Utilisateur.created_at >= d7).count()
    users_30d = db.query(models.Utilisateur).filter(models.Utilisateur.created_at >= d30).count()
    users_90d = db.query(models.Utilisateur).filter(models.Utilisateur.created_at >= d90).count()

    login_success_30d = (
        db.query(models.LoginAttempt)
        .filter(models.LoginAttempt.success.is_(True), models.LoginAttempt.attempted_at >= d30)
        .count()
    )
    login_failed_30d = (
        db.query(models.LoginAttempt)
        .filter(models.LoginAttempt.success.is_(False), models.LoginAttempt.attempted_at >= d30)
        .count()
    )

    pharmacy_counts = (
        db.query(models.Pharmacie.governorate, func.count(models.Pharmacie.id).label("count"))
        .group_by(models.Pharmacie.governorate)
        .order_by(func.count(models.Pharmacie.id).desc())
        .all()
    )
    top_governorates = [
        {"governorate": row[0], "count": int(row[1])}
        for row in pharmacy_counts
        if row[0]
    ][:10]
    covered_governorates = {row[0] for row in pharmacy_counts if row[0]}
    missing_governorates = [
        governorate
        for governorate in TUNISIA_GOVERNORATES
        if governorate not in covered_governorates
    ]
    pharmacies_missing_governorate = (
        db.query(models.Pharmacie)
        .filter(
            (models.Pharmacie.governorate.is_(None))
            | (func.trim(models.Pharmacie.governorate) == "")
        )
        .count()
    )

    recent_uploads = (
        db.query(models.AuditLog)
        .filter(
            models.AuditLog.action == models.AuditActionEnum.PHARMACY_BULK_UPLOAD,
            models.AuditLog.created_at >= d30,
        )
        .count()
    )
    garde_uploads = (
        db.query(models.AuditLog)
        .filter(
            models.AuditLog.action == models.AuditActionEnum.GARDE_BULK_UPLOAD,
            models.AuditLog.created_at >= d30,
        )
        .count()
    )

    search_today = (
        db.query(models.SearchEvent)
        .filter(models.SearchEvent.created_at >= start_today)
        .count()
    )
    search_day = _day_bucket(db, models.SearchEvent.created_at)
    search_daily_rows = (
        db.query(search_day.label("day"), func.count(models.SearchEvent.id).label("count"))
        .filter(models.SearchEvent.created_at >= d7)
        .group_by(search_day)
        .order_by(search_day)
        .all()
    )
    search_daily = [{"day": _iso(row[0]), "count": int(row[1])} for row in search_daily_rows]
    searches_last_7_days = sum(item["count"] for item in search_daily)
    avg_searches_per_day_7d = round(searches_last_7_days / 7, 2)

    top_locations = (
        db.query(
            func.coalesce(
                func.nullif(models.SearchEvent.location_label, ""),
                func.nullif(models.SearchEvent.governorate, ""),
                func.nullif(models.SearchEvent.query_text, ""),
            ).label("label"),
            func.count(models.SearchEvent.id).label("count"),
        )
        .filter(models.SearchEvent.created_at >= d30)
        .group_by("label")
        .order_by(func.count(models.SearchEvent.id).desc())
        .limit(5)
        .all()
    )

    return {
        "generated_at": _iso(now),
        "totals": {
            "users": users_total,
            "admins": admins_total,
            "pharmacies": pharmacies_total,
            "gardes": gardes_total,
        },
        "growth": {
            "users_last_7_days": users_7d,
            "users_last_30_days": users_30d,
            "users_last_90_days": users_90d,
        },
        "auth": {
            "login_success_last_30_days": login_success_30d,
            "login_failed_last_30_days": login_failed_30d,
            "unverified_users": unverified_users_total,
        },
        "searches": {
            "today": search_today,
            "last_7_days": searches_last_7_days,
            "average_per_day_last_7_days": avg_searches_per_day_7d,
            "daily": search_daily,
            "top_locations_last_30_days": [
                {"location": row[0], "count": int(row[1])}
                for row in top_locations
                if row[0]
            ],
        },
        "pharmacies": {
            "top_governorates": top_governorates,
            "bulk_uploads_last_30_days": recent_uploads,
            "missing_governorate_entries": pharmacies_missing_governorate,
        },
        "coverage": {
            "total_known_governorates": len(TUNISIA_GOVERNORATES),
            "covered_governorates": len(covered_governorates),
            "coverage_percent": round(
                (len(covered_governorates) / len(TUNISIA_GOVERNORATES)) * 100, 2
            ),
            "missing_governorates": missing_governorates,
        },
        "gardes": {
            "bulk_uploads_last_30_days": garde_uploads,
        },
    }


@router.get("/activity")
async def analytics_activity(
    days: int = 30,
    current_admin: Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    """Return time-series style activity metrics for charts."""
    if days < 1:
        days = 1
    if days > 365:
        days = 365

    since = datetime.now(timezone.utc) - timedelta(days=days)
    user_day = _day_bucket(db, models.Utilisateur.created_at)
    login_day = _day_bucket(db, models.LoginAttempt.attempted_at)
    audit_day = _day_bucket(db, models.AuditLog.created_at)
    search_event_day = _day_bucket(db, models.SearchEvent.created_at)

    user_registration_series = (
        db.query(
            user_day.label("day"),
            func.count(models.Utilisateur.id).label("count"),
        )
        .filter(models.Utilisateur.created_at >= since)
        .group_by(user_day)
        .order_by(user_day)
        .all()
    )

    login_series = (
        db.query(
            login_day.label("day"),
            func.sum(case((models.LoginAttempt.success.is_(True), 1), else_=0)).label(
                "success_count"
            ),
            func.sum(case((models.LoginAttempt.success.is_(False), 1), else_=0)).label(
                "failed_count"
            ),
        )
        .filter(models.LoginAttempt.attempted_at >= since)
        .group_by(login_day)
        .order_by(login_day)
        .all()
    )

    admin_actions = (
        db.query(
            audit_day.label("day"),
            func.count(models.AuditLog.id).label("count"),
        )
        .filter(models.AuditLog.actor_type == "administrateur", models.AuditLog.created_at >= since)
        .group_by(audit_day)
        .order_by(audit_day)
        .all()
    )

    search_series = (
        db.query(
            search_event_day.label("day"),
            func.count(models.SearchEvent.id).label("count"),
        )
        .filter(models.SearchEvent.created_at >= since)
        .group_by(search_event_day)
        .order_by(search_event_day)
        .all()
    )

    return {
        "range_days": days,
        "since": _iso(since),
        "user_registrations": [{"day": _iso(r[0]), "count": int(r[1])} for r in user_registration_series],
        "logins": [
            {
                "day": _iso(r[0]),
                "success": int(r[1] or 0),
                "failed": int(r[2] or 0),
            }
            for r in login_series
        ],
        "admin_actions": [{"day": _iso(r[0]), "count": int(r[1])} for r in admin_actions],
        "searches": [{"day": _iso(r[0]), "count": int(r[1])} for r in search_series],
    }

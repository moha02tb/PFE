"""Admin analytics routes.

Provides dashboard and activity metrics for admin users.
"""

from datetime import datetime, timedelta, timezone

import models
from database import get_db
from dependencies import admin_required
from fastapi import APIRouter, Depends
from models import Administrateur
from sqlalchemy import case, func
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/admin/analytics", tags=["Admin Analytics"])


def _iso(dt):
    return dt.isoformat() if dt else None


@router.get("/dashboard")
async def analytics_dashboard(
    current_admin: Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    """Return high-level system metrics for admin dashboards.

    Includes user/admin/pharmacy totals, login outcomes, and growth windows.
    """
    now = datetime.now(timezone.utc)
    d7 = now - timedelta(days=7)
    d30 = now - timedelta(days=30)
    d90 = now - timedelta(days=90)

    users_total = db.query(models.Utilisateur).count()
    admins_total = db.query(models.Administrateur).count()
    pharmacies_total = db.query(models.Pharmacie).count()

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

    top_governorates = (
        db.query(models.Pharmacie.governorate, func.count(models.Pharmacie.id).label("count"))
        .group_by(models.Pharmacie.governorate)
        .order_by(func.count(models.Pharmacie.id).desc())
        .limit(10)
        .all()
    )

    recent_uploads = (
        db.query(models.AuditLog)
        .filter(
            models.AuditLog.action == models.AuditActionEnum.PHARMACY_BULK_UPLOAD,
            models.AuditLog.created_at >= d30,
        )
        .count()
    )

    return {
        "generated_at": _iso(now),
        "totals": {
            "users": users_total,
            "admins": admins_total,
            "pharmacies": pharmacies_total,
        },
        "growth": {
            "users_last_7_days": users_7d,
            "users_last_30_days": users_30d,
            "users_last_90_days": users_90d,
        },
        "auth": {
            "login_success_last_30_days": login_success_30d,
            "login_failed_last_30_days": login_failed_30d,
        },
        "pharmacies": {
            "top_governorates": [
                {"governorate": row[0], "count": row[1]} for row in top_governorates
            ],
            "bulk_uploads_last_30_days": recent_uploads,
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

    user_registration_series = (
        db.query(
            func.date_trunc("day", models.Utilisateur.created_at).label("day"),
            func.count(models.Utilisateur.id).label("count"),
        )
        .filter(models.Utilisateur.created_at >= since)
        .group_by(func.date_trunc("day", models.Utilisateur.created_at))
        .order_by(func.date_trunc("day", models.Utilisateur.created_at))
        .all()
    )

    login_series = (
        db.query(
            func.date_trunc("day", models.LoginAttempt.attempted_at).label("day"),
            func.sum(case((models.LoginAttempt.success.is_(True), 1), else_=0)).label(
                "success_count"
            ),
            func.sum(case((models.LoginAttempt.success.is_(False), 1), else_=0)).label(
                "failed_count"
            ),
        )
        .filter(models.LoginAttempt.attempted_at >= since)
        .group_by(func.date_trunc("day", models.LoginAttempt.attempted_at))
        .order_by(func.date_trunc("day", models.LoginAttempt.attempted_at))
        .all()
    )

    admin_actions = (
        db.query(
            func.date_trunc("day", models.AuditLog.created_at).label("day"),
            func.count(models.AuditLog.id).label("count"),
        )
        .filter(models.AuditLog.actor_type == "administrateur", models.AuditLog.created_at >= since)
        .group_by(func.date_trunc("day", models.AuditLog.created_at))
        .order_by(func.date_trunc("day", models.AuditLog.created_at))
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
    }

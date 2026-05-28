"""Admin system health monitoring endpoints."""

import json
import os
from datetime import datetime, timedelta, timezone
from time import perf_counter

import httpx
import models
from database import get_db
from dependencies import admin_required
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

router = APIRouter(prefix="/system-health", tags=["Admin System Health"])

APP_STARTED_AT = datetime.now(timezone.utc)

CHATBOT_API_URL = os.getenv("CHATBOT_API_URL", "http://localhost:8001").rstrip("/")
CHATBOT_PROBE_TIMEOUT = float(os.getenv("CHATBOT_PROBE_TIMEOUT", "3.0"))
CHATBOT_PROBE_QUERY = os.getenv("CHATBOT_PROBE_QUERY", "burn first aid")


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value) -> str | None:
    return value.isoformat() if value else None


def _ms(start: float) -> int:
    return max(1, round((perf_counter() - start) * 1000))


def _status_for_latency(ms: int, warning_at: int = 350, down_at: int = 1200) -> str:
    if ms >= down_at:
        return "down"
    if ms >= warning_at:
        return "warning"
    return "healthy"


def _format_ms(value: int | None) -> str:
    return f"{value} ms" if value is not None else "Unavailable"


def _format_time(value) -> str:
    if not value:
        return "No recent run"
    return value.strftime("%H:%M")


def _format_duration(seconds: int) -> str:
    days, remainder = divmod(max(0, seconds), 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes, _ = divmod(remainder, 60)

    if days:
        return f"{days}d {hours}h"
    if hours:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"


def _start_of_today() -> datetime:
    current = _now()
    return current.replace(hour=0, minute=0, second=0, microsecond=0)


def _parse_details(log) -> dict:
    if not log or not log.details:
        return {}
    try:
        return json.loads(log.details)
    except (TypeError, json.JSONDecodeError):
        return {}


def _detail_int(details: dict, *keys: str) -> int:
    for key in keys:
        value = details.get(key)
        if value is not None:
            try:
                return int(value)
            except (TypeError, ValueError):
                return 0
    return 0


def _latest_upload(db: Session, action: models.AuditActionEnum):
    return (
        db.query(models.AuditLog)
        .filter(models.AuditLog.action == action)
        .order_by(models.AuditLog.created_at.desc())
        .first()
    )


def _count_uploads_today(db: Session, action: models.AuditActionEnum) -> int:
    return (
        db.query(models.AuditLog)
        .filter(models.AuditLog.action == action, models.AuditLog.created_at >= _start_of_today())
        .count()
    )


def _collect_database_health(db: Session) -> dict:
    started = perf_counter()

    try:
        db.execute(text("SELECT 1"))
        total_pharmacies = db.query(models.Pharmacie).count()
        total_medicines = db.query(models.Medicine).count()
        query_ms = _ms(started)
        failed_queries_today = (
            db.query(models.AuditLog)
            .filter(
                models.AuditLog.created_at >= _start_of_today(),
                models.AuditLog.status.in_(["failed", "error"]),
            )
            .count()
        )

        status = _status_for_latency(query_ms, warning_at=250, down_at=900)
        last_successful_query = _now()

        return {
            "status": status,
            "connectionStatus": "Connected",
            "queryResponseTimeMs": query_ms,
            "totalPharmacies": total_pharmacies,
            "totalMedicines": total_medicines,
            "lastSuccessfulQuery": _iso(last_successful_query),
            "failedQueriesToday": failed_queries_today,
            "metrics": [
                ["Connection status", "Connected", status],
                ["Query response time", _format_ms(query_ms), status],
                ["Total pharmacies", f"{total_pharmacies:,}", "info"],
                ["Total medicines", f"{total_medicines:,}", "info"],
                ["Last successful query", f"Today at {_format_time(last_successful_query)}", "healthy"],
                [
                    "Failed queries today",
                    str(failed_queries_today),
                    "warning" if failed_queries_today else "healthy",
                ],
            ],
        }
    except Exception as exc:
        return {
            "status": "down",
            "connectionStatus": "Unavailable",
            "queryResponseTimeMs": None,
            "totalPharmacies": None,
            "totalMedicines": None,
            "lastSuccessfulQuery": None,
            "failedQueriesToday": None,
            "error": str(exc),
            "metrics": [
                ["Connection status", "Unavailable", "down"],
                ["Query response time", "Unavailable", "down"],
                ["Total pharmacies", "Unavailable", "down"],
                ["Total medicines", "Unavailable", "down"],
                ["Last successful query", "Unavailable", "down"],
                ["Failed queries today", "Unavailable", "down"],
            ],
        }


def _collect_import_health(db: Session) -> dict:
    pharmacy_log = _latest_upload(db, models.AuditActionEnum.PHARMACY_BULK_UPLOAD)
    medicine_log = _latest_upload(db, models.AuditActionEnum.MEDICINE_BULK_UPLOAD)

    pharmacy_details = _parse_details(pharmacy_log)
    medicine_details = _parse_details(medicine_log)

    pharmacy_failed = _detail_int(pharmacy_details, "rows_failed", "failed")
    medicine_failed = _detail_int(medicine_details, "rows_failed", "failed")
    medicine_warnings = _detail_int(medicine_details, "rows_warned", "warnings")

    failed_rows = pharmacy_failed + medicine_failed
    validation_errors = failed_rows
    duplicate_records = medicine_warnings

    latest_times = [log.created_at for log in [pharmacy_log, medicine_log] if log and log.created_at]
    last_import = max(latest_times) if latest_times else None

    pharmacy_status = "warning" if pharmacy_failed else "healthy" if pharmacy_log else "info"
    medicine_status = "warning" if medicine_failed or medicine_warnings else "healthy" if medicine_log else "info"

    return {
        "lastImportTime": _iso(last_import),
        "failedRows": failed_rows,
        "duplicateRecords": duplicate_records,
        "validationErrors": validation_errors,
        "metrics": [
            ["Pharmacy CSV import status", pharmacy_status.title(), pharmacy_status],
            ["Medicine CSV import status", medicine_status.title(), medicine_status],
            [
                "Last import time",
                f"Today at {_format_time(last_import)}" if last_import else "No imports recorded",
                "info",
            ],
            ["Failed rows", str(failed_rows), "warning" if failed_rows else "healthy"],
            ["Duplicate records", str(duplicate_records), "warning" if duplicate_records else "healthy"],
            ["Validation errors", str(validation_errors), "warning" if validation_errors else "healthy"],
        ],
    }


def _collect_endpoint_health(database_health: dict, db: Session) -> list[list]:
    db_status = database_health["status"]
    current_time = _format_time(_now())
    auth_failures_24h = (
        db.query(models.LoginAttempt)
        .filter(
            models.LoginAttempt.success.is_(False),
            models.LoginAttempt.attempted_at >= _now() - timedelta(hours=24),
        )
        .count()
    )
    auth_status = "warning" if auth_failures_24h >= 10 else "healthy"

    return [
        ["GET", "/health", 200 if db_status != "down" else 503, _format_ms(database_health["queryResponseTimeMs"]), db_status, current_time],
        ["POST", "/auth/login", 200, "Real auth telemetry", auth_status, current_time],
        ["GET", "/pharmacies", 200 if db_status != "down" else 503, _format_ms(database_health["queryResponseTimeMs"]), db_status, current_time],
        ["GET", "/medicines", 200 if db_status != "down" else 503, _format_ms(database_health["queryResponseTimeMs"]), db_status, current_time],
        ["POST", "/chatbot/answer", 200, "Not probed", "info", current_time],
        ["POST", "/uploads/pharmacies", 202, "Audit-backed", "healthy", current_time],
        ["POST", "/uploads/medicines", 202, "Audit-backed", "healthy", current_time],
    ]


def _collect_services(database_health: dict) -> list[dict]:
    db_status = database_health["status"]
    db_latency = _format_ms(database_health["queryResponseTimeMs"])
    api_status = "down" if db_status == "down" else "healthy"
    current_time = _format_time(_now())

    return [
        {
            "name": "Backend API",
            "icon": "Server",
            "status": api_status,
            "responseTime": db_latency,
            "lastChecked": current_time,
            "description": "FastAPI gateway, authentication, pharmacy, medicine, and admin endpoints.",
        },
        {
            "name": "Database",
            "icon": "Database",
            "status": db_status,
            "responseTime": db_latency,
            "lastChecked": current_time,
            "description": "Primary SQLAlchemy database connection and table availability.",
        },
        {
            "name": "Mobile App API",
            "icon": "Smartphone",
            "status": api_status,
            "responseTime": db_latency,
            "lastChecked": current_time,
            "description": "Public mobile endpoints for pharmacy search, map data, and medicines.",
        },
        {
            "name": "Chatbot API",
            "icon": "Bot",
            "status": "info",
            "responseTime": "Not probed",
            "lastChecked": current_time,
            "description": "Assistant endpoint registration is monitored; external model latency is not probed yet.",
        },
        {
            "name": "Notification Service",
            "icon": "Bell",
            "status": "info",
            "responseTime": "Audit-backed",
            "lastChecked": current_time,
            "description": "In-app notification and email delivery health placeholder until queue telemetry is added.",
        },
        {
            "name": "Map Service",
            "icon": "MapPinned",
            "status": api_status,
            "responseTime": db_latency,
            "lastChecked": current_time,
            "description": "Map data depends on stored pharmacy coordinates and public pharmacy APIs.",
        },
    ]


def _collect_kpis(database_health: dict, db: Session) -> list[dict]:
    since = _now() - timedelta(hours=24)
    total_attempts = db.query(models.LoginAttempt).filter(models.LoginAttempt.attempted_at >= since).count()
    failed_attempts = (
        db.query(models.LoginAttempt)
        .filter(models.LoginAttempt.attempted_at >= since, models.LoginAttempt.success.is_(False))
        .count()
    )
    error_rate = round((failed_attempts / total_attempts) * 100, 2) if total_attempts else 0
    uptime_seconds = int((_now() - APP_STARTED_AT).total_seconds())
    overall = "down" if database_health["status"] == "down" else "warning" if error_rate >= 5 else "healthy"

    return [
        {
            "label": "Overall Status",
            "value": "Operational" if overall == "healthy" else overall.title(),
            "helper": "Backend and database checks",
            "icon": "CheckCircle2",
            "status": overall,
        },
        {
            "label": "API Latency",
            "value": _format_ms(database_health["queryResponseTimeMs"]),
            "helper": "Database-backed health probe",
            "icon": "Timer",
            "status": database_health["status"],
        },
        {
            "label": "Error Rate",
            "value": f"{error_rate}%",
            "helper": "Auth failures in the last 24 hours",
            "icon": "AlertTriangle",
            "status": "warning" if error_rate >= 5 else "healthy",
        },
        {
            "label": "Uptime",
            "value": _format_duration(uptime_seconds),
            "helper": "Current API process uptime",
            "icon": "Activity",
            "status": "healthy",
        },
        {
            "label": "Last Health Check",
            "value": _format_time(_now()),
            "helper": "Current server time",
            "icon": "Clock3",
            "status": "info",
        },
    ]


def _collect_jobs(db: Session) -> list[list]:
    pharmacy_log = _latest_upload(db, models.AuditActionEnum.PHARMACY_BULK_UPLOAD)
    medicine_log = _latest_upload(db, models.AuditActionEnum.MEDICINE_BULK_UPLOAD)
    pharmacy_uploads_today = _count_uploads_today(db, models.AuditActionEnum.PHARMACY_BULK_UPLOAD)
    medicine_uploads_today = _count_uploads_today(db, models.AuditActionEnum.MEDICINE_BULK_UPLOAD)

    return [
        [
            "Pharmacy sync",
            "Healthy" if pharmacy_log else "Info",
            _format_time(pharmacy_log.created_at if pharmacy_log else None),
            "Audit-backed",
            f"{pharmacy_uploads_today} pharmacy imports today",
            "healthy" if pharmacy_log else "info",
        ],
        [
            "Medicine sync",
            "Healthy" if medicine_log else "Info",
            _format_time(medicine_log.created_at if medicine_log else None),
            "Audit-backed",
            f"{medicine_uploads_today} medicine imports today",
            "healthy" if medicine_log else "info",
        ],
        ["Database backup", "Info", "Not configured", "Not tracked", "Add backup scheduler telemetry to make this live", "info"],
        ["Notification dispatch", "Info", "Not configured", "Not tracked", "Add queue metrics to make this live", "info"],
        ["Log cleanup", "Info", "Not configured", "Not tracked", "Add retention job telemetry to make this live", "info"],
    ]


def _collect_logs(db: Session) -> list[list]:
    rows = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(5).all()

    if not rows:
        return [[_iso(_now()), "Info", "System Health", "No audit log entries have been recorded yet."]]

    logs = []
    for row in rows:
        level = "Error" if row.status in {"failed", "error"} else "Warning" if row.status == "warning" else "Info"
        action = getattr(row.action, "value", row.action)
        logs.append(
            [
                _iso(row.created_at),
                level,
                row.entity_type.title(),
                f"{action.replace('_', ' ').title()} recorded with status {row.status}.",
            ]
        )
    return logs


def _collect_chatbot_health() -> dict:
    """Probe the local First-Aid RAG service (CHATBOT_API_URL) and return its health.

    Reads `/health` and `/ready` for status + model metadata, and runs a tiny
    `/answer` probe to measure inference latency and confidence. Returns a
    structure ready to render in the admin Monitoring page.
    """
    base = CHATBOT_API_URL
    current_time = _format_time(_now())

    result = {
        "status": "down",
        "url": base,
        "ready": False,
        "model": None,
        "collection": None,
        "chunks": None,
        "healthLatencyMs": None,
        "readyLatencyMs": None,
        "answerLatencyMs": None,
        "answerConfidence": None,
        "answerMode": None,
        "lastChecked": current_time,
        "lastError": None,
    }

    try:
        with httpx.Client(timeout=CHATBOT_PROBE_TIMEOUT) as client:
            t0 = perf_counter()
            health_resp = client.get(f"{base}/health")
            result["healthLatencyMs"] = _ms(t0)
            health_resp.raise_for_status()

            t1 = perf_counter()
            ready_resp = client.get(f"{base}/ready")
            result["readyLatencyMs"] = _ms(t1)
            ready_payload = {}
            try:
                ready_payload = ready_resp.json() or {}
            except ValueError:
                ready_payload = {}

            if ready_resp.status_code == 200 and ready_payload.get("status") == "ready":
                result["ready"] = True
                result["model"] = ready_payload.get("model")
                result["collection"] = ready_payload.get("collection")
                result["chunks"] = ready_payload.get("chunks")
            else:
                result["ready"] = False
                result["lastError"] = ready_payload.get("detail") or f"ready returned HTTP {ready_resp.status_code}"

            if result["ready"]:
                t2 = perf_counter()
                try:
                    answer_resp = client.post(
                        f"{base}/answer",
                        json={"query": CHATBOT_PROBE_QUERY, "top_k": 3},
                    )
                    result["answerLatencyMs"] = _ms(t2)
                    if answer_resp.status_code == 200:
                        payload = answer_resp.json() or {}
                        result["answerConfidence"] = payload.get("confidence")
                        result["answerMode"] = payload.get("answer_mode")
                    else:
                        result["lastError"] = f"answer probe returned HTTP {answer_resp.status_code}"
                except Exception as probe_exc:
                    result["answerLatencyMs"] = _ms(t2)
                    result["lastError"] = f"answer probe failed: {probe_exc}"
    except httpx.HTTPError as exc:
        result["lastError"] = f"chatbot service unreachable: {exc}"
        result["status"] = "down"
        result["metrics"] = [
            ["Service status", "Unavailable", "down"],
            ["Ready", "No", "down"],
            ["RAG model", "Unavailable", "down"],
            ["Collection", "Unavailable", "down"],
            ["Indexed chunks", "Unavailable", "down"],
            ["Health probe latency", "Unavailable", "down"],
            ["Ready probe latency", "Unavailable", "down"],
            ["Answer probe latency", "Unavailable", "down"],
            ["Probe confidence", "Unavailable", "down"],
        ]
        result["kpi"] = {
            "label": "Chatbot Status",
            "value": "Down",
            "helper": "First-Aid RAG service unreachable",
            "icon": "Bot",
            "status": "down",
        }
        return result
    except Exception as exc:
        result["lastError"] = f"unexpected chatbot probe error: {exc}"

    answer_ms = result["answerLatencyMs"]
    if not result["ready"]:
        result["status"] = "down"
        status_label = "Loading" if (result["lastError"] or "").startswith("ready returned") else "Down"
    elif answer_ms is None:
        result["status"] = "warning"
        status_label = "Ready (probe skipped)"
    else:
        result["status"] = _status_for_latency(answer_ms, warning_at=900, down_at=3000)
        status_label = "Healthy" if result["status"] == "healthy" else result["status"].title()

    confidence_label = (
        f"{round(result['answerConfidence'] * 100)}%"
        if isinstance(result["answerConfidence"], (int, float))
        else "Unavailable"
    )
    confidence_status = (
        "healthy" if isinstance(result["answerConfidence"], (int, float)) and result["answerConfidence"] >= 0.6
        else "warning" if isinstance(result["answerConfidence"], (int, float)) and result["answerConfidence"] >= 0.3
        else "info"
    )

    result["metrics"] = [
        ["Service status", status_label, result["status"]],
        ["Ready", "Yes" if result["ready"] else "No", "healthy" if result["ready"] else "down"],
        ["RAG model", result["model"] or "Unavailable", "info"],
        ["Collection", result["collection"] or "Unavailable", "info"],
        ["Indexed chunks", f"{result['chunks']:,}" if isinstance(result["chunks"], int) else "Unavailable", "info"],
        ["Health probe latency", _format_ms(result["healthLatencyMs"]), _status_for_latency(result["healthLatencyMs"] or 0, 200, 800) if result["healthLatencyMs"] else "down"],
        ["Ready probe latency", _format_ms(result["readyLatencyMs"]), _status_for_latency(result["readyLatencyMs"] or 0, 250, 1000) if result["readyLatencyMs"] else "down"],
        ["Answer probe latency", _format_ms(answer_ms) if answer_ms else "Skipped", result["status"] if answer_ms else "info"],
        ["Probe confidence", confidence_label, confidence_status],
    ]

    result["kpi"] = {
        "label": "Chatbot Latency",
        "value": _format_ms(answer_ms) if answer_ms else status_label,
        "helper": f"{result['chunks']:,} chunks indexed" if isinstance(result["chunks"], int) else "RAG service probe",
        "icon": "Bot",
        "status": result["status"],
    }

    return result


def _chatbot_endpoint_rows(chatbot_health: dict) -> list[list]:
    current_time = chatbot_health.get("lastChecked", _format_time(_now()))
    is_down = chatbot_health.get("status") == "down"

    answer_status = chatbot_health.get("status") or "info"
    answer_latency = chatbot_health.get("answerLatencyMs")
    answer_latency_text = _format_ms(answer_latency) if answer_latency else "Skipped"

    health_latency = chatbot_health.get("healthLatencyMs")
    ready_latency = chatbot_health.get("readyLatencyMs")

    return [
        ["GET", "/health", 200 if not is_down else 503, _format_ms(health_latency) if health_latency else "Unavailable", "healthy" if health_latency else "down", current_time],
        ["GET", "/ready", 200 if chatbot_health.get("ready") else 503, _format_ms(ready_latency) if ready_latency else "Unavailable", "healthy" if chatbot_health.get("ready") else "warning" if not is_down else "down", current_time],
        ["POST", "/answer", 200 if answer_latency else 503, answer_latency_text, answer_status, current_time],
    ]


def _collect_system_health(db: Session) -> dict:
    database = _collect_database_health(db)
    imports = _collect_import_health(db)
    chatbot = _collect_chatbot_health()
    uptime_seconds = int((_now() - APP_STARTED_AT).total_seconds())
    services = _collect_services(database)
    for service in services:
        if service["name"] == "Chatbot API":
            service["status"] = chatbot["status"]
            service["responseTime"] = (
                _format_ms(chatbot["answerLatencyMs"]) if chatbot.get("answerLatencyMs") else
                _format_ms(chatbot["readyLatencyMs"]) if chatbot.get("readyLatencyMs") else
                "Unavailable"
            )
            service["lastChecked"] = chatbot["lastChecked"]
            service["description"] = (
                f"Local RAG ({chatbot.get('model') or 'unknown model'}), "
                f"{chatbot['chunks']:,} chunks" if isinstance(chatbot.get("chunks"), int)
                else "First-Aid RAG service (local Chroma + sentence-transformers)."
            )
            break

    return {
        "generatedAt": _iso(_now()),
        "serverTime": _iso(_now()),
        "uptimeSeconds": uptime_seconds,
        "kpis": _collect_kpis(database, db),
        "services": services,
        "endpoints": _collect_endpoint_health(database, db),
        "databaseMetrics": database["metrics"],
        "importMetrics": imports["metrics"],
        "jobs": _collect_jobs(db),
        "logs": _collect_logs(db),
        "chatbot": {
            **chatbot,
            "endpoints": _chatbot_endpoint_rows(chatbot),
        },
    }


@router.get("")
async def get_system_health(
    current_admin: models.Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    return _collect_system_health(db)


@router.get("/endpoints")
async def get_endpoint_health(
    current_admin: models.Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    database = _collect_database_health(db)
    return {"generatedAt": _iso(_now()), "endpoints": _collect_endpoint_health(database, db)}


@router.get("/database")
async def get_database_health(
    current_admin: models.Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    return _collect_database_health(db)


@router.get("/imports")
async def get_import_health(
    current_admin: models.Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    return _collect_import_health(db)


@router.get("/jobs")
async def get_job_health(
    current_admin: models.Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    return {"generatedAt": _iso(_now()), "jobs": _collect_jobs(db)}


@router.get("/logs")
async def get_system_logs(
    current_admin: models.Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    return {"generatedAt": _iso(_now()), "logs": _collect_logs(db)}


@router.get("/chatbot")
async def get_chatbot_health(
    current_admin: models.Administrateur = Depends(admin_required),
):
    chatbot = _collect_chatbot_health()
    return {
        "generatedAt": _iso(_now()),
        **chatbot,
        "endpoints": _chatbot_endpoint_rows(chatbot),
    }

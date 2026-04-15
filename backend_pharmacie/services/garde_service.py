"""Garde schedule upload and query service."""

import json
import re
from datetime import date, datetime
from io import BytesIO
from typing import Optional, Tuple

import pandas as pd
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

import models
from models import AuditActionEnum


def _clean_optional_str(value) -> Optional[str]:
    if pd.isna(value):
        return None
    text = str(value).strip()
    return text or None


FRENCH_MONTHS = {
    "janvier": 1,
    "fevrier": 2,
    "février": 2,
    "mars": 3,
    "avril": 4,
    "mai": 5,
    "juin": 6,
    "juillet": 7,
    "aout": 8,
    "août": 8,
    "septembre": 9,
    "octobre": 10,
    "novembre": 11,
    "decembre": 12,
    "décembre": 12,
}


class GardeService:
    """Encapsulates garde upload validation and persistence."""

    MAX_FILE_SIZE = 5 * 1024 * 1024
    MAX_ROWS = 5000
    COLUMN_ALIASES = {
        "date": {"date", "day", "garde_date"},
        "pharmacy_name": {"pharmacy_name", "pharmacy", "name", "nom", "nom_pharmacie"},
        "start_time": {"start_time", "start", "heure_debut", "debut"},
        "end_time": {"end_time", "end", "heure_fin", "fin"},
        "city": {"city", "ville"},
        "governorate": {"governorate", "region", "governorat", "gouvernorat"},
        "shift_type": {"shift_type", "type", "type_garde"},
        "notes": {"notes", "note", "comment", "comments"},
    }
    PLANNER_ALIASES = {
        "category": {"category", "categorie"},
        "month_holiday": {"month/holiday", "month_holiday", "mois", "month", "holiday"},
        "date_label": {"date"},
        "pharmacist_1": {"pharmacist_1", "pharmacy_1", "pharmacien_1"},
        "pharmacist_2": {"pharmacist_2", "pharmacy_2", "pharmacien_2"},
    }

    REQUIRED_COLUMNS = {"date", "pharmacy_name", "start_time", "end_time"}

    def __init__(self, db: Session):
        self.db = db

    def _resolve_columns(self, columns) -> tuple[dict, list[str]]:
        lower_columns = {column.lower(): column for column in columns}
        mapping = {}
        missing = []

        for field, aliases in self.COLUMN_ALIASES.items():
            actual = None
            for alias in aliases:
                if alias.lower() in lower_columns:
                    actual = lower_columns[alias.lower()]
                    break

            if actual:
                mapping[field] = actual
            elif field in self.REQUIRED_COLUMNS:
                missing.append(field)

        return mapping, missing

    def _resolve_alias_map(self, columns, alias_map: dict) -> tuple[dict, list[str]]:
        lower_columns = {column.lower(): column for column in columns}
        mapping = {}
        missing = []

        for field, aliases in alias_map.items():
            actual = None
            for alias in aliases:
                if alias.lower() in lower_columns:
                    actual = lower_columns[alias.lower()]
                    break
            if actual:
                mapping[field] = actual
            else:
                missing.append(field)

        return mapping, missing

    def _is_planner_format(self, columns) -> tuple[bool, dict]:
        mapping, missing = self._resolve_alias_map(columns, self.PLANNER_ALIASES)
        return len(missing) == 0, mapping

    def _parse_date(self, row, mapping: dict) -> date:
        parsed = pd.to_datetime(row.get(mapping["date"]), errors="coerce")
        if pd.isna(parsed):
            raise ValueError("date must be a valid date")
        return parsed.date()

    def _parse_time(self, row, mapping: dict, field: str) -> str:
        value = row.get(mapping[field])
        if pd.isna(value):
            raise ValueError(f"{field} cannot be empty")

        parsed = pd.to_datetime(str(value), format="%H:%M", errors="coerce")
        if pd.isna(parsed):
            parsed = pd.to_datetime(str(value), errors="coerce")
        if pd.isna(parsed):
            raise ValueError(f"{field} must be a valid time")
        return parsed.strftime("%H:%M")

    def _parse_planner_date(self, value) -> date:
        raw_value = _clean_optional_str(value)
        if not raw_value:
            raise ValueError("date cannot be empty")

        normalized = raw_value.replace("/", "-")
        match = re.search(r"(\d{1,2})(?:\s*-\s*(\d{1,2}))?\s+([A-Za-zÀ-ÿ]+)", normalized)
        if not match:
            raise ValueError(f"Unsupported planner date format: {raw_value}")

        day = int(match.group(1))
        month_label = match.group(3).strip().lower()
        month = FRENCH_MONTHS.get(month_label)
        if not month:
            raise ValueError(f"Unsupported month label: {match.group(3)}")

        current_year = datetime.now().year
        return date(current_year, month, day)

    def _save_payload(self, payload: dict, admin_id: int) -> None:
        existing = (
            self.db.query(models.GardeSchedule)
            .filter(
                models.GardeSchedule.date == payload["date"],
                models.GardeSchedule.pharmacy_name == payload["pharmacy_name"],
                models.GardeSchedule.start_time == payload["start_time"],
                models.GardeSchedule.end_time == payload["end_time"],
            )
            .first()
        )

        if existing:
            existing.city = payload["city"]
            existing.governorate = payload["governorate"]
            existing.shift_type = payload["shift_type"]
            existing.notes = payload["notes"]
            existing.created_by = admin_id
        else:
            self.db.add(models.GardeSchedule(created_by=admin_id, **payload))

    def _upload_planner_csv(
        self,
        df: pd.DataFrame,
        column_mapping: dict,
        admin_id: int,
    ) -> Tuple[dict, Optional[str]]:
        successful = 0
        errors = []

        for row_number, (_, row) in enumerate(df.iterrows(), start=2):
            try:
                garde_date = self._parse_planner_date(row.get(column_mapping["date_label"]))
                category = _clean_optional_str(row.get(column_mapping["category"])) or "Tableau de Garde"
                month_holiday = _clean_optional_str(row.get(column_mapping["month_holiday"]))
                raw_date = _clean_optional_str(row.get(column_mapping["date_label"]))
                pharmacists = [
                    _clean_optional_str(row.get(column_mapping["pharmacist_1"])),
                    _clean_optional_str(row.get(column_mapping["pharmacist_2"])),
                ]

                saved_for_row = 0
                for pharmacist in pharmacists:
                    if not pharmacist:
                        continue

                    payload = {
                        "date": garde_date,
                        "pharmacy_name": pharmacist,
                        "start_time": "00:00",
                        "end_time": "23:59",
                        "city": None,
                        "governorate": None,
                        "shift_type": category,
                        "notes": f"Planner slot: {raw_date}" + (f" • {month_holiday}" if month_holiday else ""),
                    }
                    self._save_payload(payload, admin_id)
                    successful += 1
                    saved_for_row += 1

                if saved_for_row == 0:
                    raise ValueError("Planner row does not contain any pharmacist names")
            except Exception as exc:
                errors.append({"row_number": row_number, "error_message": str(exc)})

        if successful == 0:
            self.db.rollback()
            return None, f"No valid garde rows found in planner CSV. {len(errors)} rows had errors."

        return {"total_rows": len(df), "successful": successful, "failed": len(errors), "errors": errors}, None

    def upload_csv(self, file_content: bytes, filename: str, admin_id: int) -> Tuple[dict, Optional[str]]:
        if not filename.lower().endswith(".csv"):
            return None, "Only CSV files are supported for garde uploads."

        if len(file_content) > self.MAX_FILE_SIZE:
            return None, "File size exceeds the 5 MB upload limit."

        try:
            df = pd.read_csv(BytesIO(file_content))
        except Exception as exc:
            return None, f"Failed to parse CSV file: {exc}"

        if df.empty:
            return None, "CSV file is empty."

        if len(df) > self.MAX_ROWS:
            return None, f"CSV has {len(df)} rows, maximum allowed is {self.MAX_ROWS}."

        planner_format, planner_mapping = self._is_planner_format(df.columns)
        if planner_format:
            result, error = self._upload_planner_csv(df, planner_mapping, admin_id)
            if error:
                return None, error
            try:
                self.db.commit()
            except Exception as exc:
                self.db.rollback()
                return None, f"Failed to save garde rows: {exc}"

            try:
                self.db.add(
                    models.AuditLog(
                        action=AuditActionEnum.GARDE_BULK_UPLOAD,
                        entity_type="garde_schedule",
                        entity_id=0,
                        actor_id=admin_id,
                        actor_type="administrateur",
                        details=json.dumps(
                            {
                                "rows_processed": len(df),
                                "rows_successful": result["successful"],
                                "rows_failed": result["failed"],
                                "format": "planner",
                            }
                        ),
                        status="success",
                    )
                )
                self.db.commit()
            except Exception:
                self.db.rollback()

            return result, None

        column_mapping, missing_required = self._resolve_columns(df.columns)
        if missing_required:
            return None, f"CSV missing required columns: {', '.join(missing_required)}."

        successful = 0
        errors = []

        for row_number, (_, row) in enumerate(df.iterrows(), start=2):
            try:
                payload = {
                    "date": self._parse_date(row, column_mapping),
                    "pharmacy_name": _clean_optional_str(row.get(column_mapping["pharmacy_name"])),
                    "start_time": self._parse_time(row, column_mapping, "start_time"),
                    "end_time": self._parse_time(row, column_mapping, "end_time"),
                    "city": _clean_optional_str(row.get(column_mapping["city"])) if "city" in column_mapping else None,
                    "governorate": _clean_optional_str(row.get(column_mapping["governorate"])) if "governorate" in column_mapping else None,
                    "shift_type": _clean_optional_str(row.get(column_mapping["shift_type"])) if "shift_type" in column_mapping else None,
                    "notes": _clean_optional_str(row.get(column_mapping["notes"])) if "notes" in column_mapping else None,
                }

                if not payload["pharmacy_name"]:
                    raise ValueError("pharmacy_name cannot be empty")

                self._save_payload(payload, admin_id)
                successful += 1
            except Exception as exc:
                errors.append({"row_number": row_number, "error_message": str(exc)})

        if successful == 0:
            self.db.rollback()
            return None, f"No valid garde rows found in CSV. {len(errors)} rows had errors."

        try:
            self.db.commit()
        except Exception as exc:
            self.db.rollback()
            return None, f"Failed to save garde rows: {exc}"

        try:
            self.db.add(
                models.AuditLog(
                    action=AuditActionEnum.GARDE_BULK_UPLOAD,
                    entity_type="garde_schedule",
                    entity_id=0,
                    actor_id=admin_id,
                    actor_type="administrateur",
                    details=json.dumps(
                        {
                            "rows_processed": len(df),
                            "rows_successful": successful,
                            "rows_failed": len(errors),
                        }
                    ),
                    status="success",
                )
            )
            self.db.commit()
        except Exception:
            self.db.rollback()

        return {
            "total_rows": len(df),
            "successful": successful,
            "failed": len(errors),
            "errors": errors,
        }, None

    def get_gardes(self, skip: int = 0, limit: int = 100) -> list[dict]:
        rows = (
            self.db.query(models.GardeSchedule)
            .order_by(models.GardeSchedule.date.desc(), models.GardeSchedule.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return [
            {
                "id": row.id,
                "date": row.date.isoformat(),
                "pharmacy_name": row.pharmacy_name,
                "start_time": row.start_time,
                "end_time": row.end_time,
                "city": row.city,
                "governorate": row.governorate,
                "shift_type": row.shift_type,
                "notes": row.notes,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in rows
        ]

    def get_garde_count(self) -> int:
        return self.db.query(models.GardeSchedule).count()

    def get_public_gardes(self, garde_date: date, skip: int = 0, limit: int = 100) -> list[dict]:
        rows = (
            self.db.query(models.GardeSchedule)
            .filter(models.GardeSchedule.date == garde_date)
            .order_by(models.GardeSchedule.start_time.asc(), models.GardeSchedule.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        if not rows:
            return []

        pharmacy_names = list({row.pharmacy_name.strip() for row in rows if row.pharmacy_name})
        normalized_names = [name.lower() for name in pharmacy_names]
        pharmacies = (
            self.db.query(models.Pharmacie)
            .filter(or_(*[func.lower(models.Pharmacie.name) == name for name in normalized_names]))
            .all()
            if normalized_names
            else []
        )
        pharmacy_by_name = {pharmacy.name.strip().lower(): pharmacy for pharmacy in pharmacies if pharmacy.name}

        return [
            {
                "id": row.id,
                "date": row.date.isoformat(),
                "pharmacy_name": row.pharmacy_name,
                "start_time": row.start_time,
                "end_time": row.end_time,
                "city": row.city,
                "governorate": row.governorate,
                "shift_type": row.shift_type,
                "notes": row.notes,
                "pharmacy": self._serialize_public_pharmacy(
                    pharmacy_by_name.get(row.pharmacy_name.strip().lower()) if row.pharmacy_name else None
                ),
            }
            for row in rows
        ]

    def _serialize_public_pharmacy(self, pharmacy: Optional[models.Pharmacie]) -> Optional[dict]:
        if not pharmacy:
            return None

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
        }

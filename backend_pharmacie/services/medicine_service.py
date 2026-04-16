"""Medicine CSV upload, query, and serialization service."""

from __future__ import annotations

import json
import re
from decimal import Decimal, InvalidOperation
from io import BytesIO
from typing import Optional, Tuple

import pandas as pd
from sqlalchemy import and_, case, func, or_
from sqlalchemy.orm import Session

import models
from events import EventTypes, get_event_bus
from models import AuditActionEnum
from schemas import MedicineCreate, MedicineUploadIssueDetail


def _clean_optional_str(value) -> Optional[str]:
    if pd.isna(value):
        return None
    text = str(value).strip()
    return text or None


def _normalize_price(value, field_name: str) -> Decimal:
    if pd.isna(value):
        raise ValueError(f"{field_name} cannot be empty")

    normalized = str(value).strip().replace(" ", "")
    if not normalized:
        raise ValueError(f"{field_name} cannot be empty")

    if "," in normalized and "." in normalized:
        normalized = normalized.replace(".", "").replace(",", ".")
    elif "," in normalized:
        normalized = normalized.replace(",", ".")

    try:
        decimal_value = Decimal(normalized)
    except (InvalidOperation, ValueError):
        raise ValueError(f"{field_name} must be a valid decimal number")

    if decimal_value < 0:
        raise ValueError(f"{field_name} must be positive")

    return decimal_value.quantize(Decimal("0.001"))


def _tokenize_search_query(value: Optional[str]) -> list[str]:
    if not value:
        return []
    return [token for token in re.split(r"\s+", value.strip().lower()) if token]


class MedicineService:
    """Encapsulates medicine catalog upload and read operations."""

    MAX_FILE_SIZE = 5 * 1024 * 1024
    MAX_ROWS = 5000
    REQUIRED_COLUMNS = {
        "code_pct",
        "nom_commercial",
        "prix_public_dt",
        "tarif_reference_dt",
        "categorie_remboursement",
        "dci",
        "ap",
    }
    COLUMN_ALIASES = {
        "code_pct": {"code_pct", "code pct", "code-pct"},
        "nom_commercial": {"nom_commercial", "nom commercial", "nom-commercial"},
        "prix_public_dt": {"prix_public_dt", "prix_public_dt.", "prix_public_DT", "prix public dt"},
        "tarif_reference_dt": {"tarif_reference_dt", "tarif_reference_DT", "tarif reference dt"},
        "categorie_remboursement": {"categorie_remboursement", "categorie remboursement"},
        "dci": {"dci"},
        "ap": {"ap"},
    }

    def __init__(self, db: Session):
        self.db = db
        self.event_bus = get_event_bus()

    def _normalize_column_name(self, value: str) -> str:
        return (
            value.replace("\ufeff", "")
            .strip()
            .lower()
            .replace(" ", "_")
            .replace("-", "_")
            .replace(".", "")
        )

    def _resolve_columns(self, columns) -> tuple[dict, list[str]]:
        normalized_columns = {
            self._normalize_column_name(column): column for column in columns
        }
        mapping = {}
        missing = []

        for field, aliases in self.COLUMN_ALIASES.items():
            actual = None
            for alias in aliases:
                normalized_alias = self._normalize_column_name(alias)
                if normalized_alias in normalized_columns:
                    actual = normalized_columns[normalized_alias]
                    break
            if actual:
                mapping[field] = actual
            else:
                missing.append(field)

        return mapping, missing

    def upload_csv(
        self,
        file_content: bytes,
        filename: str,
        admin_id: int,
    ) -> Tuple[dict, Optional[str]]:
        if not filename.lower().endswith(".csv"):
            self.event_bus.publish(
                EventTypes.MEDICINE_BULK_UPLOAD_FAILED,
                {"reason": "invalid_extension", "filename": filename},
            )
            return None, "Only CSV files are supported for medicine uploads."

        if len(file_content) > self.MAX_FILE_SIZE:
            self.event_bus.publish(
                EventTypes.MEDICINE_BULK_UPLOAD_FAILED,
                {"reason": "file_too_large", "filename": filename, "size": len(file_content)},
            )
            return None, "File size exceeds the 5 MB upload limit."

        try:
            df = pd.read_csv(
                BytesIO(file_content),
                sep=None,
                engine="python",
                encoding="utf-8-sig",
            )
        except Exception as exc:
            self.event_bus.publish(
                EventTypes.MEDICINE_BULK_UPLOAD_FAILED,
                {"reason": "parse_error", "filename": filename, "error": str(exc)},
            )
            return None, f"Failed to parse CSV file: {exc}"

        if df.empty:
            return None, "CSV file is empty."

        if len(df) > self.MAX_ROWS:
            return None, f"CSV has {len(df)} rows, maximum allowed is {self.MAX_ROWS}."

        column_mapping, missing_required = self._resolve_columns(df.columns)
        if missing_required:
            return None, f"CSV missing required columns: {', '.join(missing_required)}."

        errors: list[MedicineUploadIssueDetail] = []
        warnings: list[MedicineUploadIssueDetail] = []
        latest_by_code: dict[str, dict] = {}

        for row_number, (_, row) in enumerate(df.iterrows(), start=2):
            try:
                code_pct = _clean_optional_str(row.get(column_mapping["code_pct"]))
                if not code_pct:
                    raise ValueError("code_pct cannot be empty")

                payload = MedicineCreate(
                    code_pct=code_pct,
                    nom_commercial=_clean_optional_str(row.get(column_mapping["nom_commercial"])) or "",
                    prix_public_dt=float(_normalize_price(row.get(column_mapping["prix_public_dt"]), "prix_public_DT")),
                    tarif_reference_dt=float(
                        _normalize_price(row.get(column_mapping["tarif_reference_dt"]), "tarif_reference_DT")
                    ),
                    categorie_remboursement=_clean_optional_str(
                        row.get(column_mapping["categorie_remboursement"])
                    ) or "",
                    dci=_clean_optional_str(row.get(column_mapping["dci"])) or "",
                    ap=_clean_optional_str(row.get(column_mapping["ap"])) or "",
                )
                if payload.code_pct in latest_by_code:
                    previous_row_number = latest_by_code[payload.code_pct]["row_number"]
                    warnings.append(
                        MedicineUploadIssueDetail(
                            row_number=previous_row_number,
                            error_message=(
                                f"Duplicate code_pct {payload.code_pct} detected. "
                                f"Row {row_number} overrides the earlier row."
                            ),
                        )
                    )
                latest_by_code[payload.code_pct] = {
                    "row_number": row_number,
                    "payload": payload.model_dump(),
                }
            except Exception as exc:
                errors.append(
                    MedicineUploadIssueDetail(row_number=row_number, error_message=str(exc))
                )

        if not latest_by_code:
            self.db.rollback()
            return None, f"No valid medicines found in CSV. {len(errors)} rows had errors."

        successful = 0
        try:
            for code_pct, record in latest_by_code.items():
                payload = record["payload"]
                existing = (
                    self.db.query(models.Medicine)
                    .filter(models.Medicine.code_pct == code_pct)
                    .first()
                )
                if existing:
                    existing.nom_commercial = payload["nom_commercial"]
                    existing.prix_public_dt = Decimal(str(payload["prix_public_dt"]))
                    existing.tarif_reference_dt = Decimal(str(payload["tarif_reference_dt"]))
                    existing.categorie_remboursement = payload["categorie_remboursement"]
                    existing.dci = payload["dci"]
                    existing.ap = payload["ap"]
                    existing.created_by = admin_id
                else:
                    self.db.add(
                        models.Medicine(
                            code_pct=payload["code_pct"],
                            nom_commercial=payload["nom_commercial"],
                            prix_public_dt=Decimal(str(payload["prix_public_dt"])),
                            tarif_reference_dt=Decimal(str(payload["tarif_reference_dt"])),
                            categorie_remboursement=payload["categorie_remboursement"],
                            dci=payload["dci"],
                            ap=payload["ap"],
                            created_by=admin_id,
                        )
                    )
                successful += 1

            self.db.commit()
        except Exception as exc:
            self.db.rollback()
            self.event_bus.publish(
                EventTypes.MEDICINE_BULK_UPLOAD_FAILED,
                {"reason": "db_save_failed", "filename": filename, "error": str(exc)},
            )
            return None, f"Failed to save medicines: {exc}"

        try:
            self.db.add(
                models.AuditLog(
                    action=AuditActionEnum.MEDICINE_BULK_UPLOAD,
                    entity_type="medicine",
                    entity_id=0,
                    actor_id=admin_id,
                    actor_type="administrateur",
                    details=json.dumps(
                        {
                            "rows_processed": len(df),
                            "rows_successful": successful,
                            "rows_failed": len(errors),
                            "rows_warned": len(warnings),
                        }
                    ),
                    status="success",
                )
            )
            self.db.commit()
        except Exception:
            self.db.rollback()

        self.event_bus.publish(
            EventTypes.MEDICINE_BULK_UPLOAD_SUCCESS,
            {
                "filename": filename,
                "rows_processed": len(df),
                "rows_successful": successful,
                "rows_failed": len(errors),
                "rows_warned": len(warnings),
                "admin_id": admin_id,
            },
        )

        return {
            "total_rows": len(df),
            "successful": successful,
            "failed": len(errors),
            "errors": errors,
            "warnings": warnings,
        }, None

    def _serialize(self, medicine: models.Medicine) -> dict:
        return {
            "id": medicine.id,
            "code_pct": medicine.code_pct,
            "nom_commercial": medicine.nom_commercial,
            "prix_public_dt": float(medicine.prix_public_dt),
            "tarif_reference_dt": float(medicine.tarif_reference_dt),
            "categorie_remboursement": medicine.categorie_remboursement,
            "dci": medicine.dci,
            "ap": medicine.ap,
            "created_by": medicine.created_by,
            "created_at": medicine.created_at.isoformat() if medicine.created_at else None,
        }

    def get_medicines(self, skip: int = 0, limit: int = 100) -> list[dict]:
        rows = (
            self.db.query(models.Medicine)
            .order_by(models.Medicine.nom_commercial.asc(), models.Medicine.code_pct.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return [self._serialize(row) for row in rows]

    def get_medicine_count(self) -> int:
        return self.db.query(models.Medicine).count()

    def _apply_search_filters(self, query, q: Optional[str]):
        tokens = _tokenize_search_query(q)
        if not tokens:
            return query, []

        normalized_name = func.lower(models.Medicine.nom_commercial)
        normalized_dci = func.lower(models.Medicine.dci)
        normalized_code = func.lower(models.Medicine.code_pct)

        predicates = []
        for token in tokens:
            pattern = f"%{token}%"
            predicates.append(
                or_(
                    normalized_name.like(pattern),
                    normalized_dci.like(pattern),
                    normalized_code.like(pattern),
                )
            )

        return query.filter(and_(*predicates)), tokens

    def search_medicines(self, q: Optional[str], skip: int = 0, limit: int = 100) -> list[dict]:
        query = self.db.query(models.Medicine)
        query, tokens = self._apply_search_filters(query, q)
        if tokens:
            normalized_query = " ".join(tokens)

            normalized_name = func.lower(models.Medicine.nom_commercial)
            normalized_dci = func.lower(models.Medicine.dci)
            normalized_code = func.lower(models.Medicine.code_pct)
            ranking = (
                case((normalized_code == normalized_query, 0), else_=1)
                + case((normalized_name == normalized_query, 0), else_=1)
                + case((normalized_dci == normalized_query, 0), else_=1)
                + case((normalized_code.like(f"{normalized_query}%"), 0), else_=1)
                + case((normalized_name.like(f"{normalized_query}%"), 0), else_=1)
                + case((normalized_dci.like(f"{normalized_query}%"), 0), else_=1)
            )
            query = query.order_by(
                ranking.asc(),
                models.Medicine.nom_commercial.asc(),
                models.Medicine.code_pct.asc(),
            )
        else:
            query = query.order_by(models.Medicine.nom_commercial.asc(), models.Medicine.code_pct.asc())

        rows = query.offset(skip).limit(limit).all()
        return [self._serialize(row) for row in rows]

    def get_public_medicine_count(self, q: Optional[str] = None) -> int:
        query = self.db.query(models.Medicine)
        query, _ = self._apply_search_filters(query, q)
        return query.count()

    def get_medicine_by_code_pct(self, code_pct: str) -> Optional[dict]:
        medicine = (
            self.db.query(models.Medicine)
            .filter(models.Medicine.code_pct == str(code_pct))
            .first()
        )
        return self._serialize(medicine) if medicine else None

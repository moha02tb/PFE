"""Pharmacy service - business logic for pharmacy operations.

Extracted from routers/admin.py to enable testing, reuse, and cleaner separation of concerns.
Handles: CSV upload, validation, bulk insert, pharmacy queries.
"""

import json
from io import BytesIO
from typing import List, Optional, Tuple

import pandas as pd
from sqlalchemy.orm import Session

import models
from events import EventTypes, get_event_bus
from models import AuditActionEnum
from schemas import PharmacieCreate, PharmacieUploadErrorDetail


def _parse_optional_str(row, column_mapping: dict, field: str) -> Optional[str]:
    """Parse optional string field from CSV row."""
    if field.lower() not in column_mapping:
        return None
    col_name = column_mapping[field.lower()]
    value = row.get(col_name)
    if pd.isna(value):
        return None
    return str(value).strip() or None


def _parse_optional_int(row, column_mapping: dict, field: str) -> Optional[int]:
    """Parse optional integer field from CSV row."""
    if field.lower() not in column_mapping:
        return None
    col_name = column_mapping[field.lower()]
    value = row.get(col_name)
    if pd.isna(value):
        return None
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None


def _parse_required_float(row, column_mapping: dict, field: str) -> float:
    """Parse required float field from CSV row."""
    if field.lower() not in column_mapping:
        raise ValueError(f"Missing required field: {field}")
    col_name = column_mapping[field.lower()]
    value = row.get(col_name)
    if pd.isna(value):
        raise ValueError(f"{field} cannot be empty")
    try:
        return float(value)
    except (ValueError, TypeError):
        raise ValueError(f"{field} must be a valid number, got: {value}")


class PharmacyService:
    """Encapsulates all pharmacy business logic."""

    # Configuration
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    MAX_ROWS = 5000
    REQUIRED_COLUMNS = {"name", "latitude", "longitude"}
    ALL_COLUMNS = {
        "osm_type",
        "osm_id",
        "name",
        "address",
        "phone",
        "governorate",
        "latitude",
        "longitude",
    }

    # Column name aliases for flexibility
    COLUMN_ALIASES = {
        "latitude": {"latitude", "lat"},
        "longitude": {"longitude", "lon"},
        "name": {"name"},
        "osm_type": {"osm_type", "type"},
        "osm_id": {"osm_id", "id"},
        "address": {"address", "addr"},
        "phone": {"phone", "tel", "telephone"},
        "governorate": {"governorate", "region", "province", "state"},
    }

    def __init__(self, db: Session):
        self.db = db
        self.event_bus = get_event_bus()

    def upload_csv(
        self,
        file_content: bytes,
        filename: str,
        admin_id: int,
    ) -> Tuple[dict, Optional[str]]:
        """
        Process pharmacy CSV upload.
        
        Returns: (response_dict, error_message)
        - response_dict: {total_rows, successful, failed, errors: []}
        - error_message: None on success, error string on failure
        """
        errors: List[PharmacieUploadErrorDetail] = []
        valid_pharmacies: List[dict] = []

        try:
            # 1. Validate file extension
            if not filename.endswith(".csv"):
                self.event_bus.publish(
                    EventTypes.PHARMACY_BULK_UPLOAD_FAILED,
                    {"reason": "invalid_extension", "filename": filename},
                )
                return None, "Only CSV files are supported. Please upload a .csv file."

            # 2. Check file size
            if len(file_content) > self.MAX_FILE_SIZE:
                self.event_bus.publish(
                    EventTypes.PHARMACY_BULK_UPLOAD_FAILED,
                    {
                        "reason": "file_too_large",
                        "filename": filename,
                        "size": len(file_content),
                    },
                )
                return None, (
                    f"File size exceeds maximum allowed ({self.MAX_FILE_SIZE / 1024 / 1024}MB)"
                )

            # 3. Parse CSV
            try:
                df = pd.read_csv(BytesIO(file_content))
            except Exception as e:
                self.event_bus.publish(
                    EventTypes.PHARMACY_BULK_UPLOAD_FAILED,
                    {"reason": "parse_error", "filename": filename, "error": str(e)},
                )
                return None, f"Failed to parse CSV file: {str(e)}"

            # 4. Check empty
            if len(df) == 0:
                self.event_bus.publish(
                    EventTypes.PHARMACY_BULK_UPLOAD_FAILED,
                    {"reason": "empty_file", "filename": filename},
                )
                return None, "CSV file is empty"

            # 5. Check row limit
            if len(df) > self.MAX_ROWS:
                self.event_bus.publish(
                    EventTypes.PHARMACY_BULK_UPLOAD_FAILED,
                    {"reason": "too_many_rows", "filename": filename, "rows": len(df)},
                )
                return None, f"CSV has {len(df)} rows, maximum allowed is {self.MAX_ROWS}"

            # 6. Validate column names
            df_columns = {col.lower() for col in df.columns}

            column_mapping = {}
            missing_required = []

            for required_col, aliases in self.COLUMN_ALIASES.items():
                found_alias = None
                for alias in aliases:
                    if alias.lower() in df_columns:
                        found_alias = alias.lower()
                        break

                if found_alias:
                    actual_col = next(col for col in df.columns if col.lower() == found_alias)
                    column_mapping[required_col.lower()] = actual_col
                elif required_col in {"latitude", "longitude", "name"}:
                    missing_required.append(required_col)

            if missing_required:
                self.event_bus.publish(
                    EventTypes.PHARMACY_BULK_UPLOAD_FAILED,
                    {
                        "reason": "missing_required_columns",
                        "filename": filename,
                        "missing": missing_required,
                    },
                )
                return None, (
                    f"CSV missing required columns: {', '.join(missing_required)}. "
                    f"Required: name, latitude/lat, longitude/lon"
                )

            # 7. Process each row
            seen_osm_ids = set()
            for row_num, (idx, row) in enumerate(df.iterrows(), start=2):
                try:
                    row_data = {
                        "osm_type": _parse_optional_str(row, column_mapping, "osm_type")
                        or "node",
                        "osm_id": _parse_optional_int(row, column_mapping, "osm_id"),
                        "name": _parse_optional_str(row, column_mapping, "name") or "",
                        "address": _parse_optional_str(row, column_mapping, "address"),
                        "phone": _parse_optional_str(row, column_mapping, "phone"),
                        "governorate": _parse_optional_str(row, column_mapping, "governorate"),
                        "latitude": _parse_required_float(row, column_mapping, "latitude"),
                        "longitude": _parse_required_float(row, column_mapping, "longitude"),
                    }

                    pharmacy = PharmacieCreate(**row_data)

                    # Check duplicate osm_id
                    if pharmacy.osm_id and pharmacy.osm_id in seen_osm_ids:
                        errors.append(
                            PharmacieUploadErrorDetail(
                                row_number=row_num,
                                error_message=f"Duplicate osm_id in upload: {pharmacy.osm_id}",
                            )
                        )
                        continue

                    # Check if osm_id exists in DB
                    if pharmacy.osm_id:
                        existing = (
                            self.db.query(models.Pharmacie)
                            .filter(models.Pharmacie.osm_id == pharmacy.osm_id)
                            .first()
                        )
                        if existing:
                            errors.append(
                                PharmacieUploadErrorDetail(
                                    row_number=row_num,
                                    error_message=f"Pharmacy with osm_id {pharmacy.osm_id} already exists",
                                )
                            )
                            continue
                        seen_osm_ids.add(pharmacy.osm_id)

                    valid_pharmacies.append(pharmacy.model_dump())

                except ValueError as e:
                    errors.append(
                        PharmacieUploadErrorDetail(
                            row_number=row_num,
                            error_message=str(e),
                        )
                    )
                except Exception as e:
                    errors.append(
                        PharmacieUploadErrorDetail(
                            row_number=row_num,
                            error_message=f"Validation error: {str(e)}",
                        )
                    )

            # 8. Check at least one valid row
            if not valid_pharmacies:
                self.event_bus.publish(
                    EventTypes.PHARMACY_BULK_UPLOAD_FAILED,
                    {
                        "reason": "no_valid_rows",
                        "filename": filename,
                        "error_rows": len(errors),
                    },
                )
                return None, f"No valid pharmacies found in CSV. {len(errors)} rows had errors."

            # 9. Batch insert
            try:
                for pharmacy_data in valid_pharmacies:
                    db_pharmacy = models.Pharmacie(
                        osm_type=pharmacy_data["osm_type"],
                        osm_id=pharmacy_data["osm_id"],
                        name=pharmacy_data["name"],
                        address=pharmacy_data["address"],
                        phone=pharmacy_data["phone"],
                        governorate=pharmacy_data["governorate"],
                        latitude=pharmacy_data["latitude"],
                        longitude=pharmacy_data["longitude"],
                        created_by=admin_id,
                    )
                    self.db.add(db_pharmacy)

                self.db.commit()

            except Exception as e:
                self.db.rollback()
                self.event_bus.publish(
                    EventTypes.PHARMACY_BULK_UPLOAD_FAILED,
                    {"reason": "db_insert_failed", "filename": filename, "error": str(e)},
                )
                return None, f"Failed to save pharmacies to database: {str(e)}"

            # 10. Create audit log
            try:
                audit_log = models.AuditLog(
                    action=AuditActionEnum.PHARMACY_BULK_UPLOAD,
                    entity_type="pharmacie",
                    entity_id=0,
                    actor_id=admin_id,
                    actor_type="administrateur",
                    details=json.dumps(
                        {
                            "rows_processed": len(df),
                            "rows_successful": len(valid_pharmacies),
                            "rows_failed": len(errors),
                        }
                    ),
                    status="success",
                )
                self.db.add(audit_log)
                self.db.commit()
            except Exception as e:
                self.db.rollback()
                print(f"Warning: Failed to log audit entry: {str(e)}")

            self.event_bus.publish(
                EventTypes.PHARMACY_BULK_UPLOAD_SUCCESS,
                {
                    "filename": filename,
                    "rows_processed": len(df),
                    "rows_successful": len(valid_pharmacies),
                    "rows_failed": len(errors),
                    "admin_id": admin_id,
                },
            )

            return {
                "total_rows": len(df),
                "successful": len(valid_pharmacies),
                "failed": len(errors),
                "errors": errors,
            }, None

        except Exception as e:
            self.event_bus.publish(
                EventTypes.PHARMACY_BULK_UPLOAD_FAILED,
                {"reason": "unexpected_error", "filename": filename, "error": str(e)},
            )
            return None, f"Unexpected error during file processing: {str(e)}"

    def get_pharmacies(self, skip: int = 0, limit: int = 100) -> List[dict]:
        """Get all pharmacies with pagination."""
        pharmacies = (
            self.db.query(models.Pharmacie)
            .order_by(models.Pharmacie.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return [
            {
                "id": p.id,
                "osm_type": p.osm_type,
                "osm_id": p.osm_id,
                "name": p.name,
                "address": p.address,
                "phone": p.phone,
                "governorate": p.governorate,
                "latitude": p.latitude,
                "longitude": p.longitude,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in pharmacies
        ]

    def get_pharmacy_count(self) -> int:
        """Get total pharmacy count."""
        return self.db.query(models.Pharmacie).count()

    def search_nearby(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 5,
        limit: int = 50,
    ) -> Tuple[List[dict], Optional[str]]:
        """
        Search for pharmacies nearby using Haversine distance.
        
        Returns: (pharmacies_list, error_message)
        """
        try:
            from sqlalchemy import func

            # Haversine formula
            R = 6371  # Earth radius in km
            lat_rad = func.radians(models.Pharmacie.latitude)
            lon_rad = func.radians(models.Pharmacie.longitude)
            lat_input_rad = float(latitude) * 3.14159 / 180
            lon_input_rad = float(longitude) * 3.14159 / 180

            distance = (
                R
                * func.acos(
                    func.cos(lat_rad - lat_input_rad)
                    * func.cos(lon_rad - lon_input_rad)
                    + func.sin(lat_rad - lat_input_rad) * func.sin(lon_rad - lon_input_rad)
                )
            )

            pharmacies = (
                self.db.query(models.Pharmacie)
                .filter(distance <= radius_km)
                .order_by(distance)
                .limit(limit)
                .all()
            )

            return [
                {
                    "id": p.id,
                    "name": p.name,
                    "address": p.address,
                    "phone": p.phone,
                    "latitude": p.latitude,
                    "longitude": p.longitude,
                    "governorate": p.governorate,
                }
                for p in pharmacies
            ], None

        except Exception as e:
            return [], f"Error searching nearby pharmacies: {str(e)}"

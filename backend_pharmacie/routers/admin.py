"""Admin operations and file upload routes.

Handles administrative tasks including file uploads for pharmacy data.

Endpoints:
    POST /api/admin/upload: Upload pharmacy data from CSV or Excel
"""

from typing import List

from database import get_db
from dependencies import admin_required, staff_required
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from models import Administrateur, AuditLog
from permissions import role_value
from region_scope import normalize_region, region_options
from services import CacheService, MedicineService, PharmacyService
from services.admin_service import AdminService
from services.garde_service import GardeService
from sqlalchemy.orm import Session
from sqlalchemy import text
from schemas import (
    AssistantCreate,
    AssistantUpdate,
    GardeScheduleCreate,
    GardeScheduleUpdate,
    PharmacieCreate,
    PharmacieUpdate,
)

router = APIRouter(prefix="/api/admin", tags=["Administration"])


@router.get("/permissions")
async def get_permissions():
    """Get all role-based permissions. Can be accessed by any authenticated user."""
    from permissions import ROLE_PERMISSIONS
    return {
        "permissions": {
            role: list(perms) if isinstance(perms, set) else perms
            for role, perms in ROLE_PERMISSIONS.items()
        }
    }


def _role_value(admin: Administrateur) -> str:
    return role_value(admin.role)


def _region_scope_for(admin: Administrateur) -> str | None:
    if _role_value(admin) != "assistant":
        return None
    return normalize_region(admin.region_scope)


def _raise_service_error(error: str) -> None:
    lowered = error.lower()
    if "assistant" in lowered or "outside the assistant region" in lowered:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)


@router.get("/admins")
async def list_admin_accounts(
    current_admin: Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
):
    """List administrator accounts for the admin dashboard."""
    admin_service = AdminService(db)
    return admin_service.list_admins(skip=skip, limit=limit)


@router.get("/admins/count")
async def get_admin_count(
    current_admin: Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    """Return total number of administrator accounts."""
    admin_service = AdminService(db)
    return {"total": admin_service.get_admin_count()}


@router.get("/assistants")
async def list_assistants(
    current_admin: Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
):
    """List regional assistant accounts."""
    admin_service = AdminService(db)
    return admin_service.list_assistants(skip=skip, limit=limit)


@router.get("/assistants/count")
async def get_assistant_count(
    current_admin: Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    """Return total number of regional assistant accounts."""
    admin_service = AdminService(db)
    return {"total": admin_service.get_assistant_count()}


@router.get("/regions")
async def get_regions(
    current_admin: Administrateur = Depends(staff_required),
):
    """Return assistant region options and their governorates."""
    return {"regions": region_options()}


@router.post("/assistants")
async def create_assistant(
    assistant_data: AssistantCreate,
    current_admin: Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    """Create a regional assistant account. Admin access is required."""
    admin_service = AdminService(db)
    assistant, error = admin_service.create_assistant(assistant_data, current_admin.id)

    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    return assistant


@router.patch("/assistants/{assistant_id}")
async def update_assistant(
    assistant_id: int,
    assistant_data: AssistantUpdate,
    current_admin: Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    """Update a regional assistant account. Admin access is required."""
    admin_service = AdminService(db)
    assistant, error = admin_service.update_assistant(
        assistant_id,
        assistant_data,
        current_admin.id,
    )

    if error:
        if "not found" in error.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    return assistant


@router.delete("/assistants/{assistant_id}")
async def delete_assistant(
    assistant_id: int,
    current_admin: Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    """Delete a regional assistant account. Admin access is required."""
    admin_service = AdminService(db)
    error = admin_service.delete_assistant(assistant_id, current_admin.id)

    if error:
        if "not found" in error.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    return {"message": "Assistant deleted successfully"}


@router.get("/audit-logs")
async def get_audit_logs(
    current_admin: Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    action_type: str = None,
    entity_type: str = None,
):
    """Get audit logs for admin actions. Super admin access is required for viewing all logs."""
    # Use raw SQL to avoid enum deserialization errors with legacy data
    query = text("""
        SELECT id, action, entity_type, entity_id, actor_id, actor_type, details, status, created_at
        FROM audit_logs
        WHERE 1=1
    """)
    
    params = {}
    
    if action_type:
        query = text(str(query) + " AND action = :action_type")
        params["action_type"] = action_type
    
    if entity_type:
        query = text(str(query) + " AND entity_type = :entity_type")
        params["entity_type"] = entity_type
    
    count_query = text("""
        SELECT COUNT(*) FROM audit_logs WHERE 1=1
    """)
    
    if action_type:
        count_query = text(str(count_query) + " AND action = :action_type")
    if entity_type:
        count_query = text(str(count_query) + " AND entity_type = :entity_type")
    
    # Execute raw count query
    total_result = db.execute(count_query, params).scalar()
    total = total_result or 0
    
    # Get paginated logs
    final_query = text(str(query) + " ORDER BY created_at DESC LIMIT :limit OFFSET :skip")
    params["limit"] = limit
    params["skip"] = skip
    
    result = db.execute(final_query, params)
    rows = result.fetchall()
    
    return [
        {
            "id": row[0],
            "action": row[1],
            "entity_type": row[2],
            "entity_id": row[3],
            "actor_id": row[4],
            "actor_type": row[5],
            "details": row[6],
            "status": row[7],
            "created_at": row[8].isoformat() if row[8] else None,
        }
        for row in rows
    ]


@router.get("/audit-logs/count")
async def get_audit_logs_count(
    current_admin: Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    """Get total count of audit logs."""
    result = db.execute(text("SELECT COUNT(*) FROM audit_logs"))
    count = result.scalar() or 0
    return {"total": count}


@router.post("/upload", tags=["Admin - Pharmacy Management"])
async def upload_fichier_pharmacies(
    fichier: UploadFile = File(...),
    current_admin: Administrateur = Depends(staff_required),
    db: Session = Depends(get_db),
):
    """Bulk upload pharmacy data from CSV file.
    
    **Description:**
    Parses CSV file, validates each row, and bulk inserts valid pharmacies.
    Invalid rows are reported with error details (not inserted).
    Supports flexible column naming (latitude/lat, longitude/lon, etc.).
    
    **CSV Requirements:**
    - Required columns: name, latitude, longitude (flexible naming)
    - Optional columns: osm_type, osm_id, address, phone, governorate
    - Max file size: 5MB
    - Max rows: 5,000 per upload
    - Format: UTF-8 encoded CSV
    
    **Validation Rules:**
    - Latitude: -90 to 90
    - Longitude: -180 to 180
    - OSM ID: Checked for duplicates (current upload + DB)
    
    **Returns:**
    ```json
    {
        "total_rows": 10,
        "successful": 8,
        "failed": 2,
        "errors": [
            {"row_number": 3, "error_message": "Invalid latitude: 95.5"}
        ]
    }
    ```
    
    **Error Codes:**
    - `400`: Invalid file format, empty file, missing required columns, validation errors
    - `401`: Not authenticated or not admin
    - `413`: File too large or too many rows
    - `500`: Database error
    """
    pharmacy_service = PharmacyService(db)
    
    content = await fichier.read()
    response_data, error = pharmacy_service.upload_csv(
        content,
        fichier.filename,
        current_admin.id,
        region_scope=_region_scope_for(current_admin),
    )
    
    if error:
        _raise_service_error(error)

    # Invalidate public pharmacy caches after successful data changes.
    cache = CacheService()
    cache.invalidate_prefix("pharmacies:")
    
    return response_data


@router.get("/pharmacies")
async def get_pharmacies(
    current_admin: Administrateur = Depends(staff_required),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all pharmacies with pagination.
    
    - Requires admin authorization
    - Returns list of pharmacies with pagination support
    - Sorted by creation date (newest first)
    """
    pharmacy_service = PharmacyService(db)
    return pharmacy_service.get_pharmacies(
        skip=skip,
        limit=limit,
        region_scope=_region_scope_for(current_admin),
    )


@router.get("/pharmacies/count")
async def get_pharmacies_count(
    current_admin: Administrateur = Depends(staff_required),
    db: Session = Depends(get_db),
):
    """
    Get total count of pharmacies in the database.
    """
    pharmacy_service = PharmacyService(db)
    count = pharmacy_service.get_pharmacy_count(region_scope=_region_scope_for(current_admin))
    return {"total": count}


@router.post("/gardes/upload")
async def upload_garde_planning(
    fichier: UploadFile = File(...),
    current_admin: Administrateur = Depends(staff_required),
    db: Session = Depends(get_db),
):
    """Bulk upload garde planning rows from CSV."""
    garde_service = GardeService(db)

    content = await fichier.read()
    response_data, error = garde_service.upload_csv_for_region(
        content,
        fichier.filename,
        current_admin.id,
        region_scope=_region_scope_for(current_admin),
    )

    if error:
        _raise_service_error(error)

    return response_data


@router.get("/gardes")
async def get_gardes(
    current_admin: Administrateur = Depends(staff_required),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """List garde schedule rows for the admin UI."""
    garde_service = GardeService(db)
    return garde_service.get_gardes(
        skip=skip,
        limit=limit,
        region_scope=_region_scope_for(current_admin),
    )


@router.get("/gardes/count")
async def get_garde_count(
    current_admin: Administrateur = Depends(staff_required),
    db: Session = Depends(get_db),
):
    """Return total number of garde schedule rows."""
    garde_service = GardeService(db)
    return {"total": garde_service.get_garde_count(region_scope=_region_scope_for(current_admin))}


@router.post("/medicines/upload")
async def upload_medicine_csv(
    fichier: UploadFile = File(...),
    current_admin: Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    """Bulk upload medicines from CSV using code_pct upsert behavior."""
    medicine_service = MedicineService(db)

    content = await fichier.read()
    response_data, error = medicine_service.upload_csv(content, fichier.filename, current_admin.id)

    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    cache = CacheService()
    cache.invalidate_prefix("medicines:")

    return response_data


@router.get("/medicines")
async def get_medicines(
    current_admin: Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    medicine_service = MedicineService(db)
    return medicine_service.get_medicines(skip=skip, limit=limit)


@router.get("/medicines/count")
async def get_medicine_count(
    current_admin: Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    medicine_service = MedicineService(db)
    return {"total": medicine_service.get_medicine_count()}


# ---- PHARMACY CRUD ENDPOINTS ----


@router.post("/pharmacies", tags=["Admin - Pharmacy Management"])
async def create_pharmacy(
    pharmacy: PharmacieCreate,
    current_admin: Administrateur = Depends(staff_required),
    db: Session = Depends(get_db),
):
    """Create a new pharmacy record.
    
    **Description:**
    Allows admin to manually create a pharmacy entry without file upload.
    Validates pharmacy data and prevents duplicate osm_id entries.
    
    **Parameters:**
    - name: Required, pharmacy name
    - latitude/longitude: Required, coordinates between -90/90 and -180/180
    - address, phone, governorate: Optional fields
    - osm_type, osm_id: Optional OpenStreetMap references
    
    **Returns:** Created pharmacy with ID and timestamps
    
    **Error Codes:**
    - `400`: Validation error or duplicate osm_id
    - `401`: Not authenticated or not admin
    - `500`: Database error
    """
    pharmacy_service = PharmacyService(db)
    result, error = pharmacy_service.create_pharmacy(
        pharmacy.model_dump(),
        current_admin.id,
        region_scope=_region_scope_for(current_admin),
    )
    
    if error:
        _raise_service_error(error)
    
    cache = CacheService()
    cache.invalidate_prefix("pharmacies:")
    
    return result


@router.get("/pharmacies/{pharmacy_id}", tags=["Admin - Pharmacy Management"])
async def get_pharmacy(
    pharmacy_id: int,
    current_admin: Administrateur = Depends(staff_required),
    db: Session = Depends(get_db),
):
    """Get a pharmacy by ID.
    
    **Returns:** Pharmacy details with all fields and timestamps
    """
    pharmacy_service = PharmacyService(db)
    pharmacy = pharmacy_service.get_pharmacy_by_id(
        pharmacy_id,
        region_scope=_region_scope_for(current_admin),
    )
    
    if not pharmacy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pharmacy not found")
    
    return pharmacy


@router.put("/pharmacies/{pharmacy_id}", tags=["Admin - Pharmacy Management"])
async def update_pharmacy(
    pharmacy_id: int,
    updates: PharmacieUpdate,
    current_admin: Administrateur = Depends(staff_required),
    db: Session = Depends(get_db),
):
    """Update a pharmacy record.
    
    **Description:**
    Allows admin to update pharmacy fields. All fields are optional.
    Only provided fields will be updated.
    
    **Parameters:**
    All fields from PharmacieCreate are optional
    
    **Returns:** Updated pharmacy data
    
    **Error Codes:**
    - `400`: Validation error or duplicate osm_id
    - `401`: Not authenticated or not admin
    - `404`: Pharmacy not found
    - `500`: Database error
    """
    pharmacy_service = PharmacyService(db)
    result, error = pharmacy_service.update_pharmacy(
        pharmacy_id,
        {k: v for k, v in updates.model_dump().items() if v is not None},
        current_admin.id,
        region_scope=_region_scope_for(current_admin),
    )
    
    if error:
        if "not found" in error.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error)
        _raise_service_error(error)
    
    cache = CacheService()
    cache.invalidate_prefix("pharmacies:")
    
    return result


@router.delete("/pharmacies/{pharmacy_id}", tags=["Admin - Pharmacy Management"])
async def delete_pharmacy(
    pharmacy_id: int,
    current_admin: Administrateur = Depends(staff_required),
    db: Session = Depends(get_db),
):
    """Delete a pharmacy record.
    
    **Returns:** Success message
    
    **Error Codes:**
    - `401`: Not authenticated or not admin
    - `404`: Pharmacy not found
    - `500`: Database error
    """
    pharmacy_service = PharmacyService(db)
    error = pharmacy_service.delete_pharmacy(pharmacy_id, region_scope=_region_scope_for(current_admin))
    
    if error:
        if "not found" in error.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=error)
    
    cache = CacheService()
    cache.invalidate_prefix("pharmacies:")
    
    return {"message": "Pharmacy deleted successfully"}


# ---- GARDE SCHEDULE CRUD ENDPOINTS ----


@router.post("/gardes", tags=["Admin - Garde Management"])
async def create_garde(
    garde: GardeScheduleCreate,
    current_admin: Administrateur = Depends(staff_required),
    db: Session = Depends(get_db),
):
    """Create a new garde schedule entry.
    
    **Description:**
    Allows admin to manually create a garde schedule without file upload.
    Validates date/time format and prevents duplicate schedules.
    
    **Parameters:**
    - date: Required, YYYY-MM-DD format
    - pharmacy_name: Required
    - start_time, end_time: Required, HH:MM format
    - city, governorate, shift_type, notes: Optional
    
    **Returns:** Created garde schedule with ID and timestamps
    
    **Error Codes:**
    - `400`: Validation error or duplicate entry
    - `401`: Not authenticated or not admin
    - `500`: Database error
    """
    garde_service = GardeService(db)
    result, error = garde_service.create_garde(
        garde.model_dump(),
        current_admin.id,
        region_scope=_region_scope_for(current_admin),
    )
    
    if error:
        _raise_service_error(error)
    
    return result


@router.get("/gardes/{garde_id}", tags=["Admin - Garde Management"])
async def get_garde(
    garde_id: int,
    current_admin: Administrateur = Depends(staff_required),
    db: Session = Depends(get_db),
):
    """Get a garde schedule by ID.
    
    **Returns:** Garde schedule details with all fields and timestamps
    """
    garde_service = GardeService(db)
    garde = garde_service.get_garde_by_id(garde_id, region_scope=_region_scope_for(current_admin))
    
    if not garde:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Garde schedule not found")
    
    return garde


@router.put("/gardes/{garde_id}", tags=["Admin - Garde Management"])
async def update_garde(
    garde_id: int,
    updates: GardeScheduleUpdate,
    current_admin: Administrateur = Depends(staff_required),
    db: Session = Depends(get_db),
):
    """Update a garde schedule.
    
    **Description:**
    Allows admin to update garde schedule fields. All fields are optional.
    Only provided fields will be updated.
    
    **Parameters:**
    All fields from GardeScheduleCreate are optional
    
    **Returns:** Updated garde schedule data
    
    **Error Codes:**
    - `400`: Validation error
    - `401`: Not authenticated or not admin
    - `404`: Garde schedule not found
    - `500`: Database error
    """
    garde_service = GardeService(db)
    result, error = garde_service.update_garde(
        garde_id,
        {k: v for k, v in updates.model_dump().items() if v is not None},
        current_admin.id,
        region_scope=_region_scope_for(current_admin),
    )
    
    if error:
        if "not found" in error.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error)
        _raise_service_error(error)
    
    return result


@router.delete("/gardes/{garde_id}", tags=["Admin - Garde Management"])
async def delete_garde(
    garde_id: int,
    current_admin: Administrateur = Depends(staff_required),
    db: Session = Depends(get_db),
):
    """Delete a garde schedule.
    
    **Returns:** Success message
    
    **Error Codes:**
    - `401`: Not authenticated or not admin
    - `404`: Garde schedule not found
    - `500`: Database error
    """
    garde_service = GardeService(db)
    error = garde_service.delete_garde(garde_id, region_scope=_region_scope_for(current_admin))
    
    if error:
        if "not found" in error.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=error)
    
    return {"message": "Garde schedule deleted successfully"}

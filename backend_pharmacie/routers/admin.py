"""Admin operations and file upload routes.

Handles administrative tasks including file uploads for pharmacy data.

Endpoints:
    POST /api/admin/upload: Upload pharmacy data from CSV or Excel
"""

from typing import List

from database import get_db
from dependencies import admin_required
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from models import Administrateur
from services import CacheService, MedicineService, PharmacyService
from services.admin_service import AdminService
from services.garde_service import GardeService
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/admin", tags=["Administration"])


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


@router.post("/upload", tags=["Admin - Pharmacy Management"])
async def upload_fichier_pharmacies(
    fichier: UploadFile = File(...),
    current_admin: Administrateur = Depends(admin_required),
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
        current_admin.id
    )
    
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    # Invalidate public pharmacy caches after successful data changes.
    cache = CacheService()
    cache.invalidate_prefix("pharmacies:")
    
    return response_data


@router.get("/pharmacies")
async def get_pharmacies(
    current_admin: Administrateur = Depends(admin_required),
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
    return pharmacy_service.get_pharmacies(skip=skip, limit=limit)


@router.get("/pharmacies/count")
async def get_pharmacies_count(
    current_admin: Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    """
    Get total count of pharmacies in the database.
    """
    pharmacy_service = PharmacyService(db)
    count = pharmacy_service.get_pharmacy_count()
    return {"total": count}


@router.post("/gardes/upload")
async def upload_garde_planning(
    fichier: UploadFile = File(...),
    current_admin: Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    """Bulk upload garde planning rows from CSV."""
    garde_service = GardeService(db)

    content = await fichier.read()
    response_data, error = garde_service.upload_csv(content, fichier.filename, current_admin.id)

    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    return response_data


@router.get("/gardes")
async def get_gardes(
    current_admin: Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """List garde schedule rows for the admin UI."""
    garde_service = GardeService(db)
    return garde_service.get_gardes(skip=skip, limit=limit)


@router.get("/gardes/count")
async def get_garde_count(
    current_admin: Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    """Return total number of garde schedule rows."""
    garde_service = GardeService(db)
    return {"total": garde_service.get_garde_count()}


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

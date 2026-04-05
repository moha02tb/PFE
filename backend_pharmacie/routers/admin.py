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
from services import CacheService, PharmacyService
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/admin", tags=["Administration"])


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


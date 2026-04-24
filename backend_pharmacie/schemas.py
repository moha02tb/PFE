"""Pydantic schemas for request/response validation.

Defines input and output models for API endpoints.
Handles validation, serialization, and documentation.

Schemas:
    LoginRequest: Credentials for authentication
    TokenResponse: JWT token pair response
    UserResponse: Public user data
    AdminResponse: Admin data
    AdminCreate: Admin creation input
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

# ---- INPUT VALIDATION SCHEMAS ----


class LoginRequest(BaseModel):
    """User authentication credentials.
    
    Validates email format and password requirements.
    Works for both admin and regular users.
    """

    email: EmailStr = Field(..., description="Email address of admin or user")
    password: str = Field(
        ...,
        min_length=6,
        max_length=128,
        description="Account password (6-128 characters)"
    )

    class Config:
        json_schema_extra = {
            "example": {"email": "admin@pharmacie.com", "password": "SecurePassword123"}
        }


class TokenResponse(BaseModel):
    """JWT token pair response.
    
    Contains both access and refresh tokens for stateless authentication.
    - access_token: Short-lived (15 min), included in requests
    - refresh_token: Long-lived (7 days), used to get new access tokens
    """

    access_token: str = Field(
        ...,
        description="JWT access token (valid 15 minutes). Include in Authorization: Bearer header"
    )
    refresh_token: str = Field(
        ...,
        description="JWT refresh token (valid 7 days). Use to refresh access token when expired"
    )
    token_type: str = Field(
        default="bearer",
        description="Token authentication scheme (always 'bearer')"
    )
    expires_in: int = Field(
        ...,
        description="Access token expiration time in seconds"
    )


class TokenRefreshRequest(BaseModel):
    """Refresh token request"""

    refresh_token: str


class RegisterRequest(BaseModel):
    """Public user registration request.
    
    Creates a new regular user account (not admin).
    Applies basic validation (less strict than admin creation).
    Auto-logs in after successful registration.
    """

    email: EmailStr = Field(
        ...,
        description="Unique email address for the new account"
    )
    password: str = Field(
        ...,
        min_length=6,
        max_length=128,
        description="Account password (6-128 characters)"
    )
    username: str = Field(
        ...,
        min_length=3,
        max_length=100,
        description="Unique username for login (3-100 characters)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "Password123",
                "username": "john_doe",
            }
        }


class RegisterResponse(BaseModel):
    """Registration response for email-verification flows."""

    message: str
    email: EmailStr
    requires_verification: bool = True


class VerifyEmailResponse(BaseModel):
    """Simple verification response payload."""

    message: str


class VerifyEmailCodeRequest(BaseModel):
    """Verify account email with a short code."""

    email: EmailStr
    code: str = Field(..., min_length=4, max_length=12)


class ResendVerificationRequest(BaseModel):
    """Resend verification email request."""

    email: EmailStr


class SearchEventCreate(BaseModel):
    """Public search analytics ingestion payload."""

    event_type: str = Field(..., min_length=3, max_length=50)
    query_text: Optional[str] = Field(None, max_length=255)
    location_label: Optional[str] = Field(None, max_length=255)
    governorate: Optional[str] = Field(None, max_length=100)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    result_count: Optional[int] = Field(None, ge=0)


class AdminResponse(BaseModel):
    """Admin user response (no password)"""

    id: int
    nomUtilisateur: str
    email: str
    phone: Optional[str] = None
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    """Regular user response (no password)"""

    id: int
    nomUtilisateur: str
    email: str
    phone: Optional[str] = None
    is_active: bool
    email_verified: bool = False
    source: str

    class Config:
        from_attributes = True


class AdminCreate(BaseModel):
    """Admin user creation request.
    
    Creates a new admin account with stringent validation.
    Password must contain uppercase, lowercase, and digit.
    Requires admin role to create (admin_required dependency).
    """

    nomUtilisateur: str = Field(
        ...,
        min_length=3,
        max_length=100,
        description="Unique username for admin (3-100 characters)"
    )
    email: EmailStr = Field(
        ...,
        description="Unique email address for the admin account"
    )
    password: str = Field(
        ...,
        min_length=8,
        description="Admin password (min 8 chars, must have uppercase, lowercase, digit)"
    )
    role: str = Field(
        default="admin",
        description="Admin role: 'admin' or 'super_admin'"
    )

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        """Validate password has uppercase, lowercase, and digit"""
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "nomUtilisateur": "adminuser",
                "email": "admin@pharmacie.com",
                "password": "SecurePass123",
                "role": "admin",
            }
        }


class ProfileUpdateRequest(BaseModel):
    """Update current authenticated account profile."""

    nomUtilisateur: Optional[str] = Field(None, min_length=3, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=30)


class AdminCreateByAdmin(BaseModel):
    """Admin creating a regular user (different rules)"""

    nomUtilisateur: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)

    class Config:
        json_schema_extra = {
            "example": {
                "nomUtilisateur": "newuser",
                "email": "user@pharmacie.com",
                "password": "Password123",
            }
        }


class AuditLogResponse(BaseModel):
    """Audit log entry response"""

    id: int
    action: str
    entity_type: str
    entity_id: int
    actor_id: Optional[int]
    actor_type: Optional[str]
    ip_address: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---- EXISTING SCHEMAS ----


class GardeBase(BaseModel):
    dateDebut: datetime
    dateFin: datetime
    # typeGarde: TypeGardeEnum


class GardeOut(GardeBase):
    id: int

    class Config:
        from_attributes = True


class VilleOut(BaseModel):
    id: int
    nom: str
    codePostal: str

    class Config:
        from_attributes = True


class PharmacieOut(BaseModel):
    id: int
    nom: str
    adresse: str
    telephone: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ville: Optional[VilleOut] = None
    gardes: List[GardeOut] = []

    class Config:
        from_attributes = True


# ---- NEW PHARMACY SCHEMAS FOR OSM DATA ----


class PharmacieCreate(BaseModel):
    """Pharmacy creation input (for CSV row validation)"""

    osm_type: str = Field(default="node", description="OSM object type")
    osm_id: Optional[int] = Field(None, description="OpenStreetMap ID")
    name: str = Field(..., min_length=1, description="Pharmacy name")
    address: Optional[str] = Field(None, description="Street address")
    phone: Optional[str] = Field(None, description="Phone number")
    governorate: Optional[str] = Field(None, description="Governorate/Region")
    latitude: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude coordinate")

    class Config:
        json_schema_extra = {
            "example": {
                "osm_type": "node",
                "osm_id": 283583078,
                "name": "الصيدلية المركزية",
                "address": "تونس",
                "phone": "+21674266380",
                "governorate": "Tunis",
                "latitude": 36.8334563,
                "longitude": 10.1809179,
            }
        }


class PharmacieUpdate(BaseModel):
    """Pharmacy update input (all fields optional)"""

    name: Optional[str] = Field(None, min_length=1, description="Pharmacy name")
    address: Optional[str] = Field(None, description="Street address")
    phone: Optional[str] = Field(None, description="Phone number")
    governorate: Optional[str] = Field(None, description="Governorate/Region")
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="Latitude coordinate")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="Longitude coordinate")
    osm_type: Optional[str] = Field(None, description="OSM object type")
    osm_id: Optional[int] = Field(None, description="OpenStreetMap ID")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Updated Pharmacy Name",
                "phone": "+21674266389",
                "governorate": "Tunis",
                "latitude": 36.8334563,
                "longitude": 10.1809179,
            }
        }


class PharmacieResponse(BaseModel):
    """Pharmacy response (full data)"""

    id: int
    osm_type: str
    osm_id: Optional[int]
    name: str
    address: Optional[str]
    phone: Optional[str]
    governorate: Optional[str]
    latitude: float
    longitude: float
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True


class PharmacieUploadErrorDetail(BaseModel):
    """Detail of a single row error during upload"""

    row_number: int = Field(..., description="CSV row number (1-indexed)")
    error_message: str = Field(..., description="Error reason")


class PharmacieUploadResponse(BaseModel):
    """Response for pharmacy bulk upload endpoint"""

    total_rows: int = Field(..., description="Total rows processed")
    successful: int = Field(..., description="Successfully imported rows")
    failed: int = Field(..., description="Failed rows")
    errors: List[PharmacieUploadErrorDetail] = Field(
        default_factory=list, description="List of errors with row numbers"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "total_rows": 10,
                "successful": 8,
                "failed": 2,
                "errors": [
                    {
                        "row_number": 3,
                        "error_message": "Invalid latitude: 95.5 (must be between -90 and 90)",
                    },
                    {"row_number": 7, "error_message": "Required field 'name' is empty"},
                ],
            }
        }


class MedicineUploadIssueDetail(BaseModel):
    """Detail of a validation error or warning during medicine upload."""

    row_number: int = Field(..., description="CSV row number (1-indexed)")
    error_message: str = Field(..., description="Issue description")


class MedicineCreate(BaseModel):
    """Medicine creation input derived from CSV rows."""

    code_pct: str = Field(..., min_length=1, max_length=50)
    nom_commercial: str = Field(..., min_length=1, max_length=255)
    prix_public_dt: float = Field(..., ge=0)
    tarif_reference_dt: float = Field(..., ge=0)
    categorie_remboursement: str = Field(..., min_length=1, max_length=20)
    dci: str = Field(..., min_length=1, max_length=255)
    ap: str = Field(..., min_length=1, max_length=20)


class MedicineResponse(BaseModel):
    id: int
    code_pct: str
    nom_commercial: str
    prix_public_dt: float
    tarif_reference_dt: float
    categorie_remboursement: str
    dci: str
    ap: str
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True


class MedicineUploadResponse(BaseModel):
    total_rows: int
    successful: int
    failed: int
    errors: List[MedicineUploadIssueDetail] = Field(default_factory=list)
    warnings: List[MedicineUploadIssueDetail] = Field(default_factory=list)


# ---- GARDE SCHEDULE SCHEMAS ----


class GardeScheduleCreate(BaseModel):
    """Garde schedule creation input"""

    date: str = Field(..., description="Date in YYYY-MM-DD format")
    pharmacy_name: str = Field(..., min_length=1, description="Pharmacy name")
    start_time: str = Field(..., description="Start time in HH:MM format")
    end_time: str = Field(..., description="End time in HH:MM format")
    city: Optional[str] = Field(None, description="City")
    governorate: Optional[str] = Field(None, description="Governorate/Region")
    shift_type: Optional[str] = Field(None, description="Shift type")
    notes: Optional[str] = Field(None, description="Additional notes")

    class Config:
        json_schema_extra = {
            "example": {
                "date": "2025-01-15",
                "pharmacy_name": "الصيدلية المركزية",
                "start_time": "08:00",
                "end_time": "20:00",
                "city": "Tunis",
                "governorate": "Tunis",
                "shift_type": "day_shift",
                "notes": "Regular shift",
            }
        }


class GardeScheduleUpdate(BaseModel):
    """Garde schedule update input (all fields optional)"""

    date: Optional[str] = Field(None, description="Date in YYYY-MM-DD format")
    pharmacy_name: Optional[str] = Field(None, min_length=1, description="Pharmacy name")
    start_time: Optional[str] = Field(None, description="Start time in HH:MM format")
    end_time: Optional[str] = Field(None, description="End time in HH:MM format")
    city: Optional[str] = Field(None, description="City")
    governorate: Optional[str] = Field(None, description="Governorate/Region")
    shift_type: Optional[str] = Field(None, description="Shift type")
    notes: Optional[str] = Field(None, description="Additional notes")

    class Config:
        json_schema_extra = {
            "example": {
                "pharmacy_name": "Updated Pharmacy Name",
                "shift_type": "night_shift",
            }
        }


class GardeScheduleResponse(BaseModel):
    """Garde schedule response (full data)"""

    id: int
    date: str
    pharmacy_name: str
    start_time: str
    end_time: str
    city: Optional[str]
    governorate: Optional[str]
    shift_type: Optional[str]
    notes: Optional[str]
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

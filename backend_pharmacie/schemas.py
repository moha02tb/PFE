from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional
from datetime import datetime
from enum import Enum

# ---- INPUT VALIDATION SCHEMAS ----

class LoginRequest(BaseModel):
    """Validated login input"""
    email: EmailStr  # Validates email format
    password: str = Field(..., min_length=6, max_length=128)
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "admin@pharmacie.com",
                "password": "SecurePassword123"
            }
        }


class TokenResponse(BaseModel):
    """Token pair response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class TokenRefreshRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class AdminResponse(BaseModel):
    """Admin user response (no password)"""
    id: int
    nomUtilisateur: str
    email: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class AdminCreate(BaseModel):
    """Admin creation with validation"""
    nomUtilisateur: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: str = Field(default="user")

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """Validate password has uppercase, lowercase, and digit"""
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "nomUtilisateur": "johnadmin",
                "email": "john@pharmacie.com",
                "password": "SecurePass123"
            }
        }


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
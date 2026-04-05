"""Authentication and authorization routes.

Handles user authentication, token generation, refresh,
admin operations, and account management.

Endpoints:
    POST /auth/login: User login
    POST /auth/refresh: Refresh access token
    POST /auth/register: User registration
    POST /auth/admin-login: Admin login
    POST /admin/create-user: Create admin user
    GET /account: Get current user account
"""

from typing import Union

import models
from database import get_db
from dependencies import admin_required, get_current_account
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from schemas import (
    AdminCreate,
    AdminCreateByAdmin,
    LoginRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    TokenRefreshRequest,
    TokenResponse,
)
from services import AuthService, AdminService
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


# ---- UNIFIED LOGIN ENDPOINT ----
@router.post("/login", response_model=TokenResponse, tags=["Authentication"])
@limiter.limit("5/15 minutes")
async def login(
    request: Request, credentials: LoginRequest, response: Response, db: Session = Depends(get_db)
):
    """Unified login for admins and regular users.
    
    **Description:**
    Auto-detects whether email belongs to admin or regular user.
    Issues appropriate JWT token pair with correct role.
    
    **Rate Limiting:** 5 attempts per 15 minutes per IP address
    
    **Returns:**
    - `access_token` (15 min validity): Include in `Authorization: Bearer <token>` header
    - `refresh_token` (7 days validity): Use to refresh access token
    
    **Error Codes:**
    - `401`: Invalid credentials (email not found or password mismatch)
    - `429`: Rate limit exceeded (too many login attempts)
    - `500`: Server error
    """
    auth_service = AuthService(db)
    ip_address = request.client.host
    
    token_response, error = auth_service.login(credentials, ip_address)
    
    if error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=error)
    
    from security import ACCESS_TOKEN_EXPIRE_MINUTES
    response.set_cookie(
        key="access_token",
        value=token_response["access_token"],
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return token_response


# ---- PUBLIC REGISTRATION ENDPOINT ----
@router.post("/register", response_model=TokenResponse, tags=["Authentication"])
@limiter.limit("5/15 minutes")
async def register(
    request: Request, reg_data: RegisterRequest, response: Response, db: Session = Depends(get_db)
):
    """Register new regular user (public endpoint).
    
    **Description:**
    Creates new user account in utilisateurs table.
    Email and username must be unique across all system.
    Auto-logs in immediately after account creation.
    
    **Rate Limiting:** 5 registrations per 15 minutes per IP
    
    **Returns:**
    - Access token (auto-linked to new account)
    - Refresh token for token renewal
    
    **Error Codes:**
    - `400`: Email or username already registered
    - `422`: Validation error (invalid email, password too short, etc.)
    - `429`: Rate limit exceeded
    """
    auth_service = AuthService(db)
    token_response, error = auth_service.register(reg_data)
    
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    from security import ACCESS_TOKEN_EXPIRE_MINUTES
    response.set_cookie(
        key="access_token",
        value=token_response["access_token"],
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return token_response


# ---- REFRESH TOKEN ENDPOINT ----
@router.post("/refresh", response_model=TokenResponse, tags=["Authentication"])
async def refresh(request: TokenRefreshRequest, response: Response, db: Session = Depends(get_db)):
    """Refresh expired access token.
    
    **Description:**
    Issues new access token using refresh token.
    Validates token signature, expiration, and revocation status.
    
    **Request Body:**
    - `refresh_token`: Long-lived token received from login/register
    
    **Returns:**
    - New access token (valid 15 minutes)
    - Same refresh token (still valid)
    
    **Error Codes:**
    - `401`: Invalid/expired/revoked refresh token
    - `422`: Validation error
    """
    auth_service = AuthService(db)
    token_response, error = auth_service.refresh_access_token(request.refresh_token)
    
    if error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=error)
    
    from security import ACCESS_TOKEN_EXPIRE_MINUTES
    response.set_cookie(
        key="access_token",
        value=token_response["access_token"],
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return token_response


# ---- LOGOUT ENDPOINT ----
@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    user: Union[models.Administrateur, models.Utilisateur] = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    """
    Logout endpoint that revokes refresh token (works for both admins and users).
    """
    auth_service = AuthService(db)
    
    # Extract refresh token from request body
    try:
        body = await request.json()
        refresh_token = body.get("refresh_token")
    except:
        refresh_token = None

    auth_service.logout(refresh_token)

    # Clear access token cookie
    response.delete_cookie(key="access_token")

    return {"message": "Logged out successfully"}


# ---- GET CURRENT USER (/me works for both types) ----
@router.get("/me")
async def get_me(
    user: Union[models.Administrateur, models.Utilisateur] = Depends(get_current_account)
):
    """Get current authenticated user info (works for both admins and regular users)"""
    from schemas import AdminResponse, UserResponse
    
    if isinstance(user, models.Administrateur):
        return AdminResponse.model_validate(user)
    else:
        return UserResponse.model_validate(user)


@router.put("/me")
async def update_me(
    payload: ProfileUpdateRequest,
    user: Union[models.Administrateur, models.Utilisateur] = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    """Update current authenticated account profile (admin or regular user)."""
    auth_service = AuthService(db)
    updated_user, error = auth_service.update_profile(user, payload)
    
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    return updated_user


# ---- CREATE ADMIN (admin+ required) ----
@router.post("/admin/create")
async def create_admin(
    admin_data: AdminCreate,
    current_user: models.Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    """Create new admin user (admin+ role required)"""
    admin_service = AdminService(db)
    new_admin, error = admin_service.create_admin(admin_data, current_user.id)
    
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    return new_admin


# ---- CREATE USER BY ADMIN ----
@router.post("/admin/create-user")
async def admin_create_user(
    user_data: AdminCreateByAdmin,
    current_admin: models.Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    """Create new regular user account (admin only)"""
    auth_service = AuthService(db)
    new_user, error = auth_service.create_user_by_admin(user_data)
    
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    return new_user
    db.refresh(new_user)

    return new_user

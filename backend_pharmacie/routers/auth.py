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

import logging
import os
import models
from database import SessionLocal, get_db
from dependencies import admin_required, get_current_account
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from schemas import (
    AdminCreate,
    AdminCreateByAdmin,
    ChangePasswordRequest,
    LoginRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    RegisterResponse,
    ResendVerificationRequest,
    TokenRefreshRequest,
    TokenResponse,
    VerifyEmailCodeRequest,
    VerifyEmailResponse,
)
from services import AuthService
from services.admin_service import AdminService
from permissions import role_value
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/auth", tags=["authentication"])
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


def _send_verification_email_now(email: str) -> None:
    """Send verification email with an independent DB session."""
    db = SessionLocal()
    try:
        error = AuthService(db).send_verification_email_for_user(email)
        if error:
            logger.error("Verification email failed for %s: %s", email, error)
            raise RuntimeError(error)
        logger.info("Verification email sent for %s", email)
    finally:
        db.close()

def _cookie_secure_default(request: Request) -> bool:
    """Decide whether auth cookies should be marked Secure.

    In local development the API is commonly served over HTTP, where a Secure cookie
    would be silently dropped by browsers. Allow overriding via COOKIE_SECURE.
    """
    raw = os.getenv("COOKIE_SECURE")
    if raw is not None:
        return raw.strip().lower() in {"1", "true", "yes", "on"}
    return request.url.scheme == "https"


def _set_auth_cookies(request: Request, response: Response, token_response: dict) -> None:
    secure = _cookie_secure_default(request)
    cookie_settings = {
        "httponly": True,
        "secure": secure,
        "samesite": "lax",
        "path": "/",
    }
    response.set_cookie(
        key="access_token",
        value=token_response["access_token"],
        max_age=token_response["expires_in"],
        **cookie_settings,
    )
    response.set_cookie(
        key="refresh_token",
        value=token_response["refresh_token"],
        max_age=7 * 24 * 60 * 60,
        **cookie_settings,
    )


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
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent")
    
    token_response, error = auth_service.login(credentials, ip_address, user_agent)
    
    if error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=error)

    _set_auth_cookies(request, response, token_response)
    return token_response


# ---- PUBLIC REGISTRATION ENDPOINT ----
@router.post("/register", response_model=RegisterResponse, tags=["Authentication"])
@limiter.limit("5/15 minutes")
async def register(
    request: Request,
    reg_data: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """Register new regular user (public endpoint).
    
    **Description:**
    Creates new user account in utilisateurs table.
    Email and username must be unique across all system.
    Sends a verification email through SMTP before the account can sign in.
    
    **Rate Limiting:** 5 registrations per 15 minutes per IP
    
    **Returns:**
    - Confirmation message
    - Registered email
    - `requires_verification=true`
    
    **Error Codes:**
    - `400`: Email or username already registered
    - `422`: Validation error (invalid email, password too short, etc.)
    - `429`: Rate limit exceeded
    """
    auth_service = AuthService(db)
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent")
    token_response, error = auth_service.register(reg_data, ip_address, user_agent)
    
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    try:
        _send_verification_email_now(token_response["email"])
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
    
    return token_response


@router.post("/verify-email", response_model=VerifyEmailResponse, tags=["Authentication"])
@limiter.limit("5/15 minutes")
async def verify_email(
    request: Request,
    payload: VerifyEmailCodeRequest,
    db: Session = Depends(get_db),
):
    """Verify a pending account email from an email + code pair."""
    auth_service = AuthService(db)
    _, error = auth_service.verify_email_code(payload.email, payload.code)

    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    return {"message": "Email verified successfully. You can now sign in."}


@router.post("/resend-verification", response_model=VerifyEmailResponse, tags=["Authentication"])
@limiter.limit("5/15 minutes")
async def resend_verification_email(
    request: Request,
    payload: ResendVerificationRequest,
    db: Session = Depends(get_db),
):
    """Resend an email verification link for an unverified account."""
    auth_service = AuthService(db)
    result, error = auth_service.resend_verification_email(payload.email)

    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    try:
        _send_verification_email_now(payload.email)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

    return result


# ---- REFRESH TOKEN ENDPOINT ----
@router.post("/refresh", response_model=TokenResponse, tags=["Authentication"])
async def refresh(
    http_request: Request,
    response: Response,
    request: TokenRefreshRequest | None = None,
    refresh_token_cookie: str | None = Cookie(None, alias="refresh_token"),
    db: Session = Depends(get_db),
):
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
    refresh_token = (request.refresh_token if request else None) or refresh_token_cookie
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")

    token_response, error = auth_service.refresh_access_token(refresh_token)
    
    if error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=error)

    _set_auth_cookies(http_request, response, token_response)
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

    if not refresh_token:
        refresh_token = request.cookies.get("refresh_token")

    actor_type = "administrateur" if isinstance(user, models.Administrateur) else "utilisateur"
    auth_service.logout(
        refresh_token,
        actor_id=user.id,
        actor_type=actor_type,
        ip_address=request.client.host if request.client else "unknown",
        user_agent=request.headers.get("user-agent"),
    )

    # Clear auth cookies
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")

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


@router.post("/me/password", status_code=204)
async def change_my_password(
    payload: ChangePasswordRequest,
    user: Union[models.Administrateur, models.Utilisateur] = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    """Change the current account password."""
    auth_service = AuthService(db)
    error = auth_service.change_password(user, payload.current_password, payload.new_password)
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)


# ---- CREATE ADMIN (admin+ required) ----
@router.post("/admin/create")
async def create_admin(
    admin_data: AdminCreate,
    current_user: models.Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    """Create new admin user (admin+ role required)"""
    requested_role = str(admin_data.role).strip().lower()
    if requested_role == "super_admin" and role_value(current_user.role) != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can create super admin accounts",
        )

    admin_service = AdminService(db)
    new_admin, error = admin_service.create_admin(admin_data, current_user.id)
    
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    return new_admin


# ---- CREATE USER BY ADMIN ----
@router.post("/admin/create-user")
async def admin_create_user(
    request: Request,
    user_data: AdminCreateByAdmin,
    current_admin: models.Administrateur = Depends(admin_required),
    db: Session = Depends(get_db),
):
    """Create new regular user account (admin only)"""
    auth_service = AuthService(db)
    new_user, error = auth_service.create_user_by_admin(
        user_data,
        created_by_admin_id=current_admin.id,
        ip_address=request.client.host if request.client else "unknown",
        user_agent=request.headers.get("user-agent"),
    )
    
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    return new_user

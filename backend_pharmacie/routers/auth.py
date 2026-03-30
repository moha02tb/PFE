from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from slowapi import Limiter
from slowapi.util import get_remote_address
import models
from database import get_db
from schemas import LoginRequest, TokenResponse, TokenRefreshRequest, AdminResponse, AdminCreate
from security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, verify_token, ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS
)
from dependencies import get_current_user, admin_required

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


# ---- LOGIN ENDPOINT ----
@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/15 minutes")
async def login(
    request: Request,
    credentials: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Login endpoint that issues both access and refresh tokens.
    
    - Access token: Short-lived (15 mins), used for API requests
    - Refresh token: Long-lived (7 days), used to get new access tokens
    - Both stored in HttpOnly, Secure cookies
    
    Returns:
        TokenResponse with tokens and expiration info
    """
    # Get client IP for logging
    ip_address = request.client.host
    
    # Find user by email
    admin = db.query(models.Administrateur).filter(
        models.Administrateur.email == credentials.email
    ).first()
    
    # Log attempt before validation to avoid enumeration attacks
    if not admin or not admin.is_active:
        db.add(models.LoginAttempt(
            email=credentials.email,
            ip_address=ip_address,
            success=False
        ))
        db.commit()
        
        # Generic error (prevents email enumeration)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Verify password
    if not verify_password(credentials.password, admin.motDePasse):
        db.add(models.LoginAttempt(
            email=credentials.email,
            ip_address=ip_address,
            success=False
        ))
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create tokens
    access_token = create_access_token(admin.id, admin.role)
    refresh_token, jti = create_refresh_token(admin.id)
    
    # Store refresh token JTI in database for revocation
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    db.add(models.RefreshToken(
        admin_id=admin.id,
        token_jti=jti,
        expires_at=expires_at
    ))
    
    # Log successful attempt
    db.add(models.LoginAttempt(
        email=credentials.email,
        ip_address=ip_address,
        success=True
    ))
    db.commit()
    
    # Set HttpOnly, Secure cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,  # Only over HTTPS in production
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    # Return tokens (frontend stores refresh token in localStorage)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


# ---- REFRESH TOKEN ENDPOINT ----
@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: TokenRefreshRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Refresh expired access token using a refresh token.
    
    - Validates refresh token signature and expiry
    - Checks if refresh token was revoked
    - Issues new access token
    """
    payload = verify_token(request.refresh_token, token_type="refresh")
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    admin_id = int(payload.get("sub"))
    jti = payload.get("jti")
    
    # Check if token was revoked (exists in database)
    revoked = db.query(models.RefreshToken).filter(
        (models.RefreshToken.admin_id == admin_id) &
        (models.RefreshToken.token_jti == jti)
    ).first()
    
    if not revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token was revoked"
        )
    
    # Get admin to verify still active
    admin = db.query(models.Administrateur).filter(
        models.Administrateur.id == admin_id
    ).first()
    
    if not admin or not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User inactive"
        )
    
    # Issue new access token
    new_access_token = create_access_token(admin.id, admin.role)
    
    # Update cookie
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return {
        "access_token": new_access_token,
        "refresh_token": request.refresh_token,  # Keep same refresh token
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


# ---- LOGOUT ENDPOINT ----
@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    user: models.Administrateur = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logout endpoint that revokes refresh token.
    
    - Invalidates the refresh token in database
    - Access token will expire naturally
    """
    # Extract refresh token from request body (if provided)
    try:
        body = await request.json()
        refresh_token = body.get("refresh_token")
    except:
        refresh_token = None
    
    if refresh_token:
        from security import verify_token
        payload = verify_token(refresh_token, token_type="refresh")
        if payload:
            jti = payload.get("jti")
            # Revoke token
            db.query(models.RefreshToken).filter(
                models.RefreshToken.token_jti == jti
            ).delete()
            db.commit()
    
    # Clear access token cookie
    response.delete_cookie(key="access_token")
    
    return {"message": "Logged out successfully"}


# ---- GET CURRENT USER ----
@router.get("/me", response_model=AdminResponse)
async def get_me(user: models.Administrateur = Depends(get_current_user)):
    """Get current authenticated user info"""
    return user


# ---- CREATE ADMIN (admin+ required) ----
@router.post("/admin/create", response_model=AdminResponse)
async def create_admin(
    admin_data: AdminCreate,
    current_user: models.Administrateur = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """Create new admin user (admin+ role required)"""
    # Check if email already exists
    existing = db.query(models.Administrateur).filter(
        models.Administrateur.email == admin_data.email
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    existing_user = db.query(models.Administrateur).filter(
        models.Administrateur.nomUtilisateur == admin_data.nomUtilisateur
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new admin with hashed password
    new_admin = models.Administrateur(
        nomUtilisateur=admin_data.nomUtilisateur,
        email=admin_data.email,
        motDePasse=hash_password(admin_data.password),
        role=admin_data.role,
        is_active=True
    )
    
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    
    return new_admin

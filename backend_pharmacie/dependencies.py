from fastapi import Depends, HTTPException, status, Cookie
from sqlalchemy.orm import Session
from typing import Optional
import models
from security import verify_token
from database import get_db


async def get_current_user(
    access_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
) -> models.Administrateur:
    """Dependency to get authenticated user from token
    
    - Reads access token from HttpOnly cookie
    - Validates token signature and expiry
    - Returns active user from database
    """
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    payload = verify_token(access_token, token_type="access")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    admin_id = int(payload.get("sub"))
    admin = db.query(models.Administrateur).filter(
        models.Administrateur.id == admin_id
    ).first()
    
    if not admin or not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return admin


def admin_required(user: models.Administrateur = Depends(get_current_user)) -> models.Administrateur:
    """Dependency to require admin or super_admin role"""
    if user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this resource"
        )
    return user


def super_admin_required(user: models.Administrateur = Depends(get_current_user)) -> models.Administrateur:
    """Dependency to require super_admin role"""
    if user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can access this resource"
        )
    return user

"""Dependency injection utilities for FastAPI routes.

Provides functions for extracting and validating user/admin identity
from JWT tokens in cookies or Authorization headers.

Dependencies:
    get_current_admin: Returns authenticated admin user
    get_current_user: Returns authenticated regular user
    admin_required: Enforces admin-only access
"""

from typing import Optional, Union

import models
from database import get_db
from fastapi import Cookie, Depends, Header, HTTPException, status
from security import verify_token
from sqlalchemy.orm import Session


async def get_current_admin(
    access_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> models.Administrateur:
    """Dependency to get authenticated admin user only

    - Reads access token from Authorization header or cookie
    - Validates token and checks user is admin
    - Returns admin user from administrateurs table
    """
    token = None

    # Try Authorization header first
    if authorization:
        try:
            scheme, token_value = authorization.split()
            if scheme.lower() == "bearer":
                token = token_value
        except (ValueError, IndexError):
            pass

    # Fall back to cookie
    if not token and access_token:
        token = access_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_token(token, token_type="access")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    admin_id = int(payload.get("sub"))
    admin = db.query(models.Administrateur).filter(models.Administrateur.id == admin_id).first()

    if not admin or not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin user not found or inactive"
        )

    return admin


async def get_current_user(
    access_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> models.Utilisateur:
    """Dependency to get authenticated regular user only

    - Reads access token from Authorization header or cookie
    - Validates token and checks user is regular user
    - Returns user from utilisateurs table
    """
    token = None

    # Try Authorization header first
    if authorization:
        try:
            scheme, token_value = authorization.split()
            if scheme.lower() == "bearer":
                token = token_value
        except (ValueError, IndexError):
            pass

    # Fall back to cookie
    if not token and access_token:
        token = access_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_token(token, token_type="access")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = int(payload.get("sub"))
    user = db.query(models.Utilisateur).filter(models.Utilisateur.id == user_id).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive"
        )

    return user


async def get_current_account(
    access_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Union[models.Administrateur, models.Utilisateur]:
    """Dependency to get authenticated user (can be admin or regular user)

    - Tries to find in administrateurs first, then utilisateurs
    - Useful for endpoints that work for both types (login, /me, logout)
    """
    token = None

    # Try Authorization header first
    if authorization:
        try:
            scheme, token_value = authorization.split()
            if scheme.lower() == "bearer":
                token = token_value
        except (ValueError, IndexError):
            pass

    # Fall back to cookie
    if not token and access_token:
        token = access_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_token(token, token_type="access")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = int(payload.get("sub"))

    # Try admin first
    admin = db.query(models.Administrateur).filter(models.Administrateur.id == user_id).first()

    if admin and admin.is_active:
        return admin

    # Try regular user
    user = db.query(models.Utilisateur).filter(models.Utilisateur.id == user_id).first()

    if user and user.is_active:
        return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive"
    )


def admin_required(
    user: models.Administrateur = Depends(get_current_admin),
) -> models.Administrateur:
    """Dependency to require admin role"""
    if user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can access this resource"
        )
    return user


def super_admin_required(
    user: models.Administrateur = Depends(get_current_admin),
) -> models.Administrateur:
    """Dependency to require super_admin role"""
    if user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can access this resource",
        )
    return user

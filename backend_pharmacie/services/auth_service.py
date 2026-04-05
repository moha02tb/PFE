"""Authentication service - core business logic for auth operations.

Extracted from routers/auth.py to enable testing, reuse, and cleaner separation of concerns.
Handles: login (admin/user), registration, token refresh, profile updates, logout.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple, Union

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

import models
from events import EventTypes, get_event_bus
from schemas import (
    AdminCreateByAdmin,
    AdminResponse,
    LoginRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    verify_token,
)


class AuthService:
    """Encapsulates all authentication business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.event_bus = get_event_bus()

    def login(
        self, credentials: LoginRequest, ip_address: str
    ) -> Tuple[dict, Optional[str]]:
        """
        Authenticate user (admin or regular).
        
        Returns: (token_response_dict, error_message)
        - token_response_dict contains access_token, refresh_token, token_type, expires_in
        - error_message is None on success, string on failure
        """
        # Try admin table first
        admin = (
            self.db.query(models.Administrateur)
            .filter(models.Administrateur.email == credentials.email)
            .first()
        )

        if admin and admin.is_active and verify_password(credentials.password, admin.motDePasse):
            response = self._create_login_response(
                user_id=admin.id,
                role=admin.role,
                entity_type="administrateur",
                ip_address=ip_address,
                email=credentials.email,
                success=True,
            )
            self.event_bus.publish(
                EventTypes.AUTH_LOGIN_SUCCESS,
                {
                    "entity_type": "administrateur",
                    "entity_id": admin.id,
                    "email": credentials.email,
                    "ip_address": ip_address,
                },
            )
            return response, None

        # Try user table
        user = (
            self.db.query(models.Utilisateur)
            .filter(models.Utilisateur.email == credentials.email)
            .first()
        )

        if user and user.is_active and verify_password(credentials.password, user.motDePasse):
            # Update last login
            user.last_login = datetime.now(timezone.utc)
            self.db.add(user)

            response = self._create_login_response(
                user_id=user.id,
                role="user",
                entity_type="utilisateur",
                ip_address=ip_address,
                email=credentials.email,
                success=True,
            )
            self.event_bus.publish(
                EventTypes.AUTH_LOGIN_SUCCESS,
                {
                    "entity_type": "utilisateur",
                    "entity_id": user.id,
                    "email": credentials.email,
                    "ip_address": ip_address,
                },
            )
            return response, None

        # Log failed attempt
        self.db.add(
            models.LoginAttempt(email=credentials.email, ip_address=ip_address, success=False)
        )
        self.db.commit()

        self.event_bus.publish(
            EventTypes.AUTH_LOGIN_FAILED,
            {
                "email": credentials.email,
                "ip_address": ip_address,
            },
        )

        return None, "Invalid credentials"

    def _create_login_response(
        self,
        user_id: int,
        role: str,
        entity_type: str,
        ip_address: str,
        email: str,
        success: bool,
    ) -> dict:
        """Create token pair and log the attempt."""
        access_token = create_access_token(user_id, role)
        refresh_token, jti = create_refresh_token(user_id)

        expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        self.db.add(
            models.RefreshToken(
                entity_type=entity_type,
                entity_id=user_id,
                token_jti=jti,
                expires_at=expires_at,
            )
        )

        self.db.add(
            models.LoginAttempt(
                email=email,
                entity_type=entity_type,
                ip_address=ip_address,
                success=success,
            )
        )
        self.db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    def register(self, reg_data: RegisterRequest) -> Tuple[dict, Optional[str]]:
        """
        Register new user (non-admin).
        
        Returns: (token_response_dict, error_message)
        """
        # Check email uniqueness across both tables
        admin_email = (
            self.db.query(models.Administrateur)
            .filter(models.Administrateur.email == reg_data.email)
            .first()
        )

        user_email = (
            self.db.query(models.Utilisateur)
            .filter(models.Utilisateur.email == reg_data.email)
            .first()
        )

        if admin_email or user_email:
            return None, "Email already registered"

        # Check username uniqueness across both tables
        admin_username = (
            self.db.query(models.Administrateur)
            .filter(models.Administrateur.nomUtilisateur == reg_data.username)
            .first()
        )

        user_username = (
            self.db.query(models.Utilisateur)
            .filter(models.Utilisateur.nomUtilisateur == reg_data.username)
            .first()
        )

        if admin_username or user_username:
            return None, "Username already taken"

        # Create user
        new_user = models.Utilisateur(
            nomUtilisateur=reg_data.username,
            email=reg_data.email,
            motDePasse=hash_password(reg_data.password),
            source="self_registered",
            is_active=True,
        )

        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)

        # Create token pair and auto-login
        access_token = create_access_token(new_user.id, "user")
        refresh_token, jti = create_refresh_token(new_user.id)

        expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        self.db.add(
            models.RefreshToken(
                entity_type="utilisateur", entity_id=new_user.id, token_jti=jti, expires_at=expires_at
            )
        )
        self.db.commit()

        self.event_bus.publish(
            EventTypes.AUTH_REGISTERED,
            {
                "user_id": new_user.id,
                "email": new_user.email,
                "username": new_user.nomUtilisateur,
                "source": str(new_user.source),
            },
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }, None

    def refresh_access_token(
        self, refresh_token: str
    ) -> Tuple[Optional[dict], Optional[str]]:
        """
        Generate new access token from refresh token.
        
        Returns: (new_token_dict, error_message)
        """
        payload = verify_token(refresh_token, token_type="refresh")

        if not payload:
            return None, "Invalid refresh token"

        jti = payload.get("jti")

        # Check if token was revoked
        revoked = (
            self.db.query(models.RefreshToken)
            .filter(models.RefreshToken.token_jti == jti)
            .first()
        )

        if not revoked:
            return None, "Refresh token was revoked"

        user_id = int(payload.get("sub"))
        entity_type = revoked.entity_type

        # Get user from appropriate table
        if entity_type == "administrateur":
            user = (
                self.db.query(models.Administrateur)
                .filter(models.Administrateur.id == user_id)
                .first()
            )
            role = user.role if user else "admin"
        else:
            user = (
                self.db.query(models.Utilisateur)
                .filter(models.Utilisateur.id == user_id)
                .first()
            )
            role = "user"

        if not user or not user.is_active:
            return None, "User inactive"

        new_access_token = create_access_token(user.id, role)

        return {
            "access_token": new_access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }, None

    def logout(self, refresh_token: Optional[str] = None) -> bool:
        """Revoke refresh token (logout)."""
        if not refresh_token:
            return True

        payload = verify_token(refresh_token, token_type="refresh")
        if not payload:
            return True

        jti = payload.get("jti")
        self.db.query(models.RefreshToken).filter(models.RefreshToken.token_jti == jti).delete()
        self.db.commit()

        self.event_bus.publish(
            EventTypes.AUTH_LOGOUT,
            {
                "token_jti": jti,
            },
        )

        return True

    def update_profile(
        self,
        user: Union[models.Administrateur, models.Utilisateur],
        payload: ProfileUpdateRequest,
    ) -> Tuple[Optional[Union[AdminResponse, UserResponse]], Optional[str]]:
        """
        Update user profile (email, username, etc).
        
        Returns: (updated_user_response, error_message)
        """
        updates = payload.model_dump(exclude_unset=True)

        if not updates:
            if isinstance(user, models.Administrateur):
                return AdminResponse.model_validate(user), None
            return UserResponse.model_validate(user), None

        # Check email uniqueness
        if "email" in updates:
            existing_admin = (
                self.db.query(models.Administrateur)
                .filter(models.Administrateur.email == updates["email"])
                .first()
            )
            existing_user = (
                self.db.query(models.Utilisateur)
                .filter(models.Utilisateur.email == updates["email"])
                .first()
            )

            conflict = False
            if existing_admin and not (
                isinstance(user, models.Administrateur) and existing_admin.id == user.id
            ):
                conflict = True
            if existing_user and not (
                isinstance(user, models.Utilisateur) and existing_user.id == user.id
            ):
                conflict = True

            if conflict:
                return None, "Email already in use"

        # Check username uniqueness
        if "nomUtilisateur" in updates:
            existing_admin = (
                self.db.query(models.Administrateur)
                .filter(models.Administrateur.nomUtilisateur == updates["nomUtilisateur"])
                .first()
            )
            existing_user = (
                self.db.query(models.Utilisateur)
                .filter(models.Utilisateur.nomUtilisateur == updates["nomUtilisateur"])
                .first()
            )

            conflict = False
            if existing_admin and not (
                isinstance(user, models.Administrateur) and existing_admin.id == user.id
            ):
                conflict = True
            if existing_user and not (
                isinstance(user, models.Utilisateur) and existing_user.id == user.id
            ):
                conflict = True

            if conflict:
                return None, "Username already in use"

        # Apply updates
        for key, value in updates.items():
            setattr(user, key, value)

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        self.event_bus.publish(
            EventTypes.AUTH_PROFILE_UPDATED,
            {
                "entity_type": "administrateur"
                if isinstance(user, models.Administrateur)
                else "utilisateur",
                "entity_id": user.id,
                "updated_fields": list(updates.keys()),
            },
        )

        if isinstance(user, models.Administrateur):
            return AdminResponse.model_validate(user), None
        return UserResponse.model_validate(user), None

    def create_user_by_admin(
        self,
        user_data: AdminCreateByAdmin,
    ) -> Tuple[Optional[UserResponse], Optional[str]]:
        """
        Admin creates new regular user account.
        
        Returns: (user_response, error_message)
        """
        # Check email uniqueness
        admin_email = (
            self.db.query(models.Administrateur)
            .filter(models.Administrateur.email == user_data.email)
            .first()
        )

        user_email = (
            self.db.query(models.Utilisateur)
            .filter(models.Utilisateur.email == user_data.email)
            .first()
        )

        if admin_email or user_email:
            return None, "Email already registered"

        # Check username uniqueness
        admin_username = (
            self.db.query(models.Administrateur)
            .filter(models.Administrateur.nomUtilisateur == user_data.nomUtilisateur)
            .first()
        )

        user_username = (
            self.db.query(models.Utilisateur)
            .filter(models.Utilisateur.nomUtilisateur == user_data.nomUtilisateur)
            .first()
        )

        if admin_username or user_username:
            return None, "Username already taken"

        # Create user
        new_user = models.Utilisateur(
            nomUtilisateur=user_data.nomUtilisateur,
            email=user_data.email,
            motDePasse=hash_password(user_data.password),
            source="admin_created",
            is_active=True,
        )

        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)

        self.event_bus.publish(
            EventTypes.USER_CREATED_BY_ADMIN,
            {
                "user_id": new_user.id,
                "email": new_user.email,
                "username": new_user.nomUtilisateur,
            },
        )

        return UserResponse.model_validate(new_user), None

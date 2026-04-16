"""Admin service - business logic for admin operations.

Extracted from routers/auth.py to enable testing, reuse, and cleaner separation of concerns.
Handles: admin creation, admin management, admin queries.
"""

from typing import Optional, Tuple

from sqlalchemy.orm import Session

import models
from events import EventTypes, get_event_bus
from schemas import AdminCreate, AdminResponse
from security import hash_password, verify_password


class AdminService:
    """Encapsulates all admin-specific business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.event_bus = get_event_bus()

    def create_admin(
        self,
        admin_data: AdminCreate,
        created_by_admin_id: int,
    ) -> Tuple[Optional[AdminResponse], Optional[str]]:
        """
        Create new admin user.
        
        Returns: (admin_response, error_message)
        """
        # Check email uniqueness
        existing_email = (
            self.db.query(models.Administrateur)
            .filter(models.Administrateur.email == admin_data.email)
            .first()
        )

        if existing_email:
            return None, "Email already registered"

        # Check username uniqueness
        existing_username = (
            self.db.query(models.Administrateur)
            .filter(models.Administrateur.nomUtilisateur == admin_data.nomUtilisateur)
            .first()
        )

        if existing_username:
            return None, "Username already taken"

        # Create admin
        new_admin = models.Administrateur(
            nomUtilisateur=admin_data.nomUtilisateur,
            email=admin_data.email,
            motDePasse=hash_password(admin_data.password),
            role=admin_data.role,
            is_active=True,
            created_by=created_by_admin_id,
        )

        self.db.add(new_admin)
        self.db.commit()
        self.db.refresh(new_admin)

        self.event_bus.publish(
            EventTypes.ADMIN_CREATED,
            {
                "admin_id": new_admin.id,
                "email": new_admin.email,
                "username": new_admin.nomUtilisateur,
                "role": str(new_admin.role),
                "created_by": created_by_admin_id,
            },
        )

        return AdminResponse.model_validate(new_admin), None

    def get_admin(self, admin_id: int) -> Optional[dict]:
        """Get admin by ID."""
        admin = (
            self.db.query(models.Administrateur)
            .filter(models.Administrateur.id == admin_id)
            .first()
        )

        if not admin:
            return None

        return {
            "id": admin.id,
            "email": admin.email,
            "nomUtilisateur": admin.nomUtilisateur,
            "role": admin.role,
            "is_active": admin.is_active,
            "created_at": admin.created_at.isoformat() if admin.created_at else None,
            "created_by": admin.created_by,
        }

    def list_admins(self, skip: int = 0, limit: int = 50) -> list:
        """List all admins with pagination."""
        admins = (
            self.db.query(models.Administrateur)
            .order_by(models.Administrateur.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return [
            {
                "id": a.id,
                "email": a.email,
                "nomUtilisateur": a.nomUtilisateur,
                "role": a.role,
                "is_active": a.is_active,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in admins
        ]

    def toggle_admin_active(self, admin_id: int, is_active: bool) -> Optional[str]:
        """Enable/disable admin account."""
        admin = (
            self.db.query(models.Administrateur)
            .filter(models.Administrateur.id == admin_id)
            .first()
        )

        if not admin:
            return "Admin not found"

        admin.is_active = is_active
        self.db.add(admin)
        self.db.commit()

        return None

    def change_admin_role(self, admin_id: int, new_role: str) -> Optional[str]:
        """Change admin's role."""
        if new_role not in {"admin", "super_admin"}:
            return "Invalid role. Must be 'admin' or 'super_admin'"

        admin = (
            self.db.query(models.Administrateur)
            .filter(models.Administrateur.id == admin_id)
            .first()
        )

        if not admin:
            return "Admin not found"

        admin.role = new_role
        self.db.add(admin)
        self.db.commit()

        return None

    def get_admin_count(self) -> int:
        """Get total count of admins."""
        return self.db.query(models.Administrateur).count()

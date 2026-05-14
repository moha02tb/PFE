"""Admin service - business logic for admin operations.

Extracted from routers/auth.py to enable testing, reuse, and cleaner separation of concerns.
Handles: admin creation, admin management, admin queries.
"""

from typing import Optional, Tuple

from sqlalchemy import text
from sqlalchemy.orm import Session

import models
from events import EventTypes, get_event_bus
from region_scope import normalize_region
from schemas import AdminCreate, AdminResponse, AssistantCreate, AssistantUpdate
from security import hash_password
from services.audit_service import AuditService


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

        role = str(admin_data.role).strip().lower()
        region_scope = normalize_region(admin_data.region_scope) if role == "assistant" else None
        if role == "assistant" and not region_scope:
            return None, "Assistant accounts must have a valid region scope"

        self._sync_admin_id_sequence_if_needed()

        # Create admin
        new_admin = models.Administrateur(
            nomUtilisateur=admin_data.nomUtilisateur,
            email=admin_data.email,
            motDePasse=hash_password(admin_data.password),
            role=role,
            region_scope=region_scope,
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
                "region_scope": new_admin.region_scope,
                "created_by": created_by_admin_id,
            },
        )
        self._log_admin_audit(
            action=models.AuditActionEnum.ADMIN_CREATED,
            actor_id=created_by_admin_id,
            entity_id=new_admin.id,
            details={
                "role": str(new_admin.role),
                "region_scope": new_admin.region_scope,
            },
        )

        return AdminResponse.model_validate(new_admin), None

    def create_assistant(
        self,
        assistant_data: AssistantCreate,
        created_by_admin_id: int,
    ) -> Tuple[Optional[AdminResponse], Optional[str]]:
        """Create a regional assistant account."""
        return self.create_admin(assistant_data, created_by_admin_id)

    def update_assistant(
        self,
        assistant_id: int,
        updates: AssistantUpdate,
        updated_by_admin_id: int,
    ) -> Tuple[Optional[dict], Optional[str]]:
        """Update assistant region, active state, or password."""
        assistant = (
            self.db.query(models.Administrateur)
            .filter(
                models.Administrateur.id == assistant_id,
                models.Administrateur.role == "assistant",
            )
            .first()
        )

        if not assistant:
            return None, "Assistant not found"

        changed_fields: list[str] = []

        if updates.region_scope is not None:
            region_scope = normalize_region(updates.region_scope)
            if not region_scope:
                return None, "Assistant accounts must have a valid region scope"
            assistant.region_scope = region_scope
            changed_fields.append("region_scope")

        if updates.is_active is not None:
            assistant.is_active = updates.is_active
            changed_fields.append("is_active")

        if updates.password:
            assistant.motDePasse = hash_password(updates.password)
            changed_fields.append("password")

        if not changed_fields:
            return self._admin_to_dict(assistant), None

        self.db.add(assistant)
        self.db.commit()
        self.db.refresh(assistant)

        self.event_bus.publish(
            EventTypes.ADMIN_UPDATED,
            {
                "admin_id": assistant.id,
                "role": "assistant",
                "region_scope": assistant.region_scope,
                "updated_by": updated_by_admin_id,
                "changed_fields": changed_fields,
            },
        )
        self._log_admin_audit(
            action=models.AuditActionEnum.ADMIN_UPDATED,
            actor_id=updated_by_admin_id,
            entity_id=assistant.id,
            details={
                "role": "assistant",
                "region_scope": assistant.region_scope,
                "is_active": assistant.is_active,
                "changed_fields": changed_fields,
            },
        )

        return self._admin_to_dict(assistant), None

    def delete_assistant(self, assistant_id: int, deleted_by_admin_id: int) -> Optional[str]:
        """Delete a regional assistant account (hard delete)."""
        assistant = (
            self.db.query(models.Administrateur)
            .filter(
                models.Administrateur.id == assistant_id,
                models.Administrateur.role == "assistant",
            )
            .first()
        )

        if not assistant:
            return "Assistant not found"

        # Log audit before deletion
        self._log_admin_audit(
            action=models.AuditActionEnum.ADMIN_DELETED,
            actor_id=deleted_by_admin_id,
            entity_id=assistant.id,
            details={
                "role": "assistant",
                "region_scope": assistant.region_scope,
                "username": assistant.nomUtilisateur,
                "email": assistant.email,
            },
        )

        # Publish event before deletion
        self.event_bus.publish(
            EventTypes.ADMIN_DELETED,
            {
                "admin_id": assistant.id,
                "role": "assistant",
                "region_scope": assistant.region_scope,
                "username": assistant.nomUtilisateur,
                "deleted_by": deleted_by_admin_id,
            },
        )

        self.db.delete(assistant)
        self.db.commit()

        return None

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
            "region_scope": admin.region_scope,
            "is_active": admin.is_active,
            "created_at": admin.created_at.isoformat() if admin.created_at else None,
            "created_by": admin.created_by,
            "last_login": admin.last_login.isoformat() if admin.last_login else None,
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

        return [self._admin_to_dict(a) for a in admins]

    def list_assistants(self, skip: int = 0, limit: int = 50) -> list:
        """List regional assistant accounts with pagination."""
        assistants = (
            self.db.query(models.Administrateur)
            .filter(models.Administrateur.role == "assistant")
            .order_by(models.Administrateur.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return [self._admin_to_dict(a) for a in assistants]

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
        admin.region_scope = None
        self.db.add(admin)
        self.db.commit()

        return None

    def get_admin_count(self) -> int:
        """Get total count of admins."""
        return self.db.query(models.Administrateur).count()

    def get_assistant_count(self) -> int:
        """Get total count of regional assistant accounts."""
        return (
            self.db.query(models.Administrateur)
            .filter(models.Administrateur.role == "assistant")
            .count()
        )

    def _admin_to_dict(self, admin: models.Administrateur) -> dict:
        return {
            "id": admin.id,
            "email": admin.email,
            "nomUtilisateur": admin.nomUtilisateur,
            "role": admin.role,
            "region_scope": admin.region_scope,
            "is_active": admin.is_active,
            "created_at": admin.created_at.isoformat() if admin.created_at else None,
            "created_by": admin.created_by,
            "last_login": admin.last_login.isoformat() if admin.last_login else None,
        }

    def _sync_admin_id_sequence_if_needed(self) -> None:
        bind = self.db.get_bind()
        if bind.dialect.name != "postgresql":
            return

        self.db.execute(
            text(
                """
                SELECT setval(
                    pg_get_serial_sequence('administrateurs', 'id'),
                    COALESCE((SELECT MAX(id) FROM administrateurs), 1),
                    (SELECT COUNT(*) FROM administrateurs) > 0
                )
                """
            )
        )

    def _log_admin_audit(
        self,
        action: models.AuditActionEnum,
        actor_id: int,
        entity_id: int,
        details: dict,
    ) -> None:
        AuditService(self.db).log_action(
            action=action,
            entity_type="administrateur",
            entity_id=entity_id,
            actor_id=actor_id,
            actor_type="administrateur",
            details=details,
            status="success",
        )

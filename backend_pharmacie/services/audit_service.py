"""Audit service - logging and audit trail management.

Handles: audit log creation, audit queries, activity tracking.
"""

import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

import models
from models import AuditActionEnum

logger = logging.getLogger(__name__)


class AuditService:
    """Encapsulates audit logging operations."""

    def __init__(self, db: Session):
        self.db = db

    def log_action(
        self,
        action: AuditActionEnum,
        actor_id: Optional[int],
        actor_type: Optional[str],
        entity_type: str,
        entity_id: int = 0,
        details: Optional[Dict[str, Any]] = None,
        status: str = "success",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> bool:
        """
        Log an audit action.
        
        Args:
            action: Type of action (enum)
            actor_id: ID of user performing action
            actor_type: Type of actor ('administrateur' or 'utilisateur')
            entity_type: Type of entity affected ('pharmacie', 'user', etc.)
            entity_id: ID of entity affected (0 for bulk/N/A)
            details: Additional context as dict (will be JSON serialized)
            status: 'success', 'failed', or 'warning'
            ip_address: Remote client IP address when available
            user_agent: Remote client user agent when available
            
        Returns: True on success, False on failure
        """
        try:
            audit_log = models.AuditLog(
                action=action,
                actor_id=actor_id,
                actor_type=actor_type,
                entity_type=entity_type,
                entity_id=entity_id,
                ip_address=ip_address,
                user_agent=user_agent[:255] if user_agent else None,
                details=json.dumps(details, default=str) if details else None,
                status=status,
            )
            self.db.add(audit_log)
            self.db.commit()
            return True
        except Exception:
            self.db.rollback()
            logger.exception(
                "Failed to write audit log action=%s actor_type=%s actor_id=%s "
                "entity_type=%s entity_id=%s",
                getattr(action, "value", action),
                actor_type,
                actor_id,
                entity_type,
                entity_id,
            )
            return False

    def get_user_actions(
        self,
        user_id: int,
        actor_type: str = "administrateur",
        limit: int = 100,
    ) -> list:
        """Get recent actions by a specific user."""
        try:
            logs = (
                self.db.query(models.AuditLog)
                .filter(
                    models.AuditLog.actor_id == user_id,
                    models.AuditLog.actor_type == actor_type,
                )
                .order_by(models.AuditLog.created_at.desc())
                .limit(limit)
                .all()
            )

            return [
                {
                    "id": log.id,
                    "action": log.action.value,
                    "entity_type": log.entity_type,
                    "entity_id": log.entity_id,
                    "status": log.status,
                    "created_at": log.created_at.isoformat(),
                    "details": json.loads(log.details) if log.details else None,
                }
                for log in logs
            ]
        except Exception:
            logger.exception(
                "Failed to fetch audit logs for actor_type=%s actor_id=%s",
                actor_type,
                user_id,
            )
            return []

    def get_entity_changes(
        self,
        entity_type: str,
        entity_id: int,
        limit: int = 50,
    ) -> list:
        """Get all changes to a specific entity."""
        try:
            logs = (
                self.db.query(models.AuditLog)
                .filter(
                    models.AuditLog.entity_type == entity_type,
                    models.AuditLog.entity_id == entity_id,
                )
                .order_by(models.AuditLog.created_at.desc())
                .limit(limit)
                .all()
            )

            return [
                {
                    "id": log.id,
                    "action": log.action.value,
                    "actor_id": log.actor_id,
                    "actor_type": log.actor_type,
                    "status": log.status,
                    "created_at": log.created_at.isoformat(),
                    "details": json.loads(log.details) if log.details else None,
                }
                for log in logs
            ]
        except Exception:
            logger.exception(
                "Failed to fetch audit logs for entity_type=%s entity_id=%s",
                entity_type,
                entity_id,
            )
            return []

    def get_recent_actions(self, limit: int = 100, days: int = 7) -> list:
        """Get recent actions across all users."""
        try:
            from datetime import timedelta

            cutoff = datetime.utcnow() - timedelta(days=days)
            logs = (
                self.db.query(models.AuditLog)
                .filter(models.AuditLog.created_at >= cutoff)
                .order_by(models.AuditLog.created_at.desc())
                .limit(limit)
                .all()
            )

            return [
                {
                    "id": log.id,
                    "action": log.action.value,
                    "actor_id": log.actor_id,
                    "actor_type": log.actor_type,
                    "entity_type": log.entity_type,
                    "status": log.status,
                    "created_at": log.created_at.isoformat(),
                }
                for log in logs
            ]
        except Exception:
            logger.exception("Failed to fetch recent audit logs")
            return []

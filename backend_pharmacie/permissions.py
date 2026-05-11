"""Role and permission helpers shared by backend dependencies."""

from __future__ import annotations


ADMIN_ROLES = {"admin", "super_admin"}
STAFF_ROLES = ADMIN_ROLES | {"assistant"}

ROLE_PERMISSIONS = {
    "assistant": {
        "pharmacies:read",
        "pharmacies:write:regional",
        "gardes:read",
        "gardes:write:regional",
        "uploads:pharmacies:regional",
        "uploads:gardes:regional",
        "regions:read",
    },
    "admin": {"*"},
    "super_admin": {"*"},
}


def role_value(role) -> str:
    """Return a normalized role string from an enum or raw role value."""
    return getattr(role, "value", str(role)).lower()


def has_role(role, allowed_roles: set[str]) -> bool:
    return role_value(role) in allowed_roles


def has_permission(role, permission: str) -> bool:
    permissions = ROLE_PERMISSIONS.get(role_value(role), set())
    return "*" in permissions or permission in permissions

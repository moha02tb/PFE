"""Event type constants used across backend services."""


class EventTypes:
    """Canonical event names for the internal event bus."""

    AUTH_LOGIN_SUCCESS = "auth.login.success"
    AUTH_LOGIN_FAILED = "auth.login.failed"
    AUTH_REGISTERED = "auth.user.registered"
    AUTH_PROFILE_UPDATED = "auth.profile.updated"
    AUTH_LOGOUT = "auth.logout"

    USER_CREATED_BY_ADMIN = "user.created.by_admin"
    ADMIN_CREATED = "admin.created"

    PHARMACY_BULK_UPLOAD_SUCCESS = "pharmacy.bulk_upload.success"
    PHARMACY_BULK_UPLOAD_FAILED = "pharmacy.bulk_upload.failed"

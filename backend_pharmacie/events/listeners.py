"""Default event listeners for backend observability and audit hooks."""

import logging

from .event_bus import Event, get_event_bus
from .event_types import EventTypes

logger = logging.getLogger("pharmacie.events")


def _log_event(event: Event) -> None:
    """Generic listener that logs all key business events."""
    logger.info("event=%s payload=%s emitted_at=%s", event.name, event.payload, event.emitted_at)


def register_default_listeners() -> None:
    """Register built-in listeners once at application startup."""
    bus = get_event_bus()

    bus.subscribe(EventTypes.AUTH_LOGIN_SUCCESS, _log_event)
    bus.subscribe(EventTypes.AUTH_LOGIN_FAILED, _log_event)
    bus.subscribe(EventTypes.AUTH_REGISTERED, _log_event)
    bus.subscribe(EventTypes.AUTH_PROFILE_UPDATED, _log_event)
    bus.subscribe(EventTypes.AUTH_LOGOUT, _log_event)
    bus.subscribe(EventTypes.USER_CREATED_BY_ADMIN, _log_event)
    bus.subscribe(EventTypes.ADMIN_CREATED, _log_event)
    bus.subscribe(EventTypes.PHARMACY_BULK_UPLOAD_SUCCESS, _log_event)
    bus.subscribe(EventTypes.PHARMACY_BULK_UPLOAD_FAILED, _log_event)

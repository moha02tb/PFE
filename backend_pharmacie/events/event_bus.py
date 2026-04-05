"""In-process event bus for decoupled backend side effects.

This foundation is synchronous and intentionally lightweight.
It can be replaced with an external broker in future phases.
"""

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List


EventHandler = Callable[["Event"], None]


@dataclass
class Event:
    """Structured event payload."""

    name: str
    payload: Dict[str, Any]
    emitted_at: str


class EventBus:
    """Simple pub/sub event bus."""

    def __init__(self):
        self._listeners: Dict[str, List[EventHandler]] = defaultdict(list)

    def subscribe(self, event_name: str, handler: EventHandler) -> None:
        """Register a handler for an event name."""
        self._listeners[event_name].append(handler)

    def publish(self, event_name: str, payload: Dict[str, Any]) -> None:
        """Emit an event to all registered handlers.

        Handler exceptions are isolated to prevent breaking core request flow.
        """
        event = Event(
            name=event_name,
            payload=payload,
            emitted_at=datetime.now(timezone.utc).isoformat(),
        )

        for handler in self._listeners.get(event_name, []):
            try:
                handler(event)
            except Exception:
                # Listener failures should never break application logic.
                continue


_event_bus: EventBus | None = None


def get_event_bus() -> EventBus:
    """Return a singleton event bus instance."""
    global _event_bus
    if _event_bus is None:
        _event_bus = EventBus()
    return _event_bus

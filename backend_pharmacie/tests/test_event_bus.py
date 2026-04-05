"""Unit tests for internal event bus foundation."""

from events import EventTypes
from events.event_bus import EventBus


def test_event_bus_publish_and_subscribe():
    """Registered listeners should receive emitted events."""
    bus = EventBus()
    received = []

    def handler(event):
        received.append(event)

    bus.subscribe(EventTypes.AUTH_LOGIN_SUCCESS, handler)
    bus.publish(EventTypes.AUTH_LOGIN_SUCCESS, {"user_id": 1})

    assert len(received) == 1
    assert received[0].name == EventTypes.AUTH_LOGIN_SUCCESS
    assert received[0].payload["user_id"] == 1


def test_event_bus_isolates_listener_errors():
    """A failing listener must not prevent healthy listeners from running."""
    bus = EventBus()
    called = {"ok": False}

    def bad_handler(_event):
        raise RuntimeError("boom")

    def ok_handler(_event):
        called["ok"] = True

    bus.subscribe(EventTypes.AUTH_LOGIN_SUCCESS, bad_handler)
    bus.subscribe(EventTypes.AUTH_LOGIN_SUCCESS, ok_handler)

    bus.publish(EventTypes.AUTH_LOGIN_SUCCESS, {"user_id": 2})

    assert called["ok"] is True

"""Tests for the admin garde schedule listing endpoint.

Focuses on the optional date_from/date_to range filtering used by the
calendar view, and verifies the default (unfiltered) behaviour is unchanged.
Also covers the Tunisian garde shift rules in ``garde_calendar``.
"""

from datetime import date

import models
from garde_calendar import get_required_garde_shifts, is_public_holiday


def _add_garde(db, garde_date: date, pharmacy_name: str, created_by: int):
    row = models.GardeSchedule(
        date=garde_date,
        pharmacy_name=pharmacy_name,
        start_time="20:00",
        end_time="08:00",
        created_by=created_by,
    )
    db.add(row)
    db.commit()
    return row


def test_get_gardes_filters_by_date_range(client, test_db, test_admin, admin_headers):
    # Two months of data: only May should match the May range.
    _add_garde(test_db, date(2026, 5, 1), "May Start Pharmacy", test_admin.id)
    _add_garde(test_db, date(2026, 5, 31), "May End Pharmacy", test_admin.id)
    _add_garde(test_db, date(2026, 8, 26), "August Pharmacy", test_admin.id)

    response = client.get(
        "/api/admin/gardes",
        params={"date_from": "2026-05-01", "date_to": "2026-05-31"},
        headers=admin_headers,
    )

    assert response.status_code == 200
    data = response.json()
    returned_dates = {row["date"] for row in data}

    # Gardes inside the range are returned.
    assert "2026-05-01" in returned_dates
    assert "2026-05-31" in returned_dates
    # Gardes outside the range are excluded.
    assert "2026-08-26" not in returned_dates
    assert len(data) == 2


def test_get_gardes_date_to_is_inclusive(client, test_db, test_admin, admin_headers):
    _add_garde(test_db, date(2026, 5, 15), "Boundary Pharmacy", test_admin.id)

    response = client.get(
        "/api/admin/gardes",
        params={"date_from": "2026-05-15", "date_to": "2026-05-15"},
        headers=admin_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["date"] == "2026-05-15"


def test_get_gardes_without_date_range_returns_all(client, test_db, test_admin, admin_headers):
    # Callers that omit the new params keep the previous behaviour.
    _add_garde(test_db, date(2026, 5, 10), "May Pharmacy", test_admin.id)
    _add_garde(test_db, date(2026, 8, 10), "August Pharmacy", test_admin.id)

    response = client.get("/api/admin/gardes", headers=admin_headers)

    assert response.status_code == 200
    data = response.json()
    returned_dates = {row["date"] for row in data}
    assert returned_dates == {"2026-05-10", "2026-08-10"}


# ---------------------------------------------------------------------------
# Tunisian garde shift rules (garde_calendar.get_required_garde_shifts)
# ---------------------------------------------------------------------------


def test_regular_weekday_has_no_garde():
    # 2026-02-10 is a Tuesday with no holiday: regular pharmacies are open,
    # so no garde is required.
    weekday = date(2026, 2, 10)
    assert weekday.weekday() == 1  # Tuesday
    assert not is_public_holiday(weekday)
    assert get_required_garde_shifts(weekday) == []


def test_weekend_days_have_both_shifts():
    # Saturday and Sunday both require JOUR and NUIT cover.
    saturday = date(2026, 2, 7)
    sunday = date(2026, 2, 8)
    assert saturday.weekday() == 5
    assert sunday.weekday() == 6
    assert get_required_garde_shifts(saturday) == ["JOUR", "NUIT"]
    assert get_required_garde_shifts(sunday) == ["JOUR", "NUIT"]


def test_fixed_holiday_on_weekday_has_both_shifts():
    # Fixed-date national holidays from the holidays library force a garde
    # even when they fall on a regular (Mon-Fri) weekday.
    independence_day = date(2026, 3, 20)   # Fête de l'Indépendance (Friday)
    revolution_day = date(2026, 1, 14)     # Fête de la Révolution (Wednesday)

    for holiday in (independence_day, revolution_day):
        assert holiday.weekday() < 5, "should be testing a Mon-Fri weekday"
        assert is_public_holiday(holiday)
        assert get_required_garde_shifts(holiday) == ["JOUR", "NUIT"]


def test_manual_islamic_holiday_on_weekday_has_both_shifts():
    # Aïd al-Adha 2026 is supplied via the manual override dict (the library
    # only estimates it). It must force a garde on its weekday.
    eid_al_adha = date(2026, 5, 27)        # Wednesday
    assert eid_al_adha.weekday() < 5
    assert is_public_holiday(eid_al_adha)
    assert get_required_garde_shifts(eid_al_adha) == ["JOUR", "NUIT"]

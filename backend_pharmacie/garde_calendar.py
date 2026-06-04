"""Tunisian garde (on-call pharmacy) calendar rules.

A *pharmacie de garde* only covers the days when regular pharmacies are
closed — weekends and public holidays:

* Regular weekdays (Monday–Friday): **no garde**. Regular pharmacies are
  open, so there is neither a JOUR nor a NUIT garde.
* Weekend days (Saturday & Sunday): both **JOUR** (08:00–20:00) and
  **NUIT** (20:00–08:00) garde shifts.
* Public holidays (*jours fériés*): treated exactly like weekends — both
  shifts — even when they fall on a weekday.

To include only Sunday in the weekend (and keep Saturday a working day),
remove ``5`` from :data:`WEEKEND_DAYS`.

Fixed-date (Gregorian) public holidays come from the ``holidays`` library
(``holidays.Tunisia``). That library is unreliable for the lunar/variable
Islamic holidays (Aïd al-Fitr, Aïd al-Adha, Mouled, Nouvel An hégirien): it
only *estimates* them. We therefore ignore the library's estimated entries
and supply the observed Islamic dates through :data:`MANUAL_ISLAMIC_HOLIDAYS`,
which should be reviewed and updated once a year.
"""

from __future__ import annotations

from datetime import date
from functools import lru_cache

try:  # holidays is a hard runtime dependency; guarded so imports never explode.
    import holidays as _holidays
except ImportError:  # pragma: no cover - exercised only when the dep is missing
    _holidays = None

JOUR = "JOUR"
NUIT = "NUIT"

# Canonical garde shift hours.
SHIFT_HOURS: dict[str, tuple[str, str]] = {
    JOUR: ("08:00", "20:00"),
    NUIT: ("20:00", "08:00"),
}

# Weekday numbers (date.weekday(): Monday == 0 ... Sunday == 6) that count as
# the weekend. Saturday (5) and Sunday (6) by default.
WEEKEND_DAYS: frozenset[int] = frozenset({5, 6})

# Observed Gregorian dates of the lunar/variable Islamic public holidays.
# The ``holidays`` library only estimates these, so they are maintained by
# hand. Update once a year with the dates announced by the Tunisian
# authorities (les dates sont fixées par les autorités tunisiennes).
MANUAL_ISLAMIC_HOLIDAYS: dict[int, dict[date, str]] = {
    2025: {
        date(2025, 3, 31): "Aïd al-Fitr",
        date(2025, 4, 1): "Aïd al-Fitr (2e jour)",
        date(2025, 6, 6): "Aïd al-Adha",
        date(2025, 6, 7): "Aïd al-Adha (2e jour)",
        date(2025, 6, 26): "Nouvel An hégirien",
        date(2025, 9, 4): "Mouled",
    },
    2026: {
        date(2026, 3, 20): "Aïd al-Fitr",
        date(2026, 3, 21): "Aïd al-Fitr (2e jour)",
        date(2026, 5, 27): "Aïd al-Adha",
        date(2026, 5, 28): "Aïd al-Adha (2e jour)",
        date(2026, 6, 16): "Nouvel An hégirien",
        date(2026, 8, 25): "Mouled",
    },
}


@lru_cache(maxsize=None)
def _fixed_holidays(year: int):
    """Return a (date -> True) view of the *fixed-date* Tunisian holidays.

    The ``holidays`` library tags its estimated lunar dates with an
    ``estimated_label`` (e.g. ``"%s (تقديري)"``). A calendar date can carry
    several holidays joined by ``"; "`` (for example Independence Day and an
    estimated Aïd al-Fitr on the same day); we keep the date only when at
    least one of its holidays is *not* estimated, so the unreliable lunar
    estimates are discarded while genuine fixed holidays are kept.
    """
    if _holidays is None:
        return {}

    country = _holidays.Tunisia(years=year)
    marker = (country.estimated_label % "").strip()
    fixed: dict[date, bool] = {}
    for day, name in country.items():
        if any(marker not in part for part in name.split("; ")):
            fixed[day] = True
    return fixed


def is_public_holiday(target: date) -> bool:
    """True if ``target`` is a Tunisian public holiday (fixed or Islamic)."""
    if target in MANUAL_ISLAMIC_HOLIDAYS.get(target.year, {}):
        return True
    return target in _fixed_holidays(target.year)


def get_required_garde_shifts(target: date) -> list[str]:
    """Return the garde shift types that must exist on ``target``.

    Weekend days and public holidays require both JOUR and NUIT cover; on
    regular weekdays no garde is needed, since regular pharmacies are open.
    """
    if target.weekday() in WEEKEND_DAYS or is_public_holiday(target):
        return [JOUR, NUIT]
    return []

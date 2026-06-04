"""Delete JOUR garde rows that the old (incorrect) logic created.

The previous rotation produced a JOUR (08:00-20:00) garde on *every* day.
Under the corrected Tunisian rules a JOUR garde only exists on Sundays and
public holidays (see ``garde_calendar.get_required_garde_shifts``). This
script removes the now-invalid JOUR rows so existing data matches the rules.

A row is removed only when ALL of the following hold:
  * its shift is JOUR (shift_type contains "jour"/"day", or start_time 08:00),
  * its date does NOT require a JOUR shift (i.e. not a Sunday/holiday).

By default the cleanup is scoped to auto-generated rows (notes contain
"Auto-généré") so manual uploads are left untouched; pass ``--all-sources``
to widen it.

Usage:
    python scripts/cleanup_invalid_jour_gardes.py            # dry-run
    python scripts/cleanup_invalid_jour_gardes.py --apply    # delete
    python scripts/cleanup_invalid_jour_gardes.py --apply --all-sources
"""

from __future__ import annotations

import argparse
import os
import sys

# Allow running as `python scripts/cleanup_invalid_jour_gardes.py`.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import models  # noqa: E402
from database import SessionLocal  # noqa: E402
from garde_calendar import JOUR, get_required_garde_shifts  # noqa: E402

AUTO_NOTE_FRAGMENT = "Auto-généré"


def _is_jour_row(row: models.GardeSchedule) -> bool:
    shift = (row.shift_type or "").strip().lower()
    if "jour" in shift or "day" in shift:
        return True
    # Fall back to the canonical JOUR start time when shift_type is blank.
    if not shift and (row.start_time or "").strip() == "08:00":
        return True
    return False


def cleanup(db, *, apply: bool, all_sources: bool) -> dict:
    query = db.query(models.GardeSchedule)
    if not all_sources:
        query = query.filter(models.GardeSchedule.notes.like(f"%{AUTO_NOTE_FRAGMENT}%"))

    examined = 0
    to_delete = []
    for row in query.all():
        examined += 1
        if not _is_jour_row(row):
            continue
        if JOUR in get_required_garde_shifts(row.date):
            continue  # legitimately a Sunday/holiday JOUR
        to_delete.append(row)

    if apply:
        for row in to_delete:
            db.delete(row)
        db.commit()

    return {
        "examined": examined,
        "deleted" if apply else "would_delete": len(to_delete),
        "scope": "all sources" if all_sources else "auto-generated only",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Actually delete (default is dry-run)")
    parser.add_argument(
        "--all-sources",
        action="store_true",
        help="Also consider manually-uploaded rows (default: auto-generated only)",
    )
    args = parser.parse_args()

    db = SessionLocal()
    try:
        report = cleanup(db, apply=args.apply, all_sources=args.all_sources)
    finally:
        db.close()

    if not args.apply:
        print("[dry-run] No rows deleted. Re-run with --apply to delete.")
    for key, value in report.items():
        print(f"{key.replace('_', ' ').title():<16}: {value}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

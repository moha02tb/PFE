"""Generate 90 days of rotating garde schedules from existing pharmacies.

Usage:
    python scripts/generate_garde.py [--days N] [--admin-id ID] [--dry-run]

For each governorate, the script rotates regular pharmacies (Pharmacies de
Nuit are excluded) as garde duty. Each garde-day produces two shifts:
JOUR (08:00-20:00) and NUIT (20:00-08:00). The pharmacy on duty is the
same for both shifts.

Pharmacies with a phone AND a complete address are prioritized in the
rotation (they appear first in the cycle).

Holidays and Ramadan dates are flagged in the notes field — the rotation
itself is not skipped, but the entry carries a warning for end-users.

A (date, governorate, shift_type) tuple that already exists is skipped
so the script is safe to re-run.
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import date, datetime, timedelta, timezone
from collections import defaultdict

# Allow running as `python scripts/generate_garde.py` from backend_pharmacie/
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from sqlalchemy import func  # noqa: E402

import models  # noqa: E402
from database import SessionLocal  # noqa: E402


TUNISIA_TZ = timezone(timedelta(hours=1))

JOUR_START = "08:00"
JOUR_END = "20:00"
NUIT_START = "20:00"
NUIT_END = "08:00"

NIGHT_KEYWORDS_LATIN = ("nuit", "night")
NIGHT_KEYWORD_AR = "الليل"

AUTO_NOTE = "Auto-généré - rotation système"
HOLIDAY_NOTE = "Jour Férié - Vérifier auprès du Conseil de l'Ordre"
RAMADAN_NOTE = "Ramadan - Horaires peuvent varier"

# Fixed Tunisian public holidays + observed Islamic dates spanning 2025-2026.
# Movable Islamic dates are approximations and should be reviewed yearly.
PUBLIC_HOLIDAYS: set[date] = {
    # 2025
    date(2025, 1, 1),    # Jour de l'An
    date(2025, 1, 14),   # Fête de la Révolution
    date(2025, 3, 20),   # Fête de l'Indépendance
    date(2025, 3, 31),   # Aïd al-Fitr (approx)
    date(2025, 4, 1),    # Aïd al-Fitr (J2)
    date(2025, 4, 9),    # Fête des Martyrs
    date(2025, 5, 1),    # Fête du Travail
    date(2025, 6, 6),    # Aïd al-Adha (approx)
    date(2025, 6, 7),    # Aïd al-Adha (J2)
    date(2025, 6, 26),   # Nouvel An hégirien (approx)
    date(2025, 7, 25),   # Fête de la République
    date(2025, 8, 13),   # Fête de la Femme
    date(2025, 9, 4),    # Mouled (approx)
    date(2025, 10, 15),  # spec-provided
    date(2025, 11, 7),   # spec-provided
    date(2025, 12, 8),   # spec-provided
    # 2026
    date(2026, 1, 1),
    date(2026, 1, 14),
    date(2026, 3, 20),
    date(2026, 3, 20),   # Aïd al-Fitr (approx end of Ramadan 2026)
    date(2026, 3, 21),
    date(2026, 4, 9),
    date(2026, 5, 1),
    date(2026, 5, 27),   # Aïd al-Adha (approx)
    date(2026, 5, 28),
    date(2026, 6, 16),   # Nouvel An hégirien (approx)
    date(2026, 7, 25),
    date(2026, 8, 13),
    date(2026, 8, 25),   # Mouled (approx)
}

# Ramadan 2026 (approximate Gregorian dates).
RAMADAN_RANGES: list[tuple[date, date]] = [
    (date(2026, 2, 17), date(2026, 3, 19)),
    (date(2025, 2, 28), date(2025, 3, 30)),
]


def is_night_pharmacy(name: str | None) -> bool:
    if not name:
        return False
    name_lower = name.lower()
    if NIGHT_KEYWORD_AR in name:
        return True
    return any(keyword in name_lower for keyword in NIGHT_KEYWORDS_LATIN)


def in_ramadan(target: date) -> bool:
    return any(start <= target <= end for start, end in RAMADAN_RANGES)


def build_notes(target: date) -> str:
    parts = [AUTO_NOTE]
    if target in PUBLIC_HOLIDAYS:
        parts.append(HOLIDAY_NOTE)
    if in_ramadan(target):
        parts.append(RAMADAN_NOTE)
    return " | ".join(parts)


def load_pharmacies_by_governorate(db) -> dict[str, list[models.Pharmacie]]:
    """Return regular (non-nuit) pharmacies grouped by governorate.

    Within each governorate the list is sorted to prioritize pharmacies
    with a phone AND complete address, then by id for deterministic order.
    """
    rows = (
        db.query(models.Pharmacie)
        .filter(models.Pharmacie.governorate.isnot(None))
        .filter(models.Pharmacie.governorate != "")
        .all()
    )

    grouped: dict[str, list[models.Pharmacie]] = defaultdict(list)
    for row in rows:
        if is_night_pharmacy(row.name):
            continue
        grouped[row.governorate].append(row)

    def sort_key(p: models.Pharmacie):
        # False sorts before True, so use NOT-present flags to push incomplete rows down.
        return (
            p.phone is None or not p.phone.strip(),
            p.address is None or not p.address.strip(),
            p.id,
        )

    for governorate in grouped:
        grouped[governorate].sort(key=sort_key)

    return grouped


def existing_slot_keys(db, start_date: date, end_date: date) -> set[tuple[date, str, str]]:
    """Pre-load existing (date, governorate, shift_type) keys to avoid N+1 queries."""
    rows = (
        db.query(
            models.GardeSchedule.date,
            models.GardeSchedule.governorate,
            models.GardeSchedule.shift_type,
        )
        .filter(models.GardeSchedule.date >= start_date)
        .filter(models.GardeSchedule.date <= end_date)
        .all()
    )
    return {(r[0], (r[1] or "").strip(), (r[2] or "").strip().lower()) for r in rows}


def generate(db, *, days: int, admin_id: int, dry_run: bool) -> dict:
    today = datetime.now(TUNISIA_TZ).date()
    end_date = today + timedelta(days=days - 1)

    pharmacies_by_gov = load_pharmacies_by_governorate(db)
    existing = existing_slot_keys(db, today, end_date)

    created = 0
    skipped = 0
    ramadan_dates = set()
    holiday_dates = set()
    pharmacies_used: set[tuple[str, int]] = set()

    SHIFTS = (
        ("jour", JOUR_START, JOUR_END),
        ("nuit", NUIT_START, NUIT_END),
    )

    for offset in range(days):
        target_date = today + timedelta(days=offset)
        notes = build_notes(target_date)
        if target_date in PUBLIC_HOLIDAYS:
            holiday_dates.add(target_date)
        if in_ramadan(target_date):
            ramadan_dates.add(target_date)

        for governorate, pharmacies in pharmacies_by_gov.items():
            if not pharmacies:
                continue
            pharmacy = pharmacies[offset % len(pharmacies)]
            pharmacies_used.add((governorate, pharmacy.id))

            for shift_type, start_time, end_time in SHIFTS:
                key = (target_date, governorate.strip(), shift_type)
                if key in existing:
                    skipped += 1
                    continue

                entry = models.GardeSchedule(
                    date=target_date,
                    pharmacy_name=pharmacy.name,
                    city=pharmacy.governorate,  # no city column on Pharmacie
                    governorate=pharmacy.governorate,
                    start_time=start_time,
                    end_time=end_time,
                    shift_type=shift_type,
                    notes=notes,
                    created_by=admin_id,
                )
                if not dry_run:
                    db.add(entry)
                existing.add(key)
                created += 1

    if not dry_run:
        db.commit()

    return {
        "governorates_with_pharmacies": len(pharmacies_by_gov),
        "days": days,
        "created": created,
        "skipped": skipped,
        "pharmacies_used": len({pid for _, pid in pharmacies_used}),
        "holiday_dates_flagged": len(holiday_dates),
        "ramadan_dates_flagged": len(ramadan_dates),
        "start_date": today,
        "end_date": end_date,
    }


def print_summary_table(report: dict) -> None:
    rows = [
        ("Governorates covered", f"{report['governorates_with_pharmacies']}/24"),
        ("Days generated", str(report["days"])),
        ("Date range", f"{report['start_date']} -> {report['end_date']}"),
        ("Total garde entries created", str(report["created"])),
        ("Pharmacies used in rotation", str(report["pharmacies_used"])),
        ("Skipped (already existed)", str(report["skipped"])),
        ("Flagged Ramadan dates", str(report["ramadan_dates_flagged"])),
        ("Flagged holiday dates", str(report["holiday_dates_flagged"])),
    ]
    label_width = max(len(r[0]) for r in rows)
    value_width = max(len(r[1]) for r in rows)
    bar = "+" + "-" * (label_width + 2) + "+" + "-" * (value_width + 2) + "+"
    print(bar)
    print(f"| {'Metric'.ljust(label_width)} | {'Value'.ljust(value_width)} |")
    print(bar)
    for label, value in rows:
        print(f"| {label.ljust(label_width)} | {value.ljust(value_width)} |")
    print(bar)


def print_per_governorate(db) -> None:
    rows = (
        db.query(
            models.GardeSchedule.governorate,
            func.count(models.GardeSchedule.id).label("shifts"),
            func.count(func.distinct(models.GardeSchedule.pharmacy_name)).label("pharmacies"),
            func.min(models.GardeSchedule.date).label("from_date"),
            func.max(models.GardeSchedule.date).label("to_date"),
        )
        .filter(models.GardeSchedule.notes.like("%Auto-généré%"))
        .group_by(models.GardeSchedule.governorate)
        .order_by(models.GardeSchedule.governorate)
        .all()
    )
    if not rows:
        print("\n(no auto-generated garde rows present)")
        return

    print()
    print(f"{'Governorate':<20} {'Shifts':>7} {'Pharmacies':>12} {'From':>12} {'To':>12}")
    print("-" * 70)
    for gov, shifts, pharmacies, frm, to in rows:
        print(f"{(gov or '(NULL)'):<20} {shifts:>7} {pharmacies:>12} {str(frm):>12} {str(to):>12}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--days", type=int, default=90, help="Rotation window length (default 90)")
    parser.add_argument("--admin-id", type=int, default=1, help="Admin id to attribute as created_by")
    parser.add_argument("--dry-run", action="store_true", help="Compute counts without writing")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        admin = db.query(models.Administrateur).filter(models.Administrateur.id == args.admin_id).first()
        if not admin:
            fallback = db.query(models.Administrateur).order_by(models.Administrateur.id).first()
            if not fallback:
                print("ERROR: no administrators found — cannot attribute created_by.", file=sys.stderr)
                return 1
            print(f"WARN: admin id {args.admin_id} not found; falling back to id={fallback.id} ({fallback.nomUtilisateur})")
            args.admin_id = fallback.id

        report = generate(db, days=args.days, admin_id=args.admin_id, dry_run=args.dry_run)

        if args.dry_run:
            print("[dry-run] No rows written.")
        print_summary_table(report)
        if not args.dry_run:
            print_per_governorate(db)
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())

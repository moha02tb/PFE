"""Fill pharmacies.governorate offline from (latitude, longitude).

Uses a hardcoded bounding-box map of Tunisia's 24 governorates. For each
pharmacy with a NULL/empty governorate, finds the matching bbox; on multiple
matches picks the one whose centre is closest to the pharmacy.
"""

from __future__ import annotations

import math
import os
import sys
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

GOVERNORATE_BOUNDS: dict[str, dict[str, tuple[float, float]]] = {
    "Tunis":       {"lat": (36.72, 36.95), "lng": (10.08, 10.35)},
    "Ariana":      {"lat": (36.82, 37.05), "lng": (10.10, 10.35)},
    "Ben Arous":   {"lat": (36.65, 36.82), "lng": (10.15, 10.50)},
    "Manouba":     {"lat": (36.72, 36.95), "lng": (9.90, 10.15)},
    "Nabeul":      {"lat": (36.15, 36.90), "lng": (10.30, 11.20)},
    "Zaghouan":    {"lat": (35.85, 36.60), "lng": (9.85, 10.40)},
    "Bizerte":     {"lat": (36.85, 37.55), "lng": (9.20, 10.20)},
    "Beja":        {"lat": (36.45, 37.15), "lng": (8.55, 9.55)},
    "Jendouba":    {"lat": (36.35, 37.25), "lng": (8.15, 9.15)},
    "Kef":         {"lat": (35.75, 36.65), "lng": (8.25, 9.15)},
    "Siliana":     {"lat": (35.80, 36.40), "lng": (9.10, 9.90)},
    "Sousse":      {"lat": (35.60, 36.25), "lng": (10.25, 10.80)},
    "Monastir":    {"lat": (35.45, 35.85), "lng": (10.55, 11.05)},
    "Mahdia":      {"lat": (35.05, 35.75), "lng": (10.55, 11.20)},
    "Sfax":        {"lat": (34.35, 35.30), "lng": (10.15, 11.15)},
    "Kairouan":    {"lat": (35.25, 36.10), "lng": (9.50, 10.45)},
    "Kasserine":   {"lat": (34.80, 35.80), "lng": (8.20, 9.30)},
    "Sidi Bouzid": {"lat": (34.50, 35.40), "lng": (9.10, 10.10)},
    "Gabes":       {"lat": (33.60, 34.50), "lng": (9.60, 10.40)},
    "Medenine":    {"lat": (32.80, 33.80), "lng": (10.10, 11.60)},
    "Tataouine":   {"lat": (30.80, 33.10), "lng": (9.00, 11.00)},
    "Gafsa":       {"lat": (34.00, 34.90), "lng": (8.10, 9.40)},
    "Tozeur":      {"lat": (33.60, 34.20), "lng": (7.80, 9.00)},
    "Kebili":      {"lat": (32.80, 34.00), "lng": (8.40, 10.00)},
}


def bbox_center(bounds: dict[str, tuple[float, float]]) -> tuple[float, float]:
    lat = (bounds["lat"][0] + bounds["lat"][1]) / 2
    lng = (bounds["lng"][0] + bounds["lng"][1]) / 2
    return lat, lng


def match_governorate(lat: float, lng: float) -> str | None:
    candidates: list[tuple[str, float]] = []
    for name, bounds in GOVERNORATE_BOUNDS.items():
        lat_lo, lat_hi = bounds["lat"]
        lng_lo, lng_hi = bounds["lng"]
        if lat_lo <= lat <= lat_hi and lng_lo <= lng <= lng_hi:
            clat, clng = bbox_center(bounds)
            dist = math.hypot(lat - clat, lng - clng)
            candidates.append((name, dist))
    if not candidates:
        return None
    candidates.sort(key=lambda x: x[1])
    return candidates[0][0]


def main() -> int:
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        print("DATABASE_URL not set", file=sys.stderr)
        return 1

    conn = psycopg2.connect(dsn)
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, latitude, longitude
                FROM pharmacies
                WHERE governorate IS NULL OR governorate = ''
                ORDER BY id
                """
            )
            rows = cur.fetchall()

        print(f"[fill_governorates] rows to process: {len(rows)}")

        updated = 0
        unmatched: list[tuple[int, float, float]] = []
        with conn.cursor() as cur:
            for idx, (pid, lat, lng) in enumerate(rows, start=1):
                gov = match_governorate(float(lat), float(lng))
                if gov is None:
                    unmatched.append((pid, float(lat), float(lng)))
                else:
                    cur.execute(
                        "UPDATE pharmacies SET governorate = %s WHERE id = %s "
                        "AND (governorate IS NULL OR governorate = '')",
                        (gov, pid),
                    )
                    updated += 1
                if idx % 50 == 0:
                    print(f"  processed {idx}/{len(rows)} (updated={updated}, unmatched={len(unmatched)})")
        conn.commit()

        print("\n=== fill_governorates report ===")
        print(f"updated      : {updated}")
        print(f"still NULL   : {len(unmatched)}")
        if unmatched:
            print("unmatched rows (id, lat, lng):")
            for pid, lat, lng in unmatched:
                print(f"  {pid}\t{lat}\t{lng}")
        return 0
    except Exception as exc:
        conn.rollback()
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())

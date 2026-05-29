"""Fill pharmacies.address / phone via Nominatim reverse geocoding.

For every pharmacy with NULL/empty address, call Nominatim reverse with
(latitude, longitude), build the best available address string from the
returned `address` block (priority order below), and also opportunistically
populate `phone` from `extratags` when present.

Respects Nominatim's 1 req/s policy with a 1.1 s sleep between calls.
"""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

import psycopg2
import requests
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
SLEEP_S = 1.1
HTTP_TIMEOUT_S = 30
USER_AGENT = "PharmaciConnect-PFE/1.0 (mohamed.teyeb@isimg.tn)"


def build_address(addr: dict) -> str | None:
    if not addr:
        return None
    road = addr.get("road")
    house = addr.get("house_number")
    suburb = addr.get("suburb") or addr.get("neighbourhood") or addr.get("village")
    city = (
        addr.get("city")
        or addr.get("town")
        or addr.get("municipality")
        or addr.get("county")
    )
    state = addr.get("state")

    if road and house and suburb and city:
        return f"{house} {road}, {suburb}, {city}"
    if road and house and city:
        return f"{house} {road}, {city}"
    if road and suburb and city:
        return f"{road}, {suburb}, {city}"
    if road and city:
        return f"{road}, {city}"
    if suburb and city:
        return f"{suburb}, {city}"
    if city and state:
        return f"{city}, {state}"
    if city:
        return city
    return None


def pick_phone(extratags: dict | None) -> str | None:
    if not extratags:
        return None
    for key in ("phone", "contact:phone", "contact:mobile"):
        val = extratags.get(key)
        if val:
            return val.strip() or None
    return None


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
                SELECT id, latitude, longitude, address, phone
                FROM pharmacies
                WHERE (address IS NULL OR address = '')
                ORDER BY id
                """
            )
            rows = cur.fetchall()

        total = len(rows)
        print(f"[reverse_geocode] rows needing address: {total}")

        addr_filled = 0
        phone_filled = 0
        errors = 0
        session = requests.Session()
        session.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "fr,ar,en"})

        with conn.cursor() as cur:
            for idx, (pid, lat, lng, cur_addr, cur_phone) in enumerate(rows, start=1):
                if cur_addr:
                    continue
                params = {
                    "lat": float(lat),
                    "lon": float(lng),
                    "format": "json",
                    "zoom": 18,
                    "addressdetails": 1,
                    "extratags": 1,
                }
                try:
                    resp = session.get(NOMINATIM_URL, params=params, timeout=HTTP_TIMEOUT_S)
                    resp.raise_for_status()
                    data = resp.json()
                except Exception as exc:
                    errors += 1
                    print(f"  id={pid}: HTTP error {exc}")
                    time.sleep(SLEEP_S)
                    continue

                new_address = build_address(data.get("address") or {})
                new_phone = pick_phone(data.get("extratags") or {}) if not cur_phone else None

                if new_address:
                    cur.execute(
                        "UPDATE pharmacies SET address = %s WHERE id = %s "
                        "AND (address IS NULL OR address = '')",
                        (new_address, pid),
                    )
                    if cur.rowcount:
                        addr_filled += 1
                if new_phone:
                    cur.execute(
                        "UPDATE pharmacies SET phone = %s WHERE id = %s "
                        "AND (phone IS NULL OR phone = '')",
                        (new_phone, pid),
                    )
                    if cur.rowcount:
                        phone_filled += 1

                if idx % 25 == 0:
                    conn.commit()
                    print(
                        f"  processed {idx}/{total} "
                        f"addr_filled={addr_filled} phone_filled={phone_filled} errors={errors}"
                    )
                time.sleep(SLEEP_S)

        conn.commit()

        print("\n=== reverse_geocode_addresses report ===")
        print(f"address filled            : {addr_filled}/{total}")
        print(f"phone filled (extratags)  : {phone_filled}")
        print(f"errors / skipped          : {errors}")
        return 0
    except Exception as exc:
        conn.rollback()
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())

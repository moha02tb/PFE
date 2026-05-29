"""Export all pharmacies with a missing phone to a CSV for manual follow-up.

The output file is intended to be shared with the Conseil de l'Ordre des
Pharmaciens or filled by the admin through the admin dashboard.
"""

from __future__ import annotations

import csv
import os
import sys
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

OUTPUT_PATH = BASE_DIR / "data" / "missing_phones.csv"
HEADERS = ["id", "name", "address", "governorate", "latitude", "longitude"]


def main() -> int:
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        print("DATABASE_URL not set", file=sys.stderr)
        return 1

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, name, address, governorate, latitude, longitude
                FROM pharmacies
                WHERE phone IS NULL OR phone = ''
                ORDER BY governorate, name
                """
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    with OUTPUT_PATH.open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(HEADERS)
        writer.writerows(rows)

    print(f"[export_missing_phones] wrote {len(rows)} rows -> {OUTPUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

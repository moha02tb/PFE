"""Fill pharmacies.address / phone from OSM Overpass tags.

For every row where address or phone is NULL, query Overpass by (osm_type, osm_id)
in batches of 10 and update only the columns that are currently NULL.
"""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path
from typing import Iterable

import psycopg2
import requests
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
BATCH_SIZE = 10
SLEEP_BETWEEN_BATCHES_S = 4.0
HTTP_TIMEOUT_S = 120


def chunked(seq: list, n: int) -> Iterable[list]:
    for i in range(0, len(seq), n):
        yield seq[i : i + n]


def build_query(batch: list[tuple[str, int]]) -> str:
    members = []
    for osm_type, osm_id in batch:
        t = osm_type.strip().lower() if osm_type else "node"
        if t not in {"node", "way", "relation"}:
            t = "node"
        members.append(f"{t}({osm_id});")
    return f"[out:json][timeout:60];({''.join(members)});out tags;"


def pick_address(tags: dict) -> str | None:
    if not tags:
        return None
    full = tags.get("addr:full")
    if full:
        return full.strip() or None
    street = tags.get("addr:street") or ""
    house = tags.get("addr:housenumber") or ""
    city = tags.get("addr:city") or ""
    parts = [p for p in [house, street, city] if p]
    if parts:
        return " ".join(parts).strip()
    return None


def pick_phone(tags: dict) -> str | None:
    if not tags:
        return None
    for key in ("phone", "contact:phone", "contact:mobile"):
        val = tags.get(key)
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
                SELECT id, osm_type, osm_id, address, phone
                FROM pharmacies
                WHERE osm_id IS NOT NULL
                  AND ((address IS NULL OR address = '') OR (phone IS NULL OR phone = ''))
                ORDER BY id
                """
            )
            rows = cur.fetchall()

        print(f"[fill_from_osm] rows needing address or phone: {len(rows)}")
        target_address = sum(1 for r in rows if not r[3])
        target_phone = sum(1 for r in rows if not r[4])
        print(f"  -> need address: {target_address}")
        print(f"  -> need phone  : {target_phone}")

        by_osmid: dict[int, dict] = {r[2]: {"id": r[0], "address": r[3], "phone": r[4]} for r in rows}
        batches = list(chunked([(r[1], r[2]) for r in rows], BATCH_SIZE))
        print(f"  -> batches of {BATCH_SIZE}: {len(batches)}")

        addr_filled = 0
        phone_filled = 0
        still_missing: list[tuple[int, int]] = []  # (db_id, osm_id)
        processed_osmids: set[int] = set()
        http_errors = 0

        with conn.cursor() as cur:
            for batch_idx, batch in enumerate(batches, start=1):
                q = build_query(batch)
                try:
                    resp = requests.post(
                        OVERPASS_URL,
                        data={"data": q},
                        timeout=HTTP_TIMEOUT_S,
                        headers={"User-Agent": "pfe-pharmacie-fill/1.0 (mohamed.teyeb@isimg.tn)"},
                    )
                    resp.raise_for_status()
                    payload = resp.json()
                except Exception as exc:
                    http_errors += 1
                    print(f"  batch {batch_idx}: HTTP error {exc} (retry in 20s)")
                    time.sleep(20)
                    try:
                        resp = requests.post(
                            OVERPASS_URL,
                            data={"data": q},
                            timeout=HTTP_TIMEOUT_S,
                            headers={"User-Agent": "pfe-pharmacie-fill/1.0 (mohamed.teyeb@isimg.tn)"},
                        )
                        resp.raise_for_status()
                        payload = resp.json()
                    except Exception as exc2:
                        http_errors += 1
                        print(f"  batch {batch_idx}: retry failed {exc2}")
                        time.sleep(10)
                        continue

                elements = payload.get("elements", []) or []
                tags_by_id = {el.get("id"): (el.get("tags") or {}) for el in elements}

                for osm_type, osm_id in batch:
                    processed_osmids.add(osm_id)
                    rec = by_osmid.get(osm_id)
                    if not rec:
                        continue
                    tags = tags_by_id.get(osm_id) or {}
                    new_address = pick_address(tags) if not rec["address"] else None
                    new_phone = pick_phone(tags) if not rec["phone"] else None
                    if new_address:
                        cur.execute(
                            "UPDATE pharmacies SET address = %s WHERE id = %s "
                            "AND (address IS NULL OR address = '')",
                            (new_address, rec["id"]),
                        )
                        if cur.rowcount:
                            addr_filled += 1
                            rec["address"] = new_address
                    if new_phone:
                        cur.execute(
                            "UPDATE pharmacies SET phone = %s WHERE id = %s "
                            "AND (phone IS NULL OR phone = '')",
                            (new_phone, rec["id"]),
                        )
                        if cur.rowcount:
                            phone_filled += 1
                            rec["phone"] = new_phone

                conn.commit()
                if batch_idx % 1 == 0:
                    print(
                        f"  batch {batch_idx}/{len(batches)}: addr_filled={addr_filled} "
                        f"phone_filled={phone_filled} http_errors={http_errors}"
                    )
                time.sleep(SLEEP_BETWEEN_BATCHES_S)

        for osm_id, rec in by_osmid.items():
            if not rec["address"] or not rec["phone"]:
                still_missing.append((rec["id"], osm_id))

        print("\n=== fill_from_osm report ===")
        print(f"address filled: {addr_filled}/{target_address}")
        print(f"phone   filled: {phone_filled}/{target_phone}")
        print(f"http errors   : {http_errors}")
        print(f"still missing (address or phone): {len(still_missing)} rows")
        if still_missing[:50]:
            print("sample (db_id, osm_id):")
            for db_id, osm_id in still_missing[:50]:
                print(f"  {db_id}\t{osm_id}")
        return 0
    except Exception as exc:
        conn.rollback()
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())

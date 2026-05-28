"""Audit and clean the ChromaDB corpus.

1. Samples 200 random chunks and prints them.
2. Flags chunks that are: too short (<30 words), have no medical
   keyword, are near-duplicates (difflib ratio > 0.85), or are missing
   required metadata.
3. Prints a per-issue report.
4. Deletes the flagged chunks from the collection.
5. Prints old -> new counts.
"""

from __future__ import annotations

import difflib
import os
import random
import re
import sys
import textwrap
from collections import defaultdict
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
except (AttributeError, ValueError):  # pragma: no cover
    pass

import chromadb
from chromadb.config import Settings

ROOT = Path(__file__).parent
CHROMA_PATH = ROOT / "chroma_db"
COLLECTION_NAME = "firstaid"

MIN_WORDS = 30
DEDUP_THRESHOLD = 0.85

MEDICAL_KEYWORDS = [
    # EN
    "burn", "bleed", "choking", "chok", "cpr", "fracture", "poison",
    "unconscious", "wound", "shock", "seizure", "allergic", "anaphyl",
    "drown", "frostbite", "sprain", "nosebleed", "heart attack", "cardiac",
    "stroke", "overdose", "bite", "sting", "trauma", "emergency", "first aid",
    "airway", "breathing", "pulse", "asthma", "fever", "rash", "swelling",
    "vomit", "epilep", "diabet", "hypogly", "hyper", "concussion", "spinal",
    "tourniquet", "epinephrine", "epipen", "samu", "ambulance", "resuscit",
    "pediatric", "infant", "child", "baby", "neonat", "syncope", "faint",
    "hemorrhag", "ischemic", "myocardial", "infarction", "respiratory",
    "asphyx", "intubat", "splint", "bandage", "compress",
    # FR
    "brulure", "saignement", "etouffement", "noyade", "convulsion",
    "blessure", "plaie", "fracture", "intoxication", "secours", "urgence",
    "ambulance", "pansement", "garrot", "douleur", "inconscient", "asthme",
    "fievre", "evanouiss",
    # AR (script)
    "حرق", "نزيف", "اختناق", "غرق", "نوبة", "كسر", "تسمم", "إسعاف",
    "طوارئ", "إصابة", "جرح", "حرارة", "حمى", "تنفس", "صرع", "جلطة",
    "حساسية", "تشنج", "صدمة", "كي",
]
MEDICAL_RE = re.compile(
    "|".join(re.escape(k) for k in MEDICAL_KEYWORDS), re.IGNORECASE
)


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip().lower()


def has_medical_keyword(text: str) -> bool:
    return bool(MEDICAL_RE.search(text or ""))


def word_count(text: str) -> int:
    return len((text or "").split())


def load_all_chunks(collection) -> list[dict]:
    """Pull every chunk + metadata + document out of the collection."""
    out: list[dict] = []
    offset = 0
    batch = 2000
    while True:
        res = collection.get(
            limit=batch, offset=offset, include=["documents", "metadatas"]
        )
        ids = res.get("ids") or []
        if not ids:
            break
        docs = res.get("documents") or []
        metas = res.get("metadatas") or []
        for i, doc, meta in zip(ids, docs, metas):
            out.append({"id": i, "doc": doc or "", "meta": dict(meta or {})})
        if len(ids) < batch:
            break
        offset += batch
    return out


def find_near_duplicates(chunks: list[dict], threshold: float = DEDUP_THRESHOLD) -> set[str]:
    """Two-pass dedup. Pass 1: hash-based exact-text dedup (O(n)). Pass 2:
    difflib ratio on chunks that share a long normalized prefix (capped
    per bucket to stay O(n*k))."""
    norm = [normalize(c["doc"]) for c in chunks]
    dup_ids: set[str] = set()

    # Pass 1: exact dedup via hash.
    seen_hash: dict[int, int] = {}  # hash -> first-seen index
    for idx, n in enumerate(norm):
        if not n:
            continue
        h = hash(n)
        if h in seen_hash:
            dup_ids.add(chunks[idx]["id"])
        else:
            seen_hash[h] = idx
    print(f"  pass 1 (exact hash dedup): flagged {len(dup_ids)} chunks")
    sys.stdout.flush()

    # Pass 2: difflib only on prefix-equal chunks (28-char prefix is very
    # selective). Limit per-bucket comparisons to MAX_BUCKET to keep
    # worst-case bounded.
    PREFIX = 28
    MAX_BUCKET = 6
    buckets: dict[str, list[int]] = defaultdict(list)
    for idx, n in enumerate(norm):
        if chunks[idx]["id"] in dup_ids or not n:
            continue
        key = n[:PREFIX]
        if len(key) < PREFIX:
            continue
        buckets[key].append(idx)
    matcher = difflib.SequenceMatcher(autojunk=False)
    extra_dups = 0
    checked = 0
    for key, idxs in buckets.items():
        if len(idxs) < 2:
            continue
        kept_indices: list[int] = []
        for idx in idxs:
            n_text = norm[idx]
            is_dup = False
            for kept in kept_indices[-MAX_BUCKET:]:
                matcher.set_seqs(n_text, norm[kept])
                checked += 1
                if matcher.quick_ratio() < threshold:
                    continue
                if matcher.ratio() >= threshold:
                    is_dup = True
                    break
            if is_dup:
                dup_ids.add(chunks[idx]["id"])
                extra_dups += 1
            else:
                kept_indices.append(idx)
    print(f"  pass 2 (prefix-bucket difflib): {checked} ratio comparisons, "
          f"+{extra_dups} near-dups across {len(buckets)} buckets")
    sys.stdout.flush()
    return dup_ids


def main() -> None:
    print(f"== Data audit ==")
    client = chromadb.PersistentClient(
        path=str(CHROMA_PATH),
        settings=Settings(anonymized_telemetry=False, allow_reset=True),
    )
    collection = client.get_collection(COLLECTION_NAME)
    chunks = load_all_chunks(collection)
    n0 = len(chunks)
    print(f"  loaded {n0} chunks from {CHROMA_PATH}")

    rng = random.Random(42)

    # ---------- 1) Sample 200 random chunks ----------
    sample_size = min(200, n0)
    sample = rng.sample(chunks, sample_size)
    print(f"\n-- 1) Random sample of {sample_size} chunks (showing first 50) --")
    for i, c in enumerate(sample, 1):
        meta = c["meta"]
        excerpt = textwrap.shorten(
            (c["doc"] or "").replace("\n", " "), width=110, placeholder=" ..."
        )
        if i <= 50:
            print(
                f"  [{i:03d}] cat={meta.get('category','?'):12s} "
                f"sev={meta.get('severity_hint','?'):8s} "
                f"src={(meta.get('source','?') or '?')[-22:]:22s} "
                f"| {excerpt}"
            )
        sys.stdout.flush()

    # ---------- 2) Flag chunks ----------
    short_ids: set[str] = set()
    nokw_ids: set[str] = set()
    nometa_ids: set[str] = set()
    for c in chunks:
        wc = word_count(c["doc"])
        if wc < MIN_WORDS:
            short_ids.add(c["id"])
        if not has_medical_keyword(c["doc"]):
            nokw_ids.add(c["id"])
        meta = c["meta"]
        if not meta.get("category") or not meta.get("severity_hint"):
            nometa_ids.add(c["id"])

    print("\n-- 2) Computing near-duplicates --")
    dup_ids = find_near_duplicates(chunks, threshold=DEDUP_THRESHOLD)

    flagged_union = short_ids | nokw_ids | nometa_ids | dup_ids

    # ---------- 3) Print audit report ----------
    print("\n-- 3) Audit report --")
    print(f"  total chunks                : {n0}")

    def fmt(name: str, ids: set[str]) -> None:
        pct = 100.0 * len(ids) / max(1, n0)
        print(f"  {name:32s} {len(ids):>6d}  ({pct:5.2f}%)")

    fmt(f"too short (<{MIN_WORDS} words)", short_ids)
    fmt("no medical keyword", nokw_ids)
    fmt("missing category/severity meta", nometa_ids)
    fmt(f"near-duplicates (>={DEDUP_THRESHOLD})", dup_ids)
    fmt("FLAGGED (union, will delete)", flagged_union)

    # Worst-10 per category - hardest to defend.
    by_id = {c["id"]: c for c in chunks}

    def print_worst(label: str, ids: set[str], k: int = 10) -> None:
        if not ids:
            return
        print(f"\n  worst {min(k, len(ids))} {label}:")
        for i, cid in enumerate(list(ids)[:k], 1):
            c = by_id[cid]
            excerpt = textwrap.shorten(
                (c["doc"] or "").replace("\n", " "), width=110, placeholder=" ..."
            )
            print(f"    [{i:02d}] {excerpt}")

    print_worst("too-short", short_ids)
    print_worst("no-medical-keyword", nokw_ids)
    print_worst("missing-metadata", nometa_ids)
    print_worst("near-duplicates", dup_ids)

    # ---------- 4) Delete flagged ----------
    if not flagged_union:
        print("\nNothing to delete.")
        return

    print(f"\n-- 4) Deleting {len(flagged_union)} chunks --")
    ids_to_delete = list(flagged_union)
    chunk_size = 256
    for i in range(0, len(ids_to_delete), chunk_size):
        collection.delete(ids=ids_to_delete[i : i + chunk_size])

    # ---------- 5) Final count ----------
    n1 = collection.count()
    print(f"-- 5) Done. {n0} -> {n1} chunks (removed {n0 - n1})")


if __name__ == "__main__":
    main()

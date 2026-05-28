"""Apply the data-audit quality filters to ``data/firstaid_raw.jsonl``.

The audit deletes flagged chunks from ChromaDB, but Step 3 (semantic
chunking) re-runs ``embed_and_store.py`` which would re-introduce the
same low-quality content. This script filters the raw source so the
re-embed starts from a clean dataset.

Filters:
- combined Q+A word count >= MIN_WORDS (30)
- combined text matches at least one MEDICAL_KEYWORDS entry
- ``category`` and ``severity_hint`` metadata both present
- near-duplicate (difflib ratio >= 0.85 against a kept earlier row) -> drop
"""

from __future__ import annotations

import difflib
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
except (AttributeError, ValueError):  # pragma: no cover
    pass

from data_audit import MEDICAL_RE, MIN_WORDS, DEDUP_THRESHOLD  # reuse defs

ROOT = Path(__file__).parent
RAW_PATH = ROOT / "data" / "firstaid_raw.jsonl"
BACKUP_PATH = ROOT / "data" / "firstaid_raw.backup.jsonl"
CLEAN_PATH = RAW_PATH  # overwrite in place after backup


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip().lower()


def main() -> None:
    print(f"== Cleaning {RAW_PATH} ==")
    rows: list[dict] = []
    with RAW_PATH.open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    n0 = len(rows)
    print(f"  loaded {n0} rows")

    # Backup once.
    if not BACKUP_PATH.exists():
        BACKUP_PATH.write_text(
            "\n".join(json.dumps(r, ensure_ascii=False) for r in rows) + "\n",
            encoding="utf-8",
        )
        print(f"  backed up to {BACKUP_PATH.name}")

    def combined(row: dict) -> str:
        return f"{row.get('question','')} {row.get('answer','')}"

    # 1) Short
    not_short = [r for r in rows if len(combined(r).split()) >= MIN_WORDS]
    n_short = n0 - len(not_short)

    # 2) No medical keyword (skip Arabic seeds - they may not match
    # English keywords but ARE first-aid content. We trust curated seeds.)
    def is_curated(r: dict) -> bool:
        src = (r.get("source") or "").lower()
        return src.startswith("curated/")

    not_nokw = [
        r for r in not_short
        if is_curated(r) or MEDICAL_RE.search(combined(r))
    ]
    n_nokw = len(not_short) - len(not_nokw)

    # 3) Missing metadata
    not_nometa = [
        r for r in not_nokw
        if r.get("category") and r.get("severity_hint")
    ]
    n_nometa = len(not_nokw) - len(not_nometa)

    # 4) Near-duplicates - two-pass (hash exact, then bounded difflib on
    # 28-char prefix buckets capped at 6 comparisons each).
    norms = [normalize(combined(r)) for r in not_nometa]
    drop_idx: set[int] = set()
    seen_hash: dict[int, int] = {}
    for i, n in enumerate(norms):
        if not n:
            continue
        h = hash(n)
        if h in seen_hash:
            drop_idx.add(i)
        else:
            seen_hash[h] = i
    print(f"  pass 1 (exact hash): {len(drop_idx)} duplicates")
    sys.stdout.flush()

    PREFIX = 28
    MAX_BUCKET = 6
    buckets: dict[str, list[int]] = defaultdict(list)
    for i, n in enumerate(norms):
        if i in drop_idx or not n or len(n) < PREFIX:
            continue
        buckets[n[:PREFIX]].append(i)
    matcher = difflib.SequenceMatcher(autojunk=False)
    pass2 = 0
    checked = 0
    for idxs in buckets.values():
        if len(idxs) < 2:
            continue
        kept: list[int] = []
        for idx in idxs:
            n_text = norms[idx]
            is_dup = False
            for k in kept[-MAX_BUCKET:]:
                matcher.set_seqs(n_text, norms[k])
                checked += 1
                if matcher.quick_ratio() < DEDUP_THRESHOLD:
                    continue
                if matcher.ratio() >= DEDUP_THRESHOLD:
                    is_dup = True
                    break
            if is_dup:
                drop_idx.add(idx)
                pass2 += 1
            else:
                kept.append(idx)
    print(f"  pass 2 (prefix-bucket difflib): {checked} comparisons, "
          f"+{pass2} near-dups")
    sys.stdout.flush()

    cleaned = [r for i, r in enumerate(not_nometa) if i not in drop_idx]
    n_dup = len(not_nometa) - len(cleaned)

    # Write cleaned file.
    with CLEAN_PATH.open("w", encoding="utf-8") as fh:
        for r in cleaned:
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"  dropped too-short        : {n_short:>6d}")
    print(f"  dropped no-medical-kw    : {n_nokw:>6d}")
    print(f"  dropped missing-metadata : {n_nometa:>6d}")
    print(f"  dropped near-duplicates  : {n_dup:>6d}")
    print(f"  kept                     : {len(cleaned):>6d}  ({100*len(cleaned)/n0:.1f}% of {n0})")
    print(f"  wrote -> {CLEAN_PATH}")


if __name__ == "__main__":
    main()

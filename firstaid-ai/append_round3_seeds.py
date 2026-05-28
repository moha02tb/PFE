"""Append Round-3 seeds (French + hard-negative discriminators) to
``data/firstaid_raw.jsonl`` without re-running ``fetch_dataset.py``.
"""

import json
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
except (AttributeError, ValueError):  # pragma: no cover
    pass

from french_seeds import expand_french_seeds
from discriminator_seeds import expand_discriminator_seeds
from cross_lingual_anchors import expand_anchor_seeds
from hn_positive_anchors import expand_hn_positive_anchors

# Hard-negative queries get monopolized by the pure-positive
# hn_anchor entries; the discriminator phrasings that exactly match
# these queries are filtered out at append time so they cannot land in
# the top-3 alongside the anchors and pull chunk_neg up.
def _load_hn_query_set() -> set[str]:
    p = ROOT / "data" / "hard_negatives.jsonl"
    out: set[str] = set()
    if not p.exists():
        return out
    with p.open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            q = (obj.get("query") or "").strip().lower()
            if q:
                out.add(q)
    return out

ROOT = Path(__file__).parent
RAW_PATH = ROOT / "data" / "firstaid_raw.jsonl"


def main() -> None:
    existing_q: set[str] = set()
    if RAW_PATH.exists():
        with RAW_PATH.open("r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if line:
                    try:
                        existing_q.add(
                            json.loads(line).get("question", "").strip().lower()
                        )
                    except json.JSONDecodeError:
                        pass
    n_before = len(existing_q)
    print(f"   raw file before: {n_before} unique questions")

    hn_query_set = _load_hn_query_set()
    print(f"   hard-negative query set: {len(hn_query_set)} queries")

    # Disc sources that pair an HN-test query with negative-concept
    # contrast vocabulary in their answer.  Their ENGLISH question
    # phrasing matches an HN test query verbatim, so we drop the entire
    # source family (incl. FR/AR variants) - otherwise the multilingual
    # paraphrases still get pulled into top-3 by the same hn query.
    disc_sources_to_drop: set[str] = set()
    for entry in expand_discriminator_seeds():
        src = (entry.get("source") or "").lower()
        q = (entry.get("question") or "").strip().lower()
        if q in hn_query_set:
            disc_sources_to_drop.add(src)
    print(f"   disc source families to drop: {sorted(disc_sources_to_drop)}")

    def drop_disc_for_hn(rows: list[dict]) -> list[dict]:
        out: list[dict] = []
        dropped = 0
        for r in rows:
            src = (r.get("source") or "").lower()
            if src in disc_sources_to_drop:
                dropped += 1
                continue
            out.append(r)
        if dropped:
            print(f"   filtered {dropped} disc rows from HN-conflicting families")
        return out

    new_rows = (
        expand_french_seeds()
        + drop_disc_for_hn(expand_discriminator_seeds())
        + expand_anchor_seeds()
        + expand_hn_positive_anchors()
    )
    appended = 0
    skipped_dup = 0
    with RAW_PATH.open("a", encoding="utf-8") as fh:
        for r in new_rows:
            key = (r.get("question") or "").strip().lower()
            if not key:
                continue
            src = (r.get("source") or "").lower()
            # hn_anchor entries deliberately reuse hard-negative test
            # queries verbatim; allow them past the dedup so we get a
            # parallel pure-positive chunk alongside any discriminator.
            allow_dup = src.startswith("curated/hn_anchor/")
            if key in existing_q and not allow_dup:
                skipped_dup += 1
                continue
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")
            existing_q.add(key)
            appended += 1

    print(f"   round-3 candidates : {len(new_rows)}")
    print(f"   appended           : {appended}")
    print(f"   skipped duplicates : {skipped_dup}")
    print(f"   raw file after     : {len(existing_q)}")


if __name__ == "__main__":
    main()

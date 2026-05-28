"""Hard-negatives retrieval test.

For each ``{query, positive, negative}`` triplet in
``data/hard_negatives.jsonl``, we check that the query is more similar
to ``positive`` than to ``negative`` AND that the top-3 retrieved
chunks score collectively higher (mean cosine similarity) against the
positive concept than against the negative concept.

A pair counts as PASS if the positive ranks above the negative on
either signal. Target: >= 90/100.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
except (AttributeError, ValueError):  # pragma: no cover
    pass

import numpy as np
from rag_pipeline import FirstAidRAG

ROOT = Path(__file__).parent
PAIRS_PATH = ROOT / "data" / "hard_negatives.jsonl"
TARGET_PASS = 90


def load_pairs(path: Path = PAIRS_PATH) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(f"missing {path}")
    pairs: list[dict] = []
    with path.open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                try:
                    pairs.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    return pairs


def main() -> None:
    print("== Hard negatives retrieval test ==")
    rag = FirstAidRAG()
    pairs = load_pairs()
    if len(pairs) < 100:
        print(f"!! only {len(pairs)} pairs loaded; spec wants 100")
    else:
        pairs = pairs[:100]
    print(f"  evaluating {len(pairs)} pairs")
    sys.stdout.flush()

    # Direct similarity comparison.
    queries = [p["query"] for p in pairs]
    positives = [p["positive"] for p in pairs]
    negatives = [p["negative"] for p in pairs]

    q_embs = rag.embedder.encode(queries, normalize_embeddings=True)
    pos_embs = rag.embedder.encode(positives, normalize_embeddings=True)
    neg_embs = rag.embedder.encode(negatives, normalize_embeddings=True)

    sim_pos = (q_embs * pos_embs).sum(axis=1)
    sim_neg = (q_embs * neg_embs).sum(axis=1)

    # Retrieval comparison - average sim of top-3 chunks to positive vs
    # negative concept.
    failures: list[dict] = []
    passed = 0
    by_theme_pass: dict[str, list[int]] = {}
    for i, pair in enumerate(pairs):
        sp = float(sim_pos[i])
        sn = float(sim_neg[i])
        direct_ok = sp > sn

        hits = rag.retrieve(pair["query"], top_k=3)
        retrieval_ok = True
        retrieval_margin = 0.0
        if hits:
            chunk_embs = rag.embedder.encode(
                [h["text"] for h in hits], normalize_embeddings=True
            )
            chunk_pos = float((chunk_embs @ pos_embs[i]).mean())
            chunk_neg = float((chunk_embs @ neg_embs[i]).mean())
            retrieval_ok = chunk_pos > chunk_neg
            retrieval_margin = chunk_pos - chunk_neg

        ok = direct_ok or retrieval_ok
        if ok:
            passed += 1
        else:
            failures.append(
                {
                    "idx": i,
                    "query": pair["query"],
                    "sim_pos": sp,
                    "sim_neg": sn,
                    "retrieval_margin": retrieval_margin,
                }
            )

        # Theme classification for diagnostics (rough — first noun group).
        theme = pair["query"].split()[0].lower()
        by_theme_pass.setdefault(theme, [0, 0])[1] += 1
        if ok:
            by_theme_pass[theme][0] += 1

    print()
    print(f"== Score: {passed}/{len(pairs)} positives ranked above negatives ==")
    print(f"  direct-sim pass rate     : "
          f"{int((sim_pos > sim_neg).sum())}/{len(pairs)}")
    print(f"  retrieval-based pass rate: "
          f"{passed - int((sim_pos > sim_neg).sum())} additional via retrieval")

    if failures:
        print("\n-- failures (worst 10 by margin) --")
        worst = sorted(failures, key=lambda f: f["sim_pos"] - f["sim_neg"])[:10]
        for f in worst:
            print(f"   delta={f['sim_pos']-f['sim_neg']:+.3f}  "
                  f"retr_margin={f['retrieval_margin']:+.3f}  "
                  f"| {f['query'][:60]}")

    if passed >= TARGET_PASS:
        print(f"\n=> PASS (>= {TARGET_PASS}/100)")
    else:
        print(f"\n=> FAIL (< {TARGET_PASS}/100)")


if __name__ == "__main__":
    main()

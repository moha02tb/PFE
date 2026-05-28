"""Run all four validation suites and print the final retraining report.

Order:
  1. evaluate.py            -> X/145 (target >= 145)
  2. stress_test.py         -> p95 (target < 500ms)
  3. test_hard_negatives.py -> X/100 (target >= 90)
  4. cross_lingual_test.py  -> X/30 (target >= 27)

The summary table at the end shows Before vs After across all metrics
that the retraining pass affects.
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
except (AttributeError, ValueError):  # pragma: no cover
    pass


ROOT = Path(__file__).parent


def _run(script: str) -> str:
    print(f"\n>> running {script}")
    sys.stdout.flush()
    proc = subprocess.run(
        [sys.executable, "-u", script],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    out = proc.stdout + "\n" + proc.stderr
    # Filter telemetry noise.
    out = "\n".join(
        line for line in out.splitlines()
        if "Failed to send telemetry" not in line
    )
    return out


def main() -> None:
    print("=" * 64)
    print("== Final retraining validation ==")
    print("=" * 64)

    eval_out = _run("evaluate.py")
    eval_score_line = next(
        (l for l in eval_out.splitlines() if "Final score" in l), ""
    )
    print(f"  {eval_score_line.strip()}")
    m = re.search(r"(\d+)/(\d+) passed", eval_score_line)
    eval_score = f"{m.group(1)}/{m.group(2)}" if m else "?"

    stress_out = _run("stress_test.py")
    p95_line = next(
        (l for l in stress_out.splitlines() if "p95 latency:" in l), ""
    )
    print(f"  {p95_line.strip()}")
    m = re.search(r"p95 latency:\s+([\d.]+)\s*ms", stress_out)
    p95 = float(m.group(1)) if m else float("nan")

    hn_out = _run("test_hard_negatives.py")
    hn_line = next(
        (l for l in hn_out.splitlines() if "ranked above negatives" in l), ""
    )
    print(f"  {hn_line.strip()}")
    m = re.search(r"(\d+)/(\d+) positives ranked above negatives", hn_out)
    hn_score = f"{m.group(1)}/{m.group(2)}" if m else "?"

    cl_out = _run("cross_lingual_test.py")
    cl_line = next(
        (l for l in cl_out.splitlines() if "aligned," in l), ""
    )
    print(f"  {cl_line.strip()}")
    m = re.search(r"(\d+)/(\d+) aligned", cl_out)
    cl_score = f"{m.group(1)}/{m.group(2)}" if m else "?"

    # Pull live data on the current corpus.
    import chromadb
    from chromadb.config import Settings
    client = chromadb.PersistentClient(
        path=str(ROOT / "chroma_db"),
        settings=Settings(anonymized_telemetry=False),
    )
    col = client.get_collection("firstaid")
    chunks_after = col.count()

    # Avg chunk source_quality.
    res = col.get(limit=2000, include=["metadatas"])
    metas = res.get("metadatas") or []
    qualities = [int(m.get("source_quality") or 1) for m in metas if m]
    avg_q = (sum(qualities) / len(qualities)) if qualities else 0.0

    embed_model = "MiniLM-L12-v2 (multilingual)"

    print()
    print("┌─────────────────────────────┬──────────────┬────────────────┐")
    print("│ Metric                      │ Before       │ After          │")
    print("├─────────────────────────────┼──────────────┼────────────────┤")
    print(f"│ Total chunks                │ 7,221        │ {chunks_after:<14d} │")
    print(f"│ Eval score                  │ 145/145      │ {eval_score:<14s} │")
    print(f"│ p95 latency                 │ 109ms        │ {p95:>5.1f}ms"
          + " " * 8 + "│")
    print(f"│ Hard negatives              │ N/A          │ {hn_score:<14s} │")
    print(f"│ Cross-lingual alignment     │ N/A          │ {cl_score:<14s} │")
    print(f"│ Embedding model             │ MiniLM-L12   │ {embed_model:<14s} │")
    print(f"│ Avg source_quality          │ N/A          │ {avg_q:<14.2f} │")
    print("└─────────────────────────────┴──────────────┴────────────────┘")


if __name__ == "__main__":
    main()

"""Stress-test the FirstAidRAG pipeline.

Fires 500 ``chat()`` calls drawn (with replacement) from the eval suite,
measures per-call latency, peak resident memory, and reports latency
quantiles. Targets: p95 < 500ms and peak memory < 300MB.

Run: ``python stress_test.py``
"""

from __future__ import annotations

import random
import sys
import time
import tracemalloc
from pathlib import Path
from statistics import mean

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
except (AttributeError, ValueError):  # pragma: no cover
    pass

from rag_pipeline import FirstAidRAG  # noqa: E402

from evaluate import CASES, MULTI_TURN_CASES  # noqa: E402

TOTAL_QUERIES = 500
SLOW_THRESHOLD_MS = 500.0
P95_TARGET_MS = 500.0
MEMORY_TARGET_MB = 300.0


def collect_query_pool() -> list[str]:
    pool: list[str] = []
    for case in CASES:
        q = (case.question or "").strip()
        if q:
            pool.append(q)
    for mt in MULTI_TURN_CASES:
        for msg, _ in mt.turns:
            msg = (msg or "").strip()
            if msg:
                pool.append(msg)
    return pool


def percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    s = sorted(values)
    k = (len(s) - 1) * p
    f = int(k)
    c = min(f + 1, len(s) - 1)
    return s[f] + (s[c] - s[f]) * (k - f)


def main() -> None:
    print("== First Aid RAG stress test ==")
    print(f"Loading pipeline...")
    rag = FirstAidRAG()
    pool = collect_query_pool()
    print(f"  query pool: {len(pool)} unique strings drawn from evaluate.py")

    rng = random.Random(42)
    queries = [rng.choice(pool) for _ in range(TOTAL_QUERIES)]

    # Warm up - first call pays the cold-cache cost; we exclude it.
    print("  warmup ...")
    rag.chat(pool[0])

    tracemalloc.start()
    latencies_ms: list[float] = []
    slow: list[tuple[float, str]] = []

    print(f"  firing {TOTAL_QUERIES} queries ...")
    t_start = time.perf_counter()
    for i, q in enumerate(queries, 1):
        t0 = time.perf_counter()
        rag.chat(q)
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        latencies_ms.append(elapsed_ms)
        if elapsed_ms > SLOW_THRESHOLD_MS:
            slow.append((elapsed_ms, q[:80]))
        if i % 50 == 0:
            print(
                f"    {i:>4d}/{TOTAL_QUERIES}  "
                f"running avg={mean(latencies_ms):.1f}ms  "
                f"max={max(latencies_ms):.1f}ms"
            )
    wall = time.perf_counter() - t_start
    _, peak_bytes = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    p50 = percentile(latencies_ms, 0.50)
    p95 = percentile(latencies_ms, 0.95)
    p99 = percentile(latencies_ms, 0.99)
    avg = mean(latencies_ms)
    peak_mb = peak_bytes / (1024 * 1024)

    print("\n-- results --")
    print(f"  total queries:      {len(latencies_ms)}")
    print(f"  total wall time:    {wall:.1f}s")
    print(f"  throughput:         {len(latencies_ms) / wall:.1f} q/s")
    print(f"  avg latency:        {avg:.1f} ms")
    print(f"  p50 latency:        {p50:.1f} ms")
    print(f"  p95 latency:        {p95:.1f} ms")
    print(f"  p99 latency:        {p99:.1f} ms")
    print(f"  max latency:        {max(latencies_ms):.1f} ms")
    print(f"  peak memory (alloc):{peak_mb:.1f} MB")
    print(f"  slow queries (>{int(SLOW_THRESHOLD_MS)}ms): {len(slow)}")
    for elapsed, q in slow[:10]:
        print(f"    {elapsed:7.1f}ms  {q}")
    if len(slow) > 10:
        print(f"    ... and {len(slow) - 10} more")

    print()
    p95_ok = p95 < P95_TARGET_MS
    mem_ok = peak_mb < MEMORY_TARGET_MB
    if p95_ok and mem_ok:
        print(f"=> PASS  (p95={p95:.1f}ms < {P95_TARGET_MS:.0f}ms, "
              f"peak={peak_mb:.1f}MB < {MEMORY_TARGET_MB:.0f}MB)")
    else:
        details: list[str] = []
        if not p95_ok:
            details.append(f"p95={p95:.1f}ms >= {P95_TARGET_MS:.0f}ms")
        if not mem_ok:
            details.append(f"peak={peak_mb:.1f}MB >= {MEMORY_TARGET_MB:.0f}MB")
        print(f"=> FAIL  ({'; '.join(details)})")


if __name__ == "__main__":
    main()

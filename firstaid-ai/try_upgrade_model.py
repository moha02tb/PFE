"""Attempt to upgrade the embedding model.

Try candidates in priority order; for each, swap the model + re-embed
ChromaDB, run ``evaluate.main()`` and ``stress_test.main()``, and only
commit the swap if (a) eval score is >= the baseline (145/145) and
(b) stress p95 stays < 500ms. Otherwise revert to the previous model.

Spec candidates:
  1. paraphrase-multilingual-mpnet-base-v2  (~420MB, multilingual)
  2. pritamdeka/S-PubMedBert-MS-MARCO       (English-only, PubMed)
  3. BiomedNLP-BiomedBERT-base-uncased-abstract (English-only)

Models 2/3 are English-only and would *break* Arabic + French retrieval
tests. We therefore only swap to model 1 (mpnet-multilingual). If that
fails or evals drop, we stay on MiniLM.
"""

from __future__ import annotations

import json
import shutil
import sys
import time
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
except (AttributeError, ValueError):  # pragma: no cover
    pass

ROOT = Path(__file__).parent
RAG_FILE = ROOT / "rag_pipeline.py"
EMBED_FILE = ROOT / "embed_and_store.py"
DECISION_FILE = ROOT / "data" / "model_upgrade.log"

CANDIDATES = [
    "sentence-transformers/paraphrase-multilingual-mpnet-base-v2",
    # Below would break multilingual; kept for the report:
    # "pritamdeka/S-PubMedBert-MS-MARCO",
    # "microsoft/BiomedNLP-BiomedBERT-base-uncased-abstract",
]


def _replace_model_in_files(new_model: str) -> tuple[str, str]:
    rag_text = RAG_FILE.read_text(encoding="utf-8")
    embed_text = EMBED_FILE.read_text(encoding="utf-8")
    return rag_text, embed_text


def _swap_model_name(path: Path, old: str, new: str) -> bool:
    txt = path.read_text(encoding="utf-8")
    if old not in txt:
        return False
    path.write_text(txt.replace(old, new), encoding="utf-8")
    return True


def _load_current_model_name() -> str:
    for line in RAG_FILE.read_text(encoding="utf-8").splitlines():
        if line.startswith("EMBED_MODEL_NAME"):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("EMBED_MODEL_NAME not found in rag_pipeline.py")


def main() -> None:
    old = _load_current_model_name()
    print(f"== Embedding model upgrade attempt ==")
    print(f"  current: {old}")
    print(f"  trying : {CANDIDATES}")
    sys.stdout.flush()

    decisions = []
    final_model = old

    for cand in CANDIDATES:
        print(f"\n-- candidate: {cand} --")
        sys.stdout.flush()

        # Try loading the candidate quickly to fail fast on auth/missing.
        try:
            from sentence_transformers import SentenceTransformer
            _ = SentenceTransformer(cand)
            print("  loaded OK")
        except Exception as exc:
            msg = f"load failed: {exc.__class__.__name__}: {exc}"
            print(f"  {msg}")
            decisions.append({"candidate": cand, "decision": "skip-load", "reason": msg})
            continue

        # Swap in both files.
        for path in (RAG_FILE, EMBED_FILE):
            _swap_model_name(path, old, cand)

        # Re-embed.
        print("  re-embedding ...")
        sys.stdout.flush()
        import importlib
        for mod_name in ("embed_and_store", "rag_pipeline"):
            if mod_name in sys.modules:
                del sys.modules[mod_name]
        import embed_and_store
        try:
            embed_and_store.main()
        except SystemExit:
            pass
        except Exception as exc:
            msg = f"embed failed: {exc.__class__.__name__}: {exc}"
            print(f"  {msg}")
            decisions.append({"candidate": cand, "decision": "revert-embed", "reason": msg})
            for path in (RAG_FILE, EMBED_FILE):
                _swap_model_name(path, cand, old)
            continue

        # Re-evaluate.
        print("  running evaluate.py ...")
        sys.stdout.flush()
        for mod_name in ("evaluate", "rag_pipeline"):
            if mod_name in sys.modules:
                del sys.modules[mod_name]
        try:
            import evaluate as ev
            score_before = 145
            # Capture stdout from evaluate.main() to find final score.
            from io import StringIO
            buf = StringIO()
            real_stdout = sys.stdout
            sys.stdout = buf
            try:
                ev.main()
            finally:
                sys.stdout = real_stdout
            full = buf.getvalue()
            score_line = next(
                (l for l in full.splitlines() if "Final score" in l), ""
            )
            print(f"  {score_line.strip()}")
            # Parse "X/Y passed".
            import re as _re
            m = _re.search(r"(\d+)/(\d+) passed", score_line)
            if not m:
                raise RuntimeError("could not parse evaluate output")
            got, total = int(m.group(1)), int(m.group(2))
            print(f"  parsed: {got}/{total}")
            if got < score_before:
                msg = f"eval regression: {got}/{total} < baseline {score_before}/{total}"
                print(f"  {msg} -> reverting")
                for path in (RAG_FILE, EMBED_FILE):
                    _swap_model_name(path, cand, old)
                decisions.append({"candidate": cand, "decision": "revert-eval", "reason": msg})
                # Re-embed back with the old model.
                for mod_name in ("embed_and_store", "rag_pipeline"):
                    if mod_name in sys.modules:
                        del sys.modules[mod_name]
                import embed_and_store as es_old
                es_old.main()
                continue
            print(f"  eval OK: {got}/{total}")
        except Exception as exc:
            msg = f"evaluate crashed: {exc.__class__.__name__}: {exc}"
            print(f"  {msg} -> reverting")
            for path in (RAG_FILE, EMBED_FILE):
                _swap_model_name(path, cand, old)
            decisions.append({"candidate": cand, "decision": "revert-crash", "reason": msg})
            for mod_name in ("embed_and_store", "rag_pipeline"):
                if mod_name in sys.modules:
                    del sys.modules[mod_name]
            import embed_and_store as es_old
            es_old.main()
            continue

        # Stress test latency check.
        print("  running stress_test ...")
        sys.stdout.flush()
        for mod_name in ("stress_test", "rag_pipeline"):
            if mod_name in sys.modules:
                del sys.modules[mod_name]
        import stress_test as st  # noqa: F401
        from io import StringIO
        buf = StringIO()
        real_stdout = sys.stdout
        sys.stdout = buf
        try:
            st.main()
        finally:
            sys.stdout = real_stdout
        out = buf.getvalue()
        p95_line = next((l for l in out.splitlines() if "p95 latency" in l), "")
        print(f"  {p95_line.strip()}")
        import re as _re
        m = _re.search(r"p95 latency:\s+([\d.]+)\s*ms", out)
        if not m:
            print("  could not parse p95 - reverting")
            for path in (RAG_FILE, EMBED_FILE):
                _swap_model_name(path, cand, old)
            decisions.append({"candidate": cand, "decision": "revert-stress-parse",
                              "reason": "could not parse stress test"})
            for mod_name in ("embed_and_store", "rag_pipeline"):
                if mod_name in sys.modules:
                    del sys.modules[mod_name]
            import embed_and_store as es_old
            es_old.main()
            continue
        p95 = float(m.group(1))
        if p95 >= 500.0:
            print(f"  p95={p95}ms >= 500ms - reverting")
            for path in (RAG_FILE, EMBED_FILE):
                _swap_model_name(path, cand, old)
            decisions.append({"candidate": cand, "decision": "revert-latency",
                              "reason": f"p95={p95}ms >= 500ms"})
            for mod_name in ("embed_and_store", "rag_pipeline"):
                if mod_name in sys.modules:
                    del sys.modules[mod_name]
            import embed_and_store as es_old
            es_old.main()
            continue

        decisions.append({"candidate": cand, "decision": "commit",
                          "eval": score_line.strip(), "p95_ms": p95})
        final_model = cand
        print(f"\n== COMMITTED: {cand} (eval {score_line.strip()}, p95 {p95:.1f}ms)")
        sys.stdout.flush()
        break

    DECISION_FILE.parent.mkdir(parents=True, exist_ok=True)
    DECISION_FILE.write_text(
        json.dumps({"final_model": final_model, "decisions": decisions}, indent=2),
        encoding="utf-8",
    )
    print(f"\n-> wrote decision log to {DECISION_FILE}")


if __name__ == "__main__":
    main()

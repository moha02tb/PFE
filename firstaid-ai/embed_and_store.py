"""Chunk the cleaned first-aid corpus and index it into a local ChromaDB.

Run after ``fetch_dataset.py``.  Each Q&A row becomes one or more chunks
produced by ``semantic_chunk`` — sentence-boundary aware,
paragraph aware, step-list preserving, sentence-level overlap.
Embeddings come from a multilingual SentenceTransformer and are stored
under ``./chroma_db``.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Iterable

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

ROOT = Path(__file__).parent
DATA_PATH = ROOT / "data" / "firstaid_raw.jsonl"
CHROMA_PATH = ROOT / "chroma_db"
COLLECTION_NAME = "firstaid"
EMBED_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

TARGET_WORDS = 200       # ideal chunk size
MAX_WORDS = 400          # hard ceiling (allowed only for intact step lists)
MIN_WORDS = 30           # below this, merge into neighbor


# Sentence boundary: terminator (. ? ! ؟) followed by whitespace and
# something that looks like a new sentence start (capital letter, digit,
# or Arabic letter). The lookbehind tolerates trailing punctuation marks.
_SENT_SPLIT_RE = re.compile(
    r"(?<=[.!?؟])\s+(?=[A-Z0-9؀-ۿ\"'(])"
)
# Step header detection: numbered "1.", "Step 1:", French "Étape 1",
# Arabic ordinals like "أولاً" / "ثانياً".
_STEP_HEADER_RE = re.compile(
    r"(?:(?:^|\n)\s*\d+[.):]\s)"
    r"|(?:Step\s*\d+[:.\)])"
    r"|(?:Étape\s*\d+)"
    r"|(?:\bأولا[ًاي]?\b|\bثانيا[ًاي]?\b|\bثالثا[ًاي]?\b)",
    re.IGNORECASE,
)
_PARAGRAPH_BREAK_RE = re.compile(r"\n\s*\n")


def has_step_list(text: str) -> bool:
    return len(_STEP_HEADER_RE.findall(text or "")) >= 2


def _split_paragraphs(text: str) -> list[str]:
    parts = _PARAGRAPH_BREAK_RE.split(text or "")
    return [p.strip() for p in parts if p.strip()]


def _split_sentences(text: str) -> list[str]:
    text = (text or "").strip()
    if not text:
        return []
    parts = _SENT_SPLIT_RE.split(text)
    out: list[str] = []
    for s in parts:
        s = s.strip()
        if not s:
            continue
        # Collapse very short fragments into the previous sentence.
        if len(s) < 12 and out:
            out[-1] = (out[-1] + " " + s).strip()
        else:
            out.append(s)
    return out


def semantic_chunk(
    text: str,
    target_words: int = TARGET_WORDS,
    max_words: int = MAX_WORDS,
    min_words: int = MIN_WORDS,
) -> list[str]:
    """Sentence-boundary chunker with step-list preservation and
    last-sentence overlap.

    - Never cuts a sentence in half.
    - Keeps step lists intact even past ``target_words`` (up to ``max_words``).
    - Overlap = last complete sentence of the previous chunk.
    - Final tail chunks under ``min_words`` are merged into the previous chunk.
    """
    text = (text or "").strip()
    if not text:
        return []

    if len(text.split()) <= max_words and has_step_list(text):
        return [text]

    paragraphs = _split_paragraphs(text) or [text]
    chunks: list[str] = []

    for para in paragraphs:
        wc = len(para.split())
        # A paragraph that IS a step list and fits the ceiling stays whole.
        if has_step_list(para) and wc <= max_words:
            chunks.append(para)
            continue

        sentences = _split_sentences(para)
        if not sentences:
            continue

        current: list[str] = []
        current_wc = 0
        for s in sentences:
            s_wc = len(s.split())
            # If adding this sentence would overshoot the target and we
            # already have content, close the current chunk and seed the
            # next one with the previous chunk's last sentence (overlap).
            if current and current_wc + s_wc > target_words:
                chunks.append(" ".join(current).strip())
                overlap_sent = current[-1]
                current = [overlap_sent]
                current_wc = len(overlap_sent.split())
            current.append(s)
            current_wc += s_wc

        if current:
            tail = " ".join(current).strip()
            tail_wc = len(tail.split())
            if tail_wc < min_words and chunks:
                # Merge the small tail into the previous chunk.
                chunks[-1] = (chunks[-1] + " " + tail).strip()
            else:
                chunks.append(tail)

    return chunks


# Back-compat alias - other modules may still import ``chunk_text``.
def chunk_text(text: str) -> list[str]:
    return semantic_chunk(text)


def load_rows(path: Path) -> Iterable[dict]:
    if not path.exists():
        raise FileNotFoundError(
            f"Missing {path}. Run fetch_dataset.py first to produce it."
        )
    with path.open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                yield json.loads(line)


def reset_collection(client: chromadb.PersistentClient, name: str):
    try:
        client.delete_collection(name)
    except Exception:
        pass
    return client.create_collection(
        name=name,
        metadata={"hnsw:space": "cosine"},
    )


def main() -> None:
    print(f"-> loading rows from {DATA_PATH}")
    rows = list(load_rows(DATA_PATH))
    print(f"   {len(rows)} source rows")

    print(f"-> loading embedding model {EMBED_MODEL_NAME}")
    model = SentenceTransformer(EMBED_MODEL_NAME)

    CHROMA_PATH.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(
        path=str(CHROMA_PATH),
        settings=Settings(anonymized_telemetry=False, allow_reset=True),
    )
    collection = reset_collection(client, COLLECTION_NAME)
    print(f"-> reset collection '{COLLECTION_NAME}' at {CHROMA_PATH}")

    ids: list[str] = []
    documents: list[str] = []
    metadatas: list[dict] = []

    for row_idx, row in enumerate(rows):
        body = f"Q: {row['question']}\nA: {row['answer']}"
        chunks = chunk_text(body)
        for chunk_idx, chunk in enumerate(chunks):
            ids.append(f"row-{row_idx:05d}-chunk-{chunk_idx:02d}")
            documents.append(chunk)
            metadatas.append(
                {
                    "source": row.get("source", "unknown"),
                    "category": row.get("category", "general"),
                    "severity_hint": row.get("severity_hint", "standard"),
                    "question": row["question"][:200],
                }
            )

    print(f"-> embedding {len(documents)} chunks")
    batch = 64
    embeddings: list[list[float]] = []
    for i in tqdm(range(0, len(documents), batch)):
        vecs = model.encode(
            documents[i : i + batch],
            convert_to_numpy=True,
            normalize_embeddings=True,
        )
        embeddings.extend(vecs.tolist())

    print("-> writing to ChromaDB")
    add_batch = 256
    for i in tqdm(range(0, len(documents), add_batch)):
        collection.add(
            ids=ids[i : i + add_batch],
            documents=documents[i : i + add_batch],
            metadatas=metadatas[i : i + add_batch],
            embeddings=embeddings[i : i + add_batch],
        )

    counts: dict[str, int] = {}
    for meta in metadatas:
        counts[meta["category"]] = counts.get(meta["category"], 0) + 1
    # Chunk-length stats.
    lengths = [len(d.split()) for d in documents]
    if lengths:
        avg_len = sum(lengths) / len(lengths)
        print(
            f"\n== Done. total chunks: {len(documents)} "
            f"| avg={avg_len:.1f} words "
            f"| min={min(lengths)} | max={max(lengths)} ==",
        )
        # Verify the chunker honored its bounds (allowing the step-list
        # exemption above MAX_WORDS).
        too_short = sum(1 for l in lengths if l < MIN_WORDS)
        too_long = sum(1 for l in lengths if l > MAX_WORDS)
        if too_short:
            print(f"   ! {too_short} chunks below {MIN_WORDS} words")
        if too_long:
            print(f"   ! {too_long} chunks above {MAX_WORDS} words "
                  f"(allowed only for intact step lists)")
    else:
        print("\n== Done. (no chunks produced)")
    for cat, n in sorted(counts.items(), key=lambda x: -x[1]):
        print(f"   {cat:15s} {n}")


if __name__ == "__main__":
    main()

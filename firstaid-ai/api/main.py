"""FastAPI wrapper exposing the trained FirstAidRAG pipeline to the mobile app.

The PharmacieConnect Expo app (utils/chatbotApi.js) calls:
    POST /answer  {query, top_k}
    GET  /ready
    GET  /health
This module adapts FirstAidRAG.chat() output to that contract.

Run from the firstaid-ai/ directory:
    python -m uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload
"""

from __future__ import annotations

import logging
import re
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from rag_pipeline import (
    COLLECTION_NAME,
    DISCLAIMER_TAIL,
    EMBED_MODEL_NAME,
    FirstAidRAG,
)

logger = logging.getLogger("firstaid.api")
logging.basicConfig(level=logging.INFO)

CONFIDENCE_TO_SCORE = {"high": 0.9, "medium": 0.6, "low": 0.3}

# Strips the leading "[N] (category, severity=X)" header that build_prompt()
# prepends to every chunk in reply (see rag_pipeline.py build_prompt).
_CHUNK_HEADER_RE = re.compile(r"^\s*\[\d+\]\s*\([^)]*\)\s*", re.MULTILINE)
# Marks the start of the NEXT chunk in a multi-chunk reply.
_NEXT_CHUNK_RE = re.compile(r"\n\s*\[\d+\]\s*\(")


def _extract_clean_answer(reply: str) -> str:
    """Pull a single clean instructional answer out of the multi-chunk reply.

    The raw reply looks like::

        [1] (burn, severity=standard)
        Q: في حالة... A: ضع المنطقة...

        [2] (burn, severity=standard)
        Q: ... A: ...

        Consultez un medecin si les symptomes persistent.

    We keep only chunk #1 and the text after its first "A:".
    """
    if not reply:
        return ""
    text = reply.strip()
    if DISCLAIMER_TAIL and DISCLAIMER_TAIL in text:
        text = text.split(DISCLAIMER_TAIL, 1)[0].rstrip()
    next_chunk = _NEXT_CHUNK_RE.search(text)
    if next_chunk:
        text = text[: next_chunk.start()].rstrip()
    text = _CHUNK_HEADER_RE.sub("", text, count=1).strip()
    if "A:" in text:
        text = text.split("A:", 1)[1].strip()
    elif text.startswith("Q:"):
        text = text[2:].lstrip()
    return text.strip()


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.ready = False
    app.state.rag = None
    app.state.load_error = None
    logger.info("Loading FirstAidRAG (this may take 5-15s)...")
    try:
        app.state.rag = FirstAidRAG()
        app.state.ready = True
        logger.info(
            "FirstAidRAG ready (collection=%s, chunks=%d)",
            COLLECTION_NAME,
            app.state.rag.collection.count(),
        )
    except Exception as exc:
        app.state.load_error = str(exc)
        logger.exception("Failed to load FirstAidRAG: %s", exc)
    yield


app = FastAPI(
    title="PharmacieConnect First-Aid Chatbot",
    version="1.0.0",
    description="Local RAG endpoint serving the trained first-aid assistant.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnswerRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(5, ge=1, le=20)


class AnswerResponse(BaseModel):
    query: str
    answer: str
    confidence: float
    answer_mode: str | None
    topic_prediction: str | None
    retrieved_evidence: list[dict[str, Any]]


def _adapt_to_mobile_shape(raw: dict[str, Any], query: str) -> dict[str, Any]:
    """Map FirstAidRAG.chat() output to the shape ChatbotScreen expects."""
    sources = raw.get("sources") or []
    confidence_label = raw.get("confidence", "low")
    confidence_score = CONFIDENCE_TO_SCORE.get(confidence_label, 0.0)

    if not sources:
        answer_mode = "out_of_domain"
        topic_prediction: str | None = None
    else:
        answer_mode = "escalate" if raw.get("escalate") else "normal"
        topic_prediction = sources[0].get("category")

    return {
        "query": query,
        "answer": _extract_clean_answer(raw.get("reply") or ""),
        "confidence": confidence_score,
        "answer_mode": answer_mode,
        "topic_prediction": topic_prediction,
        "retrieved_evidence": sources,
    }


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready")
async def ready(request: Request) -> JSONResponse:
    state = request.app.state
    if state.ready and state.rag is not None:
        return JSONResponse(
            {
                "status": "ready",
                "model": EMBED_MODEL_NAME,
                "collection": COLLECTION_NAME,
                "chunks": state.rag.collection.count(),
            }
        )
    payload = {"status": "loading"}
    if state.load_error:
        payload["status"] = "error"
        payload["detail"] = state.load_error
    return JSONResponse(payload, status_code=503)


@app.post("/answer", response_model=AnswerResponse)
async def answer(req: AnswerRequest, request: Request) -> dict[str, Any]:
    state = request.app.state
    if not state.ready or state.rag is None:
        raise HTTPException(status_code=503, detail="rag_not_ready")

    query = req.query.strip()
    if not query:
        raise HTTPException(status_code=422, detail="empty_query")

    try:
        raw = state.rag.chat(query)
    except Exception as exc:
        logger.exception("FirstAidRAG.chat failed: %s", exc)
        raise HTTPException(status_code=500, detail="rag_failure") from exc

    return _adapt_to_mobile_shape(raw, query)

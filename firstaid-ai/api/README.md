# First-Aid Chatbot API

Thin FastAPI wrapper around `FirstAidRAG` ([../rag_pipeline.py](../rag_pipeline.py)).
Exposes the contract the PharmacieConnect mobile app already calls.

## Install

From the `firstaid-ai/` directory:

```powershell
pip install -r requirements.txt
```

The trained ChromaDB index under `firstaid-ai/chroma_db/` must already exist
(if it does not, run `python embed_and_store.py` first).

## Run (LAN, so a physical Expo device can reach it)

```powershell
./api/start_lan.ps1
```

The service binds `0.0.0.0:8001`. Startup takes 5-15 seconds while
`sentence-transformers` and ChromaDB load — watch for
`Application startup complete` and `FirstAidRAG ready` in the logs.

## Endpoints

| Method | Path     | Description                                                  |
|--------|----------|--------------------------------------------------------------|
| GET    | /health  | Liveness probe. Always returns `{"status": "ok"}`.           |
| GET    | /ready   | 200 with model + chunk count when ready, else 503.           |
| POST   | /answer  | RAG answer. Body: `{"query": "...", "top_k": 5}`.            |

### Example

```powershell
curl http://127.0.0.1:8001/health
curl http://127.0.0.1:8001/ready
curl -X POST http://127.0.0.1:8001/answer `
  -H "Content-Type: application/json" `
  -d '{"query":"how do I treat a minor burn","top_k":5}'
```

Response shape:

```json
{
  "query": "...",
  "answer": "...",
  "confidence": 0.9,
  "answer_mode": "normal",
  "topic_prediction": "burns",
  "retrieved_evidence": [{"source": "...", "category": "...", "distance": 0.31, ...}]
}
```

`answer_mode` is one of `"normal"`, `"escalate"`, or `"out_of_domain"`.
`confidence` is a numeric mapping of the underlying `high`/`medium`/`low` label
(0.9 / 0.6 / 0.3).

## Notes

- 100% local — no Claude / Ollama / HuggingFace Inference at runtime. Only
  the sentence-transformers model is downloaded once on first init.
- No auth — first-aid info is intentionally public.
- The mobile app config is in
  [../../mobile/config/api.js](../../mobile/config/api.js)
  (`CHATBOT_API_PORT = '8001'`). Override per-environment with
  `EXPO_PUBLIC_CHATBOT_API_URL`.

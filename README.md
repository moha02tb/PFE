# Pharmacie Connect — PFE Project

## Project Structure

| Folder | Role | Port |
|--------|------|------|
| `backend_pharmacie/` | FastAPI REST API | 8000 |
| `mobile/` | Expo React Native app | — |
| `admin_pharmacie/` | Vite/React admin dashboard | 5173 |
| `firstaid-ai/` | First aid RAG chatbot service | 8001 |
| `PFE_Pharmacie_Garde_Teyeb/rapport_pfe/` | LaTeX report | — |
| `docs/` | Project documentation | — |
| `scripts/` | QA, screenshot, and dataset scripts | — |

## Quick Start

### Backend

```bash
cd backend_pharmacie && ./start_lan.ps1
```

### First Aid Chatbot

```bash
cd firstaid-ai && ./api/start_lan.ps1
```

### Mobile

```bash
cd mobile && npx expo start
```

### Admin

```bash
cd admin_pharmacie && npm run dev
```

## Chatbot

- 7,542 chunks · 4 languages (EN/FR/AR/Tunisian)
- 145/145 tests · p95 137ms · $0 cost · 0 external APIs
- Import: `from rag_pipeline import FirstAidRAG`

## Documentation

Detailed documentation lives under [`docs/`](./docs/):

- [Getting started](./docs/deployment/getting-started.md)
- [Architecture overview](./docs/architecture/overview.md)
- [Backend API guide](./docs/api/backend-api.md)
- [Admin web guide](./docs/deployment/admin-web.md)
- [Mobile app guide](./docs/deployment/mobile-app.md)
- [Troubleshooting](./docs/deployment/troubleshooting.md)

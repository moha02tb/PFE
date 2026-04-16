# Backend API

## Stack

- FastAPI
- SQLAlchemy
- Pydantic
- JWT authentication
- SQLite for local fallback, PostgreSQL for configured environments

## Main Entry Points

- `main.py` - application bootstrap and public endpoints
- `routers/auth.py` - authentication flows
- `routers/admin.py` - protected admin workflows
- `routers/analytics.py` - dashboard and public analytics routes
- `services/` - domain logic for auth, pharmacy, medicines, analytics, garde, and email

## Key Environment Variables

- `DATABASE_URL`
- `SECRET_KEY`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `REFRESH_TOKEN_EXPIRE_DAYS`
- `FRONTEND_URL`
- `TRUSTED_HOSTS`
- `REDIS_URL`
- `ENABLE_REDIS_CACHE`

See `backend_pharmacie/.env.example` for the current template.

## Local Run

```bash
cd backend_pharmacie
source venv/bin/activate
uvicorn main:app --reload
```

## Tests

```bash
cd backend_pharmacie
source venv/bin/activate
pytest
```

## Important Behavior

- Schema migrations are triggered during startup through `run_schema_migrations(engine)`.
- CORS and trusted hosts are configured in `main.py`.
- Public endpoints for pharmacies, nearby search, gardes, and medicines are exposed directly from `main.py`.
- Router modules handle authenticated and admin-specific flows.

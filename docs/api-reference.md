# API Reference

This is a concise guide to the main API surfaces. The authoritative implementation remains the backend code and generated OpenAPI schema.

## Health

- `GET /health`

## Authentication

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

## Public Pharmacy Endpoints

- `GET /api/pharmacies`
- `GET /api/pharmacies/count`
- `GET /api/pharmacies/nearby`
- `GET /api/pharmacies/{pharmacy_id}`

## Gardes

- `GET /api/gardes`

## Medicines

- `GET /api/medicines`
- `GET /api/medicines/count`
- `GET /api/medicines/{code_pct}`

## Admin and Analytics

Admin and analytics routes are mounted through router modules:

- `routers/admin.py`
- `routers/analytics.py`

For the current contract, inspect the OpenAPI docs exposed by FastAPI while the backend is running.

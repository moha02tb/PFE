# Backend Architecture

This document is the backend-specific companion to the main [architecture overview](./overview.md).

## Main Components

- `main.py` - FastAPI bootstrap, middleware, startup migrations, and public endpoints
- `routers/` - grouped route handlers for authentication, administration, and analytics
- `services/` - business logic for auth, pharmacies, medicines, garde schedules, cache, audit, and email
- `models.py` - SQLAlchemy persistence models
- `schemas.py` - Pydantic request and response schemas
- `database.py` - engine, connection pooling, and session dependency
- `schema_migrations.py` - idempotent schema migration path
- `migrations/` - reviewed SQL migration/reference files
- `events/` - internal event bus and listeners

## Runtime Flow

```text
HTTP request
  -> FastAPI route
  -> dependency validation
  -> service layer
  -> SQLAlchemy session
  -> database
```

## Layering

The backend follows a pragmatic layered architecture:

- Routers translate HTTP requests into service calls.
- Dependencies centralize authentication and authorization checks.
- Services contain business rules, validation orchestration, auditing, and persistence operations.
- Models define the database schema and relationships.
- Security helpers centralize password hashing, JWT creation, and token verification.

## Authentication And Authorization

- Admin and mobile-user accounts are stored separately in `administrateurs` and `utilisateurs`.
- Access tokens are short-lived JWTs.
- Refresh tokens are tracked by JTI in the database so logout can revoke sessions.
- Role checks are implemented in `dependencies.py` and `permissions.py`.
- Supported admin roles are `super_admin`, `admin`, and regional `assistant`.
- Regional assistant accounts are constrained by `region_scope`.

## Database And Migrations

- SQLAlchemy is the ORM layer.
- PostgreSQL is the intended production database.
- SQLite remains available for isolated local development and tests.
- `run_schema_migrations(engine)` creates missing tables and applies idempotent migrations.
- Operational indexes support authentication, audit filtering, public search, nearby pharmacy lookup, garde listings, and medicine search.

## Scalability Notes

- Public read endpoints use pagination.
- Redis-backed caching is available through `CacheService` and gracefully degrades to no-op behavior when Redis is unavailable.
- PostgreSQL connection pooling is configured in `database.py`.
- Future production hardening should move long CSV imports to background jobs and consider PostGIS for geospatial search.

## Related Docs

- [API guide](../api/backend-api.md)
- [API reference](../api/api-reference.md)
- [Backend standards](../security/backend-standards.md)
- [Performance notes](../performance/api-timeout-and-connectivity.md)

# Backend Architecture

This file is now a backend-specific companion to the central documentation in `docs/`.

## Main Components

- `main.py` - FastAPI bootstrap, middleware, startup migrations, and public endpoints
- `routers/` - grouped route handlers for auth, admin, and analytics
- `services/` - business logic for auth, pharmacies, medicines, garde, analytics, cache, and email
- `models.py` - SQLAlchemy models
- `schemas.py` - Pydantic request and response schemas
- `database.py` - engine and session configuration
- `migrations/` - SQL migration files
- `events/` - event bus and listeners

## Runtime Flow

```text
HTTP request
  -> FastAPI route
  -> service layer
  -> SQLAlchemy session
  -> database
```

## Key Behavior

- Environment variables are loaded during startup.
- Schema migrations are run on startup through `run_schema_migrations(engine)`.
- Public read endpoints live in `main.py`.
- Authenticated and admin-specific endpoints are defined in router modules.
- Security helpers are centralized in `security.py`.

## Related Docs

- `../docs/backend-api.md`
- `../docs/api-reference.md`
- `../docs/architecture.md`
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_services.py -v

# Run specific test class
pytest tests/test_services.py::TestAuthService -v
```

## Future Extensions

### Phase 2: Performance
- **Database Indexes**: email fields, OSM IDs, governorate
- **Redis Caching**: Pharmacy lists, user profiles
- **Query Optimization**: Eager loading, N+1 prevention

### Phase 3: Event System
- **Event Bus**: Publish/subscribe for major events
- **Notifications**: In-app notifications on login/actions
- **Webhooks**: Admin-registered endpoints for events

### Phase 4: Analytics
- **Metrics**: User growth, activity trends
- **Auditing**: Admin activity reports
- **Monitoring**: Health checks, performance metrics

### Phase 5: Security
- **2FA**: TOTP-based second factor
- **Account Lockout**: After N failed attempts
- **Password Reset**: Email-based flow
- **Session Management**: Inactivity timeout

## Adding New Endpoints

### Step-by-Step Example: Pharmacy Update endpoint

**1. Create Service Method** (services/pharmacy_service.py)
```python
def update_pharmacy(self, pharmacy_id: int, updates: dict) -> Tuple[dict, Optional[str]]:
    pharmacy = self.db.query(models.Pharmacie).filter_by(id=pharmacy_id).first()
    if not pharmacy:
        return None, "Pharmacy not found"
    
    for key, value in updates.items():
        setattr(pharmacy, key, value)
    
    self.db.commit()
    return pharmacy.model_dump(), None
```

**2. Create Request/Response Schema** (schemas.py)
```python
class PharmacieUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    governorate: Optional[str] = None

class PharmacieUpdateResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    governorate: Optional[str]
    updated_at: datetime
```

**3. Add Router** (routers/admin.py)
```python
@router.put("/pharmacies/{id}")
async def update_pharmacy(
    id: int,
    update_data: PharmacieUpdate,
    current_admin = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """Update pharmacy details (admin only)."""
    service = PharmacyService(db)
    result, error = service.update_pharmacy(id, update_data.model_dump(exclude_unset=True))
    
    if error:
        raise HTTPException(status_code=400, detail=error)
    return result
```

**4. Write Tests** (tests/test_endpoints.py)
```python
def test_update_pharmacy(client: TestClient, admin_headers):
    response = client.put(
        "/api/admin/pharmacies/1",
        headers=admin_headers,
        json={"name": "Updated Pharmacy", "phone": "+123"}
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Pharmacy"
```

## Configuration

### Environment Variables (.env)
```
DATABASE_URL=postgresql://postgres:password@localhost/pharmacie_db
SECRET_KEY=your-secret-key-here-min-32-chars
ALGORITHM=HS256
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
DEBUG=False
```

### Database Migrations
```bash
# Apply application migrations
python migrate.py

# Optional: run the reviewed PostgreSQL cleanup scripts manually
psql "$DATABASE_URL" -f migrations/007_postgres_auth_architecture_cleanup.sql
psql "$DATABASE_URL" -f migrations/008_drop_confirmed_legacy_tables.sql
```

`pharmacy_garde` is currently outside the FastAPI ORM and should be kept until
you either integrate it into the backend domain model or archive it explicitly.

## Monitoring & Debugging

### Logging
All services log method calls:
```python
# In development, enable SQL logging
create_engine(..., echo=True)
```

### Common Issues

**Invalid Token Error**
- Verify `SECRET_KEY` matches between services
- Check token expiration: `datetime.now() < token.exp`
- Ensure refresh token wasn't revoked

**Database Lock**
- Ensure all sessions are closed: `db.close()`
- Check for long-running transactions

**CORS Errors**
- Add frontend URL to CORS_ORIGINS in .env
- Verify `Access-Control-Allow-Origin` header

## Summary

This architecture achieves:
- ✅ **Separation of Concerns** - Each layer has single responsibility
- ✅ **Testability** - Services can be tested independently
- ✅ **Maintainability** - Changes isolated to specific layers
- ✅ **Scalability** - Easy to add new features via services
- ✅ **Security** - Centralized auth, audit logging, input validation
- ✅ **Performance** - Transaction safety, query optimization ready

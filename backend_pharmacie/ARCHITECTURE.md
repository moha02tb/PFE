# Backend Architecture Documentation

## Overview

The pharmacy management backend uses a layered architecture designed for scalability, testability, and maintainability.

```
┌─────────────────────────────────────┐
│     FastAPI Application (main.py)   │  (HTTP Server, Routing)
├─────────────────────────────────────┤
│         API Routers                 │  (HTTP Handlers)
│  - routers/auth.py                  │  - Validation, error handling
│  - routers/admin.py                 │  - Response serialization
│  - routers/pharmacy.py (public)     │
├─────────────────────────────────────┤
│      Services Layer                 │  (Business Logic)
│  - AuthService                      │  - Core operations
│  - AdminService                     │  - Rules enforcement
│  - PharmacyService                  │  - Data consistency
│  - AuditService                     │
├─────────────────────────────────────┤
│  Data Access & Validation           │  (ORM & Schema)
│  - models.py (SQLAlchemy)           │  - Database models
│  - schemas.py (Pydantic)            │  - Request/response validation
│  - security.py                      │  - Auth utilities
├─────────────────────────────────────┤
│        PostgreSQL Database          │  (Persistent Storage)
└─────────────────────────────────────┘
```

## Layer Descriptions

### 1. API Routers (routers/)
**Purpose:** HTTP request handling and response serialization

**Responsibilities:**
- Parse incoming HTTP requests
- Call appropriate service methods
- Handle HTTP-specific concerns (status codes, headers, cookies)
- Serialize responses using Pydantic schemas
- Document endpoints with OpenAPI specs (docstrings)

**Key Pattern:** Routers delegate all business logic to services
```python
@router.post("/login")
async def login(credentials: LoginRequest, db: Session):
    auth_service = AuthService(db)
    tokens, error = auth_service.login(credentials, ip_address)
    if error:
        raise HTTPException(status=401, detail=error)
    return tokens
```

### 2. Services Layer (services/)
**Purpose:** Encapsulate business logic independent of HTTP

**Key Classes:**

#### AuthService
- User authentication (admin & regular)
- Token generation and refresh
- Registration and profile updates
- User creation by admins
- Methods return `(result, error)` tuples for clean error handling

#### AdminService
- Admin user management
- Role and active status changes
- Admin-specific business rules

#### PharmacyService
- CSV upload and validation
- Pharmacy CRUD operations
- Nearby pharmacy search (Haversine distance)
- Bulk operations with transaction safety

#### AuditService
- Action logging
- Audit trail queries
- Activity tracking

**Benefits:**
- Testable without HTTP context
- Reusable across multiple routers
- Clear separation of concerns
- Easy to add new features (e.g., background jobs)

### 3. Data Layer (models.py, schemas.py)

#### Models (SQLAlchemy ORM)
```python
class Administrateur(Base):
    id: int (primary key)
    email: str (unique)
    nomUtilisateur: str (unique)
    motDePasse: str (hashed)
    role: str (admin | super_admin)
    is_active: bool
    created_by: int (foreign key to self)
    created_at: datetime
```

6 Core tables:
1. **administrateurs** - Admin users
2. **utilisateurs** - Regular users
3. **pharmacies** - Pharmacy data (OSM-based)
4. **refresh_tokens** - Token revocation tracking
5. **audit_logs** - Activity audit trail
6. **login_attempts** - Failed login tracking

#### Schemas (Pydantic Validation)
- **Request Schemas** - Validate incoming data
  - `LoginRequest` - email, password
  - `RegisterRequest` - email, password, username
  - `AdminCreate` - admin creation (strict validation)
  
- **Response Schemas** - Serialize outgoing data
  - `TokenResponse` - access/refresh tokens
  - `AdminResponse`, `UserResponse` - User data (no passwords)
  - `PharmacieUploadResponse` - Upload results with errors

### 4. Security Layer (security.py)

**Functions:**
- `hash_password()` - Bcrypt password hashing
- `verify_password()` - Password comparison
- `create_access_token()` - JWT generation (15 min)
- `create_refresh_token()` - Long-lived JWT (7 days)
- `verify_token()` - JWT validation and decoding

**Key Constants:**
```python
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7
SECRET_KEY = os.getenv("SECRET_KEY")  # Must be set in .env
```

### 5. Dependency Injection (dependencies.py)

**Key Dependencies:**
```python
async def get_current_account(token: str) -> Union[Administrateur, Utilisateur]:
    """Authenticates and returns current user (admin or regular)"""

def admin_required(user: Union[Administrateur, Utilisateur]):
    """Raises 403 if user is not admin"""
```

**Usage in Routes:**
```python
@router.delete("/pharmacies/{id}")
async def delete(id: int, current_admin = Depends(admin_required)):
    # current_admin is guaranteed to be Administrateur
```

## Request Flow Example: User Login

```
1. HTTP POST /api/auth/login
   ↓
2. FastAPI validates with LoginRequest schema
   ↓
3. Router calls AuthService.login()
   ↓
4. Service performs:
   - Query DB for admin/user by email
   - Verify password
   - Create tokens if valid
   - Log login attempt
   ↓
5. Router handles response:
   - If error: raise HTTPException
   - If token: set HttpOnly cookie, return tokens
   ↓
6. Client receives TokenResponse with tokens
```

## Data Consistency & Transaction Safety

### Transactions
All database operations are lazy-committed:
```python
# All modifications are grouped and committed once
db.add(model1)
db.add(model2)
db.commit()  # Single atomic transaction

# On error: rollback all
try:
    db.add(model)
    db.commit()
except:
    db.rollback()  # Reverts all changes
```

### Audit Logging
Every significant action is logged:
```python
audit_service.log_action(
    action=AuditActionEnum.LOGIN_SUCCESS,
    actor_id=user.id,
    actor_type="utilisateur",
    entity_type="user",
    entity_id=user.id,
    details={"ip": "192.168.1.1", "device": "web"}
)
```

## Testing Strategy

### Test Pyramid
```
     △ (Integration Tests - Few)
    ╱ ╲
   ╱ E2E╲
  ╱───────╲
 △ (Service Tests - Medium)
╱ ╲
╱   ╲ - AuthService, AdminService, etc.
╱─────╲
△ (Unit Tests - Many)
╱ ╲
╱   ╲ - security.py, models.py, etc.
╱─────╲
```

### Test Files
- `test_services.py` - Service layer logic (80+ test cases)
- `test_endpoints.py` - API integration tests
- `test_auth.py` - Authentication workflows
- `test_models.py` - ORM validation
- `test_security.py` - Password hashing, JWT
- `conftest.py` - Shared fixtures

### Running Tests
```bash
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
DATABASE_URL=postgresql://user:password@localhost/pharmacy_db
SECRET_KEY=your-secret-key-here-min-32-chars
ALGORITHM=HS256
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
DEBUG=False
```

### Database Migrations
```bash
# Create new migration
alembic revision --autogenerate -m "Add new table"

# Apply migrations
python migrate.py

# Rollback
alembic downgrade -1
```

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

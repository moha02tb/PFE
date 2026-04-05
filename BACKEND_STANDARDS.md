# Backend Code Standards (Python/FastAPI)

## Overview

Backend code must follow high standards for security, performance, and maintainability since it handles sensitive pharmacy data.

---

## Code Organization

```
backend_pharmacie/
├── main.py                 # Application entry point
├── database.py             # Database connection & session management
├── models.py              # SQLAlchemy ORM models
├── schemas.py             # Pydantic validation schemas
├── security.py            # Authentication & authorization utilities
├── dependencies.py        # FastAPI dependency injection
├── routers/               # API endpoints grouped by domain
│   ├── auth.py
│   ├── admin.py
│   └── [other routers]
├── migrations/            # Database migrations
├── tests/                 # Test suite
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_models.py
│   └── test_api_endpoints.py
└── pyproject.toml        # Configuration for Black, Pylint, Pytest
```

---

## Code Style

### 1. Formatting

All Python code must be formatted with **Black** (line length: 100):

```bash
black backend_pharmacie/
```

**Key rules**:
- 4 spaces for indentation (not tabs)
- Line length max 100 characters
- Two blank lines between top-level functions/classes
- One blank line between methods

### 2. Linting

All code must pass **Pylint** with score ≥ 8.0:

```bash
pylint backend_pharmacie/
```

**Configuration**: See `pyproject.toml`

**Common fixes**:
- Unused imports: Remove them
- Missing docstrings: Add module/function docstrings
- Undefined variables: Check scope or imports
- Line too long: Use Black to fix

### 3. Imports

**Order imports in this sequence**:
1. Standard library imports
2. Third-party imports
3. Local application imports

Use **isort** (configured in `.pre-commit-config.yaml`):
```bash
isort backend_pharmacie/
```

**Example**:
```python
import logging
from datetime import datetime
from typing import Optional

import fastapi
from sqlalchemy import Column, String
from sqlalchemy.orm import Session

from . import schemas
from .database import Base
from .security import hash_password
```

### 4. Type Hints

All functions must have type hints:

```python
def get_user_by_id(session: Session, user_id: int) -> Optional[UserModel]:
    """Retrieve a user by their ID.
    
    Args:
        session: Database session
        user_id: The user's unique identifier
        
    Returns:
        User model if found, None otherwise
    """
    return session.query(UserModel).filter(UserModel.id == user_id).first()
```

---

## Docstring Standards

Every public function, class, and module must have a docstring:

### Module Docstring
```python
"""Database models for user and authentication.

This module defines SQLAlchemy ORM models for managing users,
roles, and authentication credentials in the system.
"""
```

### Function Docstring
```python
def create_user(session: Session, user_data: UserCreate) -> UserModel:
    """Create a new user in the database.
    
    Args:
        session: Database session for ORM operations
        user_data: User creation schema with email and password
        
    Returns:
        Created user model instance
        
    Raises:
        HTTPException: If user email already exists
    """
```

### Class Docstring
```python
class UserModel(Base):
    """SQLAlchemy ORM model for users.
    
    Attributes:
        id: Primary key
        email: Unique email address
        hashed_password: Bcrypt-hashed password
        is_admin: Boolean flag for admin privileges
    """
    __tablename__ = "users"
```

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Classes | PascalCase | `UserModel`, `AuthService` |
| Functions | snake_case | `get_user_by_id()`, `create_pharmacy()` |
| Constants | UPPER_SNAKE_CASE | `MAX_LOGIN_ATTEMPTS`, `DEFAULT_TIMEOUT` |
| Database Tables | snake_case | `users`, `pharmacies`, `admin_logs` |
| Files | snake_case | `models.py`, `auth_service.py` |
| Private Variables | _snake_case | `_internal_state`, `_cache` |

---

## FastAPI Best Practices

### 1. Router Organization

Group endpoints by domain:

```python
# routers/auth.py
from fastapi import APIRouter
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/login")
def login(credentials: LoginSchema, session: Session = Depends(get_db)):
    """Authenticate user with email and password."""
    # Implementation
```

### 2. Response Models

Always use Pydantic schemas for responses:

```python
@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, session: Session = Depends(get_db)):
    """Get user details."""
    user = get_user_by_id(session, user_id)
    return user
```

### 3. Error Handling

Use HTTPException with appropriate status codes:

```python
from fastapi import HTTPException

def get_pharmacy(session: Session, pharmacy_id: int):
    pharmacy = session.query(PharmacyModel).filter(...).first()
    if not pharmacy:
        raise HTTPException(
            status_code=404,
            detail="Pharmacy not found"
        )
    return pharmacy
```

### 4. Security

- Always hash passwords using bcrypt
- Use JWT tokens with expiration
- Validate all inputs with Pydantic schemas
- Check user permissions before returning sensitive data

---

## Testing Standards

See [Phase 5 Testing Enhancement](./IMPLEMENTATION_PLAN.md#phase-5-testing-enhancement)

### Test File Structure

```python
# tests/test_auth.py
import pytest
from sqlalchemy.orm import Session

@pytest.mark.unit
def test_login_success(client, test_user):
    """Test successful user login."""
    response = client.post("/auth/login", json={...})
    assert response.status_code == 200

@pytest.mark.integration
def test_login_with_database(session: Session):
    """Test login flow with actual database."""
    # Test implementation
```

### Minimum Coverage: 60%

Run tests with coverage:
```bash
pytest tests/ --cov=.  --cov-report=html
```

---

## Async/Await

Use async for I/O-bound operations:

```python
@router.get("/async-data")
async def get_async_data():
    """Fetch data asynchronously."""
    result = await external_api.fetch()
    return result
```

---

## Environment Variables

Use `.env` file for configuration:

```bash
# .env
DATABASE_URL=postgresql://user:password@localhost/dbname
SECRET_KEY=your-secret-key-here
DEBUG=False
```

Load with python-dotenv:
```python
from dotenv import load_dotenv
import os

load_dotenv()
database_url = os.getenv("DATABASE_URL")
```

---

## Code Review Checklist (Backend)

- [ ] Code passes `black --check backend_pharmacie/`
- [ ] Code passes `pylint backend_pharmacie/` with score ≥ 8.0
- [ ] All public functions have docstrings with type hints
- [ ] No hardcoded secrets or environment-specific values
- [ ] Errors are handled gracefully with HTTPException
- [ ] Database queries use ORM (no raw SQL unless necessary)
- [ ] Tests cover new functionality (≥ 60% coverage)
- [ ] No debug print statements left in code

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "line too long" | Run `black` formatter |
| "missing docstring" | Add docstring to function/class/module |
| "unused import" | Remove unused import or use it |
| "undefined variable" | Check scope and import source |
| "too many arguments" | Refactor into schema objects |
| "too many local variables" | Extract logic into helper functions |

---

## Performance Considerations

- Use database indexes for frequently queried columns
- Implement pagination for list endpoints
- Cache expensive operations
- Use async for parallelizable I/O operations
- Monitor query performance with database logs

---

## Security Checklist

- [ ] Passwords hashed with bcrypt
- [ ] JWT tokens have expiration
- [ ] Request validation with Pydantic
- [ ] No SQL injection vulnerabilities
- [ ] Rate limiting enabled (slowapi)
- [ ] CORS properly configured
- [ ] Secrets not in code (use .env)

---

For questions, refer to [CODE_STANDARDS.md](./CODE_STANDARDS.md) or [CONTRIBUTING.md](./CONTRIBUTING.md).

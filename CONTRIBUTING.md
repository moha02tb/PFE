# Contributing Guide

Welcome to the pharmacy management system! This guide explains how to contribute to the project.

---

## Table of Contents

- [Setup Your Environment](#setup-your-environment)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Commit & PR Process](#commit--pr-process)
- [Getting Help](#getting-help)

---

## Setup Your Environment

### Prerequisites

- **Python 3.11+** (backend)
- **Node.js 18+** (web admin & mobile)
- **Git**

### Clone the Repository

```bash
git clone <repository-url>
cd PFE
```

### Backend Setup

```bash
cd backend_pharmacie

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install pre-commit hooks
pre-commit install

# Run database migrations (if any)
python migrate.py

# Start development server
uvicorn main:app --reload
```

**Backend runs on**: http://localhost:8000

### Web Admin Setup

```bash
cd admin_pharmacie

# Install dependencies
npm install

# Install pre-commit hooks
pre-commit install

# Start development server
npm run dev
```

**Web admin runs on**: http://localhost:5173

### Mobile Setup

```bash
cd ouerkema-pharmacieconnect-4c94773cce7d

# Install dependencies
npm install

# Install pre-commit hooks
pre-commit install

# Start development server
npm start
```

**Mobile runs on**: Expo Go app on physical device or emulator

---

## Development Workflow

### Create a Feature Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
```

**Branch naming convention**:
- Features: `feature/describe-feature`
- Bug fixes: `fix/describe-bug`
- Refactoring: `refactor/describe-refactor`
- Docs: `docs/describe-change`

### Make Changes

1. Edit code files
2. Pre-commit hooks will auto-format and lint your code
3. If hooks fail, fix the issues and try committing again

### Run Quality Checks Locally

Before committing, ensure your code passes all checks:

**Backend**:
```bash
cd backend_pharmacie

# Format code
black .

# Check linting
pylint routers models schemas

# Run tests
pytest tests/ --cov

# Manual pre-commit check
pre-commit run --all-files
```

**Web Admin**:
```bash
cd admin_pharmacie

# Format code
prettier --write src/

# Check linting
npm run lint

# Pre-commit check
pre-commit run --all-files
```

**Mobile**:
```bash
cd ouerkema-pharmacieconnect-4c94773cce7d

# Format code
prettier --write .

# Check linting
npm run lint

# Run tests
npm test

# Pre-commit check
pre-commit run --all-files
```

### Commit Your Work

Write meaningful commit messages using [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat(auth): add password reset functionality"
```

**Examples**:
- `feat(admin): add user management dashboard`
- `fix(mobile): resolve RTL display on Android`
- `docs(backend): update API documentation`
- `refactor(components): extract pharmacy search into custom hook`
- `test(auth): add login integration tests`
- `perf(api): optimize pharmacy search query`

### Push to GitHub

```bash
git push origin feature/your-feature-name
```

---

## Code Standards

All code must follow project standards before submission:

### Universal Standards
- ✅ Code formatted with `prettier` (frontend) or `black` (backend)
- ✅ Linting passes: `eslint` (frontend) or `pylint` (backend)
- ✅ All functions have docstrings/JSDoc comments
- ✅ Type hints present where applicable
- ✅ No console errors or debug statements

### Detailed Standards

- **Backend**: See [BACKEND_STANDARDS.md](./BACKEND_STANDARDS.md)
- **Frontend**: See [FRONTEND_STANDARDS.md](./FRONTEND_STANDARDS.md)

### Quick Formatting

```bash
# Backend
cd backend_pharmacie && black . && isort .

# Web Admin
cd admin_pharmacie && prettier --write src/

# Mobile
cd ouerkema-pharmacieconnect-4c94773cce7d && prettier --write .
```

---

## Testing

### Backend Testing

Write tests for new features in `backend_pharmacie/tests/`:

```python
# tests/test_auth.py
import pytest
from sqlalchemy.orm import Session

@pytest.mark.unit
def test_user_login_success(client, test_user):
    """Test successful user login."""
    response = client.post(
        "/auth/login",
        json={"email": test_user.email, "password": "password123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

@pytest.mark.integration
def test_login_with_database(session: Session):
    """Test login with database operations."""
    # Test implementation
    pass
```

Run tests:
```bash
cd backend_pharmacie
pytest tests/ -v
pytest tests/ --cov  # With coverage report
```

**Target**: 60%+ code coverage

### Frontend Testing (Mobile)

Write Jest tests for React Native components:

```javascript
// __tests__/PharmacyList.test.js
import { render, screen } from '@testing-library/react-native';
import PharmacyList from '../PharmacyList';

describe('PharmacyList', () => {
  it('renders list of pharmacies', () => {
    const pharmacies = [
      { id: 1, name: 'Pharmacy A' },
      { id: 2, name: 'Pharmacy B' },
    ];
    render(<PharmacyList pharmacies={pharmacies} />);
    expect(screen.getByText('Pharmacy A')).toBeTruthy();
  });
});
```

Run tests:
```bash
npm test
npm run test:coverage
```

### Web Admin Testing

If adding significant features to web admin, consider adding Jest tests.

---

## Commit & PR Process

### Creating a Pull Request

1. Push your branch to GitHub
2. Open a Pull Request (PR) with a descriptive title
3. Fill in the PR template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Refactoring

## Related Issues
Closes #123

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No new warnings generated
```

### Code Review Process

1. **CI/CD Checks**: GitHub Actions will run automated tests
2. **Reviews**: At least 2 reviewers must approve
3. **Feedback**: Address any requested changes
4. **Merge**: Squash and merge to main branch

### Review Checklist for Reviewers

- [ ] Code follows style guidelines
- [ ] Logic is correct and efficient
- [ ] Tests are adequate
- [ ] Documentation is clear
- [ ] No security vulnerabilities
- [ ] Performance impact is acceptable

---

## Deployment

### Staging

After merge to `main`, code is automatically deployed to staging environment.

### Production

Production deployment requires:
1. Tag release: `git tag v1.0.0`
2. Push tag: `git push origin v1.0.0`
3. GitHub Actions triggers production deployment

---

## Useful Commands

### Backend

```bash
# Format code
cd backend_pharmacie
black .
isort .

# Lint
pylint routers models schemas

# Run server
uvicorn main:app --reload

# Database
python migrate.py
python -c "from database import engine; engine.dispose()"  # Reset DB
```

### Web Admin

```bash
cd admin_pharmacie

# Development
npm run dev

# Build
npm run build

# Lint
npm run lint

# Format
prettier --write src/
```

### Mobile

```bash
cd ouerkema-pharmacieconnect-4c94773cce7d

# Start
npm start

# Lint
npm run lint

# Test
npm test

# Build
eas build --platform android
eas build --platform ios
```

---

## Troubleshooting

### Pre-commit Hooks Failing

Pre-commit hooks auto-format code. If they fail:

1. Commit again (auto-formatted code should pass)
2. If still failing, run manual checks:
   - Backend: `pylint backend_pharmacie/`
   - Frontend: `eslint src/ --max-warnings 0`
3. Fix issues manually if needed

### Tests Failing Locally

```bash
# Clear cache
rm -rf pytest_cache
rm -rf node_modules/.cache

# Reinstall dependencies
pip install --upgrade pip
npm ci

# Run tests again
pytest tests/ -v
npm test
```

### Port Already in Use

```bash
# Kill process using port
lsof -i :8000  # Shows what's on port 8000
kill -9 <PID>
```

---

## Getting Help

1. **Documentation**: Check [CODE_STANDARDS.md](./CODE_STANDARDS.md)
2. **Backend**: See [BACKEND_STANDARDS.md](./BACKEND_STANDARDS.md)
3. **Frontend**: See [FRONTEND_STANDARDS.md](./FRONTEND_STANDARDS.md)
4. **Issues**: Open an issue on GitHub
5. **Team**: Ask in the team Slack channel

---

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help teammates when possible
- Report issues professionally
- Celebrate good work!

---

Thank you for contributing! 🎉

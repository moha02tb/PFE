# Code Quality Standards

This document defines the code quality standards for the entire pharmacy management system across backend, web admin, and mobile apps.

## Overview

- **Backend**: FastAPI (Python 3.11)
- **Web Admin**: React 18 + Vite + TailwindCSS
- **Mobile**: React Native + Expo

All code must follow the standards outlined below before submission.

---

## Universal Standards

### 1. Code Formatting

All code must be automatically formatted using:
- **Python**: `black` (line length: 100)
- **JavaScript/TypeScript**: `prettier` (print width: 100)

### 2. Linting

Code must pass linting without errors:
- **Python Backend**: `pylint` (minimum score: 8.0)
- **JavaScript/TypeScript**: `eslint` with React plugins (max warnings: 0)

### 3. File Organization

```
project/
├── src/                      # Source code
├── tests/                    # Test files (mirrors src structure)
├── config/                   # Configuration files
├── docs/                     # Documentation
└── .pre-commit-config.yaml   # Pre-commit hooks
```

### 4. Documentation

Every public function, class, or module must include:
- **Docstring/JSDoc** explaining purpose, parameters, and return values
- **Type hints** for function parameters and returns
- **Comments** for complex logic

### 5. Naming Conventions

| Scope | Convention | Example |
|-------|-----------|---------|
| Python Classes | PascalCase | `UserAuthService` |
| Python Functions | snake_case | `get_user_by_id()` |
| Python Constants | UPPER_SNAKE_CASE | `MAX_RETRIES = 3` |
| JavaScript Classes | PascalCase | `PharmacyCard` |
| JavaScript Functions | camelCase | `fetchPharmacies()` |
| JavaScript Constants | UPPER_SNAKE_CASE or camelCase | `API_BASE_URL`, `maxRetries` |
| React Components | PascalCase | `PharmacyList.jsx` |
| CSS Classes | kebab-case | `pharmacy-card`, `user-header` |

### 6. Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`

**Examples**:
- `feat(auth): add password reset functionality`
- `fix(mobile): resolve RTL display issue on Android`
- `docs(backend): update API documentation`
- `refactor(admin): extract pharmacy search logic into hook`

### 7. Code Review Checklist

Before merging any PR:
- [ ] Code passes linting (`eslint`, `pylint`)
- [ ] Code is formatted (`prettier`, `black`)
- [ ] Tests are added/updated and passing
- [ ] Documentation is updated
- [ ] No console errors or warnings
- [ ] Commit messages follow Conventional Commits
- [ ] 2+ reviewers have approved (for main branch)

---

## Backend Standards (Python)

See [BACKEND_STANDARDS.md](./BACKEND_STANDARDS.md)

---

## Frontend Standards (JavaScript/React)

See [FRONTEND_STANDARDS.md](./FRONTEND_STANDARDS.md)

---

## Tools & Setup

### Installation

```bash
# Backend
cd backend_pharmacie
pip install -r requirements.txt
pip install pre-commit
pre-commit install

# Web Admin
cd admin_pharmacie
npm install
npx pre-commit install

# Mobile
cd ouerkema-pharmacieconnect-4c94773cce7d
npm install
npx pre-commit install
```

### Running Quality Checks Locally

**Backend**:
```bash
cd backend_pharmacie
black --check .
pylint routers models schemas
pytest tests/ --cov
```

**Web Admin**:
```bash
cd admin_pharmacie
prettier --check .
eslint src/
npm run lint
```

**Mobile**:
```bash
cd ouerkema-pharmacieconnect-4c94773cce7d
prettier --check .
eslint .
npm run lint
npm test
```

### Pre-commit Hooks

Pre-commit hooks automatically format and lint code before commits. To run hooks on all files:

```bash
pre-commit run --all-files
```

To skip hooks (not recommended):
```bash
git commit --no-verify
```

---

## Continuous Integration

All code pushed to branches is automatically checked via GitHub Actions:

1. **Linting**: Code must pass linting rules
2. **Formatting**: Code must be properly formatted
3. **Tests**: All tests must pass
4. **Coverage**: Minimum coverage threshold must be met

---

## Questions?

Refer to language-specific standards:
- [Backend Standards](./BACKEND_STANDARDS.md)
- [Frontend Standards](./FRONTEND_STANDARDS.md)
- [Contributing Guide](./CONTRIBUTING.md)

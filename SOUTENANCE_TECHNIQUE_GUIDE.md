# PharmacieConnect - Technical Defense Guide

## 1. One-Minute Project Pitch

PharmacieConnect is a multi-platform pharmacy assistance system.

It has:

- A mobile app for citizens to find pharmacies, pharmacies on duty, medicines, and first-aid help.
- An admin web dashboard for managing pharmacies, garde schedules, medicine CSV imports, analytics, audit logs, and regional assistants.
- A FastAPI backend that centralizes authentication, authorization, data storage, public APIs, admin APIs, caching, audit logging, and migrations.
- A local first-aid RAG chatbot service that answers first-aid questions without external runtime APIs.

The backend is the source of truth. The admin app writes operational data into the backend. The mobile app consumes public and authenticated APIs.

## 2. Global Architecture

```text
Admin Web App                    Mobile App
React + Vite                     Expo React Native
     |                                  |
     | HTTP / JSON                      | HTTP / JSON
     v                                  v
              FastAPI Backend :8000
       auth, pharmacies, gardes, medicines,
       analytics, audit logs, permissions
                       |
                       v
              SQLAlchemy ORM
                       |
                       v
          PostgreSQL in production
          SQLite fallback for local/tests

Mobile Chatbot Screen
     |
     v
First-Aid FastAPI Service :8001
     |
     v
FirstAidRAG + ChromaDB + sentence-transformers
```

## 3. Repository Map

| Path | Role |
| --- | --- |
| `backend_pharmacie/` | Main FastAPI REST API |
| `admin_pharmacie/` | Admin dashboard, React + Vite |
| `mobile/` | Expo React Native mobile app |
| `firstaid-ai/` | First-aid chatbot and RAG pipeline |
| `firstaid_dataset_v2/` | Generated first-aid dataset cache |
| `docs/` | Architecture, API, deployment, testing docs |
| `diagram/` | UML and design diagrams |
| `PFE_Pharmacie_Garde_Teyeb/rapport_pfe/` | LaTeX report |
| `scripts/` | QA, screenshots, dataset scripts |

## 4. Backend Architecture

Main entry file: `backend_pharmacie/main.py`

The backend follows a layered architecture:

```text
HTTP Request
  -> FastAPI route
  -> dependency validation
  -> service layer
  -> SQLAlchemy session
  -> database
```

Important backend folders:

- `routers/`: HTTP endpoints.
- `services/`: business logic.
- `models.py`: SQLAlchemy database tables.
- `schemas.py`: Pydantic validation schemas.
- `dependencies.py`: authentication and role checks.
- `permissions.py`: role permission rules.
- `security.py`: password hashing and JWT functions.
- `schema_migrations.py`: startup migrations and schema normalization.
- `events/`: internal event bus and listeners.

### Backend Startup

When `main.py` loads:

1. Environment variables are loaded.
2. `run_schema_migrations(engine)` normalizes the database schema.
3. FastAPI app is created.
4. Rate limiting middleware is added.
5. CORS and Trusted Host middleware are configured.
6. Routers are registered.
7. Public endpoints for health, gardes, and medicines are exposed.
8. Default event listeners are registered.

## 5. Backend Data Model

Main tables from `models.py`:

| Model | Table | Purpose |
| --- | --- | --- |
| `Administrateur` | `administrateurs` | Admin, super admin, assistant accounts |
| `Utilisateur` | `utilisateurs` | Mobile/public user accounts |
| `Pharmacie` | `pharmacies` | Pharmacy registry |
| `GardeSchedule` | `garde_schedules` | Pharmacies on duty |
| `Medicine` | `medicines` | Medicine catalog |
| `AuditLog` | `audit_logs` | Trace of important actions |
| `RefreshToken` | `refresh_tokens` | Revocable refresh tokens |
| `LoginAttempt` | `login_attempts` | Login tracking and security analytics |
| `SearchEvent` | `search_events` | Public search analytics |

Important point: admin accounts and mobile users are stored in separate tables. This makes roles and access control clearer.

## 6. Authentication And Authorization

Auth files:

- `routers/auth.py`
- `services/auth_service.py`
- `security.py`
- `dependencies.py`
- `permissions.py`

Authentication flow:

1. User sends email/password to `/api/auth/login`.
2. `AuthService.login()` first checks `administrateurs`, then `utilisateurs`.
3. Password is verified with hashed password comparison.
4. Backend creates:
   - short-lived access token
   - long-lived refresh token
5. Refresh token JTI is stored in `refresh_tokens`.
6. Access token is used in `Authorization: Bearer ...`.
7. Refresh token can renew access token through `/api/auth/refresh`.
8. Logout deletes/revokes the refresh token.

Roles:

- `super_admin`: full access.
- `admin`: full operational access.
- `assistant`: regional access only.
- `user`: regular mobile user.

Regional assistant rule:

- Assistant accounts have `region_scope`: `north`, `middle`, or `south`.
- Backend filters pharmacy/garde operations by region scope.

## 7. Main Backend Endpoints

Public endpoints:

- `GET /health`
- `GET /api/pharmacies`
- `GET /api/pharmacies/search`
- `GET /api/pharmacies/nearby`
- `GET /api/pharmacies/count`
- `GET /api/pharmacies/{id}`
- `GET /api/gardes?date_value=YYYY-MM-DD`
- `GET /api/medicines`
- `GET /api/medicines/count`
- `GET /api/medicines/{code_pct}`
- `POST /api/analytics/search-events`

Auth endpoints:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `POST /api/auth/me/password`

Admin endpoints:

- `GET /api/admin/pharmacies`
- `POST /api/admin/pharmacies`
- `PUT /api/admin/pharmacies/{id}`
- `DELETE /api/admin/pharmacies/{id}`
- `POST /api/admin/upload`
- `GET /api/admin/gardes`
- `POST /api/admin/gardes`
- `PUT /api/admin/gardes/{id}`
- `DELETE /api/admin/gardes/{id}`
- `POST /api/admin/gardes/upload`
- `GET /api/admin/medicines`
- `POST /api/admin/medicines/upload`
- `GET /api/admin/analytics/dashboard`
- `GET /api/admin/analytics/activity`
- `GET /api/admin/audit-logs`
- `GET /api/admin/assistants`
- `POST /api/admin/assistants`
- `PATCH /api/admin/assistants/{id}`
- `DELETE /api/admin/assistants/{id}`

## 8. Services Layer

The service layer contains business rules.

| Service | Responsibility |
| --- | --- |
| `AuthService` | login, register, email verification, token refresh, logout, profile update |
| `AdminService` | admin and assistant account management |
| `PharmacyService` | pharmacy CSV import, search, nearby search, CRUD |
| `GardeService` | garde CSV import, public schedules, admin CRUD |
| `MedicineService` | medicine CSV import, medicine search and lookup |
| `AuditService` | audit trail creation and retrieval |
| `CacheService` | Redis JSON cache with graceful fallback |
| `EmailService` | email verification delivery |

Defense sentence:

"The routers only translate HTTP requests into service calls. The real business logic is isolated inside services, which makes the code easier to test and maintain."

## 9. Admin Web App

Main entry file: `admin_pharmacie/src/App.jsx`

Stack:

- React
- Vite
- React Router
- Axios
- Tailwind-style utility classes
- Context providers for auth and language

Important files:

- `src/App.jsx`: route structure.
- `src/context/AuthContext.jsx`: login, logout, current user.
- `src/lib/api.js`: Axios instance, token injection, refresh token handling.
- `src/lib/permissions.js`: frontend role routing.
- `src/pages/`: admin screens.
- `src/components/layout/`: sidebar and top bar.

Admin route protection:

- `/login` is public.
- Dashboard routes are protected by `ProtectedRoute`.
- Some pages require admin roles, for example dashboard, medicines upload, audit logs.
- Assistants can access staff routes, but region-specific backend filtering still protects the data.

Admin pages:

- Dashboard: analytics and overview.
- Pharmacies: pharmacy listing.
- Management: CRUD for pharmacies, gardes, assistants.
- Upload pharmacies: CSV import.
- Upload garde: CSV import.
- Upload medicines: CSV import.
- Calendar: garde planning.
- Map: pharmacy map.
- Emergency: system health / monitoring.
- Audit logs: traceability.
- Settings/profile/language/notifications.

## 10. Mobile App

Main entry file: `mobile/App.js`

Stack:

- Expo React Native
- React Navigation
- Axios/fetch
- i18next translations
- Context providers for auth, theme, language, favorites, filters, notifications, ratings, history

Navigation:

- If not authenticated: login/register/email verification stack.
- If authenticated: bottom tabs.

Main tabs:

- Home
- Map
- Calendar
- Medicines
- Settings

Extra screens:

- Chatbot modal
- Medicine detail screen

API config:

- `mobile/config/api.js`
- Backend port: `8000`
- First-aid chatbot port: `8001`
- Supports environment overrides:
  - `EXPO_PUBLIC_API_URL`
  - `EXPO_PUBLIC_CHATBOT_API_URL`

Mobile data loaders:

- `utils/pharmacyDataLoader.js`: pharmacies, search, nearby, garde, search analytics.
- `utils/medicineDataLoader.js`: medicines and medicine details.
- `utils/chatbotApi.js`: calls first-aid service.

## 11. First-Aid Chatbot

Main API file: `firstaid-ai/api/main.py`

The chatbot is a separate FastAPI service running on port `8001`.

It exposes:

- `GET /health`
- `GET /ready`
- `POST /answer`

How it works:

1. On startup, it loads `FirstAidRAG`.
2. `FirstAidRAG` uses sentence-transformers embeddings and ChromaDB retrieval.
3. Mobile sends a question to `/answer`.
4. The service retrieves relevant first-aid chunks.
5. It adapts the raw RAG output to the mobile response shape:
   - `answer`
   - `confidence`
   - `answer_mode`
   - `topic_prediction`
   - `retrieved_evidence`

Important defense point:

"The first-aid assistant is local at runtime. It does not depend on paid external APIs during usage."

Dataset/evaluation facts:

- Validation examples: 310.
- Test examples: 310.
- Test top-1 topic accuracy: about 95.48%.
- Test top-5 hit rate: about 97.74%.
- Safety violation rate: 0.0.

## 12. Important User Flows

### Flow A: Admin login

```text
Admin enters email/password
  -> admin React app calls POST /api/auth/login
  -> backend AuthService checks administrateurs table
  -> password is verified
  -> access token + refresh token are returned
  -> frontend stores tokens
  -> Axios adds Bearer token to protected requests
```

### Flow B: Admin uploads pharmacies CSV

```text
Admin selects CSV
  -> POST /api/admin/upload
  -> dependency checks admin/staff token
  -> PharmacyService validates file extension and size
  -> CSV is parsed
  -> required columns are checked
  -> rows are inserted or updated
  -> audit log is created
  -> event is published
  -> response returns success/errors/warnings
```

### Flow C: Mobile searches nearby pharmacies

```text
Mobile gets user location
  -> calls GET /api/pharmacies/nearby
  -> backend calculates distance from coordinates
  -> pharmacies are sorted/filtered by distance
  -> mobile displays map markers and pharmacy cards
  -> mobile can record search event for analytics
```

### Flow D: Mobile views pharmacies on duty

```text
Mobile calendar chooses a date
  -> calls GET /api/gardes?date_value=...
  -> backend uses GardeService
  -> cache is checked first
  -> garde schedules are returned
  -> mobile displays the schedule
```

### Flow E: Mobile asks first-aid question

```text
User opens chatbot
  -> mobile calls POST http://host:8001/answer
  -> first-aid API checks RAG readiness
  -> FirstAidRAG retrieves relevant chunks
  -> answer is cleaned and returned
  -> mobile displays answer, confidence, and evidence
```

## 13. Security Points To Mention

- Passwords are hashed, never stored in plain text.
- JWT access tokens are short-lived.
- Refresh tokens are revocable because their JTI is stored in the database.
- Logout revokes refresh token records.
- Backend supports Authorization header and cookies.
- Rate limiting is added through SlowAPI.
- CORS and Trusted Host middleware are configured.
- Role checks are enforced on the backend, not only in the UI.
- Assistant accounts are region-scoped.
- Audit logs track sensitive actions.
- Email verification is required for mobile users.

## 14. Performance And Reliability

- Pagination is used for public and admin list endpoints.
- Redis cache is available through `CacheService`.
- Cache falls back gracefully if Redis is unavailable.
- Public garde and medicine endpoints use cached responses.
- PostgreSQL connection pooling is configured.
- Schema migrations run at startup and are idempotent.
- Tests cover security hardening, schema migrations, medicine upload, garde schedule, audit logs, assistant regions, and analytics.

## 15. How To Run

Backend:

```powershell
cd backend_pharmacie
./start_lan.ps1
```

Admin:

```powershell
cd admin_pharmacie
npm run dev
```

Mobile:

```powershell
cd mobile
npx expo start
```

First-aid API:

```powershell
cd firstaid-ai
./api/start_lan.ps1
```

## 16. Likely Jury Questions

### Why FastAPI?

FastAPI gives automatic API documentation, Pydantic validation, dependency injection, and high performance for Python APIs. It is a good fit for a modular REST backend.

### Why separate admin users and mobile users?

Because they have different responsibilities and security rules. Admins manage operational data, while mobile users consume public services. Separate tables make role checks clearer.

### Where is the business logic?

In `backend_pharmacie/services/`. Routers are thin; services handle validation, CSV parsing, database operations, audit logging, and domain rules.

### How do you protect admin routes?

The frontend uses `ProtectedRoute`, but the real protection is in the backend with JWT verification and dependencies like `admin_required`, `staff_required`, and `super_admin_required`.

### What happens if the access token expires?

The frontend Axios interceptor calls `/api/auth/refresh` with the stored refresh token. If refresh succeeds, the request is retried. If it fails, tokens are cleared and the user is redirected to login.

### How do regional assistants work?

Assistants have a `region_scope`. The backend applies this scope to pharmacy and garde operations so assistants only manage data for their assigned region.

### How does CSV import work?

The admin sends a CSV file. The service validates file type, file size, required columns, row formats, duplicates, and database constraints. It then saves valid rows and returns errors/warnings.

### How does the pharmacy map work?

The mobile/admin app fetches pharmacy data from the backend. For nearby search, the backend computes distances from latitude/longitude and returns sorted results.

### Why is there a separate chatbot service?

Because the first-aid RAG pipeline has different dependencies and runtime behavior from the pharmacy API. Separating it keeps the main backend focused and makes the AI service independently deployable.

### What are the limitations?

- CSV imports are currently synchronous and could be moved to background jobs.
- Geospatial search currently uses coordinate distance calculation; PostGIS would be stronger in production.
- The chatbot is first-aid guidance only and must not replace emergency services or clinicians.
- Redis is optional; when disabled, cache becomes no-op.

## 17. Short Defense Script

"My project is PharmacieConnect, a system for pharmacy access and emergency assistance. It contains a FastAPI backend, a React admin dashboard, an Expo mobile application, and a local first-aid RAG chatbot. The backend is the central source of truth. It exposes public endpoints for pharmacy search, nearby search, garde schedules, medicines, and chatbot-related analytics, and protected admin endpoints for CRUD, CSV imports, assistants, audit logs, and dashboard analytics.

The architecture is layered. Requests enter through routers, authentication and role dependencies validate the user, services execute business logic, and SQLAlchemy persists data into PostgreSQL or SQLite for local tests. Security is based on hashed passwords, JWT access tokens, revocable refresh tokens, role-based authorization, regional assistant scopes, CORS/TrustedHost middleware, rate limiting, and audit logging.

The admin dashboard uses React Router and an Axios client with automatic token refresh. The mobile app uses React Navigation, context providers, and data loaders to consume public APIs. The first-aid assistant is a separate FastAPI service using local RAG retrieval with ChromaDB and sentence-transformers, so it can provide first-aid guidance without external runtime APIs."


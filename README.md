# PharmacieConnect

Monorepo for the PharmacieConnect platform.

## Repository Layout

- `backend_pharmacie/` - FastAPI backend, database migrations, and tests
- `admin_pharmacie/` - React + Vite admin dashboard
- `ouerkema-pharmacieconnect-4c94773cce7d/` - Expo / React Native mobile app
- `docs/` - Maintained project documentation

## Start Here

- Project docs: [docs/README.md](./docs/README.md)
- Getting started: [docs/deployment/getting-started.md](./docs/deployment/getting-started.md)
- Architecture overview: [docs/architecture/overview.md](./docs/architecture/overview.md)
- Backend API guide: [docs/api/backend-api.md](./docs/api/backend-api.md)
- API reference: [docs/api/api-reference.md](./docs/api/api-reference.md)
- Admin web guide: [docs/deployment/admin-web.md](./docs/deployment/admin-web.md)
- Mobile app guide: [docs/deployment/mobile-app.md](./docs/deployment/mobile-app.md)
- Troubleshooting: [docs/deployment/troubleshooting.md](./docs/deployment/troubleshooting.md)

## Documentation

Detailed documentation is organized by topic under `docs/`:

- [Architecture](./docs/architecture/) - system overview, backend architecture, and design system notes
- [API](./docs/api/) - backend API guide and endpoint reference
- [Deployment](./docs/deployment/) - local setup, admin web, mobile app, and troubleshooting
- [Performance](./docs/performance/) - timeout, connectivity, caching, and query optimization notes
- [Security](./docs/security/) - backend security and FastAPI standards
- [Testing](./docs/testing/) - contribution workflow, code standards, frontend standards, and mobile fix logs
- [UML](./docs/uml/) - diagram index and technical diagram reference material

## Development Workflow

### Backend

```bash
cd backend_pharmacie
python -m venv venv
```

PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```

If you prefer not to change the policy in PowerShell, use Command Prompt instead:

```cmd
.\venv\Scripts\activate.bat
```

Then install the backend dependencies:

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

For physical mobile-device testing, the backend must listen on all network
interfaces. On Windows you can also start it with:

```powershell
.\start_lan.ps1
```

### Admin Web

```bash
cd admin_pharmacie
npm install
npm.cmd run dev
```

If you want to use PowerShell's npm wrapper, run this first in the same session:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm run dev
```

### Mobile App

```bash
cd ouerkema-pharmacieconnect-4c94773cce7d
npm install
npm start
```

## Notes

- The backend defaults to SQLite for local development when `DATABASE_URL` is not set.
- Production configuration should always set a strong `SECRET_KEY` and an explicit `DATABASE_URL`.

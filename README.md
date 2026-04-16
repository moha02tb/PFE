# PharmacieConnect

Monorepo for the PharmacieConnect platform.

## Repository Layout

- `backend_pharmacie/` - FastAPI backend, database migrations, and tests
- `admin_pharmacie/` - React + Vite admin dashboard
- `ouerkema-pharmacieconnect-4c94773cce7d/` - Expo / React Native mobile app
- `docs/` - Maintained project documentation

## Start Here

- Project docs: [docs/README.md](./docs/README.md)
- Backend guide: [docs/backend-api.md](./docs/backend-api.md)
- Admin web guide: [docs/admin-web.md](./docs/admin-web.md)
- Mobile app guide: [docs/mobile-app.md](./docs/mobile-app.md)
- Architecture: [docs/architecture.md](./docs/architecture.md)
- Troubleshooting: [docs/troubleshooting.md](./docs/troubleshooting.md)

## Development Workflow

### Backend

```bash
cd backend_pharmacie
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

### Admin Web

```bash
cd admin_pharmacie
npm install
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

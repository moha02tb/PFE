# Getting Started

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm
- Expo Go for mobile device testing

## Backend Setup

```bash
cd backend_pharmacie
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

Default API URL: `http://127.0.0.1:8000`

## Admin Web Setup

```bash
cd admin_pharmacie
npm install
npm run dev
```

Default Vite URL: `http://127.0.0.1:5173`

## Mobile App Setup

```bash
cd ouerkema-pharmacieconnect-4c94773cce7d
npm install
npm start
```

Useful commands:

- `npm run android`
- `npm run ios`
- `npm run web`

## Recommended Startup Order

1. Start `backend_pharmacie`
2. Start `admin_pharmacie`
3. Start `ouerkema-pharmacieconnect-4c94773cce7d`

## Environment Notes

- `backend_pharmacie/.env.example` documents backend environment variables.
- `FRONTEND_URL` should match the admin dashboard origin during local development.
- Mobile API configuration is managed from `ouerkema-pharmacieconnect-4c94773cce7d/config/api.js`.

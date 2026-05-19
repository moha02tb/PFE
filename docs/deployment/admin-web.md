# Admin Web

## Stack

- React 18
- Vite 5
- React Router
- Tailwind CSS

## Commands

```bash
cd admin_pharmacie
npm install
npm.cmd run dev
npm run build
npm run lint
```

If PowerShell blocks `npm`, run this first in the same session and then retry:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm run dev
```

## Structure

- `src/pages/` - dashboard screens
- `src/components/` - layout and UI building blocks
- `src/context/` - auth and language state
- `src/lib/api.js` - backend API integration
- `src/styles/` - styling utilities

## Purpose

The admin app is used for operational workflows such as dashboard analytics, pharmacy data management, uploads, and administrative actions backed by authenticated API calls.

## Local Access

The default Vite URL is `http://127.0.0.1:5173`. For LAN testing, configure Vite to listen on all interfaces and make sure the backend `FRONTEND_URL`, `CORS_ORIGINS`, and `TRUSTED_HOSTS` values include the admin origin.

## Related Docs

- [Getting started](./getting-started.md)
- [Backend API](../api/backend-api.md)
- [Troubleshooting](./troubleshooting.md)

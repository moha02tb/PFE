# Troubleshooting

## Backend Does Not Start

- Verify `venv` is activated
- Verify dependencies are installed from `requirements.txt`
- Check `backend_pharmacie/.env` for a valid `DATABASE_URL` and `SECRET_KEY`

## Admin App Cannot Reach API

- Confirm backend is running on `http://127.0.0.1:8000`
- Confirm `FRONTEND_URL` matches the Vite origin
- Review CORS and trusted host settings in `backend_pharmacie/main.py`

## Mobile App Cannot Reach API

- Check `ouerkema-pharmacieconnect-4c94773cce7d/config/api.js`
- If using a physical device, make sure the API host is reachable from the same network
- Confirm backend CORS and trusted hosts include the development origin when needed

## Authentication Problems

- Ensure `SECRET_KEY` is set consistently for token validation
- Check token expiration settings in backend environment variables
- Review cookie and secure flag behavior in `routers/auth.py`

## Data or Migration Issues

- Review `backend_pharmacie/migrations/`
- Review startup migration logic in `schema_migrations.py`
- Use the backend tests before applying changes that affect schema or upload flows

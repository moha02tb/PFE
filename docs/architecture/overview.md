# Architecture

## Overview

PharmacieConnect is split into three deployable parts:

- A FastAPI backend for authentication, pharmacy data, medicines, analytics, and admin actions
- A React + Vite admin dashboard for operations and content management
- An Expo / React Native mobile app for public pharmacy search and user-facing flows

## High-Level Flow

```text
Mobile App / Admin Web
        |
        v
  FastAPI Backend
        |
        v
 SQLAlchemy Models + Services
        |
        v
 SQLite or PostgreSQL
```

## Backend Structure

- `main.py` boots the FastAPI app, middleware, and public endpoints
- `routers/` contains HTTP route handlers
- `services/` contains business logic
- `models.py` and `schemas.py` define persistence and validation
- `migrations/` contains schema migration SQL files
- `events/` handles internal event dispatch and listeners

## Frontend Structure

### Admin Web

- `src/pages/` route-level pages
- `src/components/` shared UI and layout primitives
- `src/context/` auth and application state
- `src/lib/` API client and utility logic

### Mobile App

- `screens/` user-facing app screens
- `components/` reusable mobile UI
- `config/` API and runtime configuration
- `utils/` data loading and shared helpers
- `locales/` translations

## Data Ownership

- Backend is the source of truth for pharmacies, medicines, authentication, and analytics
- Admin dashboard writes and manages operational data through authenticated endpoints
- Mobile app primarily consumes public endpoints and user authentication flows

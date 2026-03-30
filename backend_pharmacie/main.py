from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

import models
from database import engine, get_db
from routers import auth

# Load environment variables
load_dotenv()

# Initialize the database tables if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PharmacieConnect API",
    version="2.0.0",
    description="Secure pharmacy management API"
)

# ---- SECURITY MIDDLEWARE ----

# 1. Trusted Host Middleware (prevent Host header injection)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[
        "localhost:3000",
        "localhost:5173",
        "localhost:8000",
        "127.0.0.1:3000",
        "127.0.0.1:5173",
        "127.0.0.1:8000",
        "127.0.0.1",
        "localhost",
        "*"  # Allow all in development (don't use in production)
    ] + os.getenv("TRUSTED_HOSTS", "localhost").split(",")
)

# 2. CORS Middleware with strict settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
        "http://localhost",
        "http://127.0.0.1",
        os.getenv("FRONTEND_URL", "http://localhost:5173")
    ],
    allow_credentials=True,  # REQUIRED for cookies
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["X-CSRF-Token"],
    max_age=3600  # Cache preflight requests
)

# ---- REGISTER ROUTERS ----
app.include_router(auth.router)


# ---- HEALTH CHECK ----
@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "2.0.0"}


# ---- LEGACY LOGIN ENDPOINT (DEPRECATED) ----
@app.post("/api/admin/login")
async def legacy_login():
    """Legacy endpoint - use /api/auth/login instead"""
    raise HTTPException(
        status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        detail="Use /api/auth/login endpoint"
    )
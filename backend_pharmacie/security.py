"""Security utilities for authentication and authorization.

Handles password hashing, JWT token generation/verification,
and cryptographic operations.

Configuration:
    SECRET_KEY: JWT signing key (from environment)
    ALGORITHM: JWT algorithm (HS256)
    ACCESS_TOKEN_EXPIRE_MINUTES: Token expiration time
    REFRESH_TOKEN_EXPIRE_DAYS: Refresh token expiration time
"""

import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from passlib.context import CryptContext

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
if (
    not SECRET_KEY
    or len(SECRET_KEY) < 32
    or "change-this" in SECRET_KEY.lower()
    or "your-super-secret" in SECRET_KEY.lower()
):
    raise RuntimeError(
        "SECRET_KEY must be set to a strong secret of at least 32 characters"
    )

ALGORITHM = os.getenv("ALGORITHM", "HS256")
JWT_ISSUER = os.getenv("JWT_ISSUER", "pharmacieconnect-api")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "pharmacieconnect-clients")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))


# ---- PASSWORD OPERATIONS ----
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except ValueError:
        return False


# ---- JWT OPERATIONS ----
def hash_secret(value: str) -> str:
    """Return a keyed hash for short-lived secrets such as email codes."""
    return hmac.new(
        SECRET_KEY.encode("utf-8"),
        value.strip().encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def verify_secret(value: str, hashed_value: str | None) -> bool:
    """Verify a short-lived secret against its keyed hash."""
    if not hashed_value:
        return False
    return secrets.compare_digest(hash_secret(value), hashed_value)


def create_access_token(user_id: int, role: str, entity_type: str) -> str:
    """Create JWT access token (short-lived)"""
    payload = {
        "sub": str(user_id),
        "role": str(role),
        "entity_type": entity_type,
        "type": "access",
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: int, entity_type: str) -> tuple[str, str]:
    """Create JWT refresh token (long-lived)

    Returns:
        tuple: (token, jti) - token string and unique JWT ID
    """
    jti = secrets.token_urlsafe(32)  # Unique token identifier
    payload = {
        "sub": str(user_id),
        "entity_type": entity_type,
        "type": "refresh",
        "jti": jti,
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token, jti


def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """Verify and decode JWT token

    Args:
        token: JWT token string
        token_type: "access" or "refresh"

    Returns:
        dict: Decoded payload if valid, None if invalid/expired
    """
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            issuer=JWT_ISSUER,
            audience=JWT_AUDIENCE,
        )
        if payload.get("type") != token_type:
            return None
        if payload.get("entity_type") not in {"administrateur", "utilisateur"}:
            return None
        return payload
    except (jwt.InvalidTokenError, jwt.DecodeError):
        return None


def decode_token(token: str) -> Optional[dict]:
    """Decode token without verification (for testing)"""
    try:
        return jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            issuer=JWT_ISSUER,
            audience=JWT_AUDIENCE,
        )
    except (jwt.InvalidTokenError, jwt.DecodeError):
        return None

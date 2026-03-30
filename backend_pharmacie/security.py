import os
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from passlib.context import CryptContext
import secrets

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))


# ---- PASSWORD OPERATIONS ----
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


# ---- JWT OPERATIONS ----
def create_access_token(admin_id: int, role: str) -> str:
    """Create JWT access token (short-lived)"""
    payload = {
        "sub": str(admin_id),
        "role": role,
        "type": "access",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(admin_id: int) -> tuple[str, str]:
    """Create JWT refresh token (long-lived)
    
    Returns:
        tuple: (token, jti) - token string and unique JWT ID
    """
    jti = secrets.token_urlsafe(32)  # Unique token identifier
    payload = {
        "sub": str(admin_id),
        "type": "refresh",
        "jti": jti,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
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
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != token_type:
            return None
        return payload
    except jwt.InvalidTokenError:
        return None
    except Exception:
        return None


def decode_token(token: str) -> Optional[dict]:
    """Decode token without verification (for testing)"""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.InvalidTokenError:
        return None
    except Exception:
        return None

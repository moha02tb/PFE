from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum
from sqlalchemy.sql import func
from database import Base
import enum


class RoleEnum(str, enum.Enum):
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
    USER = "user"


class Administrateur(Base):
    __tablename__ = 'administrateur'

    id = Column(Integer, primary_key=True, index=True)
    nomUtilisateur = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    motDePasse = Column(String(255), nullable=False)  # Now stores hashed password
    role = Column(Enum(RoleEnum), default=RoleEnum.USER, nullable=False)
    
    # New fields for security
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class RefreshToken(Base):
    """Store invalidated refresh tokens"""
    __tablename__ = 'refresh_tokens'
    
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, index=True, nullable=False)
    token_jti = Column(String(255), unique=True, index=True, nullable=False)  # JWT ID
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LoginAttempt(Base):
    """Track login attempts for rate limiting"""
    __tablename__ = 'login_attempts'
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), index=True, nullable=False)
    ip_address = Column(String(45), nullable=False)
    success = Column(Boolean, default=False)
    attempted_at = Column(DateTime(timezone=True), server_default=func.now())
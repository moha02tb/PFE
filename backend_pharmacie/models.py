"""SQLAlchemy ORM models for database tables.

Defines data models for Administrateur, Utilisateur, AuditLog, etc.
Includes enums for roles, user sources, and audit actions.

Enums:
    AdminRoleEnum: Admin role types (admin, super_admin)
    SourceEnum: User registration source (self_registered, admin_created, oauth)
    AuditActionEnum: Audit log action types
"""

import enum

from database import Base
from sqlalchemy import BigInteger, Boolean, Column, Date, DateTime, Enum, Float, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.sql import func


def _string_enum(enum_cls: type[enum.Enum], length: int) -> Enum:
    """Store enums as validated VARCHAR values instead of native DB enum types."""
    return Enum(
        enum_cls,
        native_enum=False,
        validate_strings=True,
        values_callable=lambda members: [member.value for member in members],
        length=length,
    )


class AdminRoleEnum(str, enum.Enum):
    """Roles for administrators only"""

    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class SourceEnum(str, enum.Enum):
    """User registration source"""

    SELF_REGISTERED = "self_registered"
    ADMIN_CREATED = "admin_created"
    GOOGLE_OAUTH = "google_oauth"
    APPLE_OAUTH = "apple_oauth"


class AuditActionEnum(str, enum.Enum):
    """Audit log action types"""

    USER_REGISTERED = "user_registered"
    USER_LOGIN = "user_login"
    USER_LOGIN_FAILED = "user_login_failed"
    ADMIN_LOGIN = "admin_login"
    ADMIN_LOGIN_FAILED = "admin_login_failed"
    ADMIN_CREATED = "admin_created"
    ADMIN_UPDATED = "admin_updated"
    USER_UPDATED = "user_updated"
    PASSWORD_CHANGED = "password_changed"
    ACCOUNT_DEACTIVATED = "account_deactivated"
    ACCOUNT_REACTIVATED = "account_reactivated"
    LOGOUT = "logout"
    PHARMACY_BULK_UPLOAD = "pharmacy_bulk_upload"
    GARDE_BULK_UPLOAD = "garde_bulk_upload"
    MEDICINE_BULK_UPLOAD = "medicine_bulk_upload"


class Administrateur(Base):
    """Admin users - separate table for admins only"""

    __tablename__ = "administrateurs"

    id = Column(Integer, primary_key=True, index=True)
    nomUtilisateur = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=True)
    bio = Column(String(500), nullable=True)
    motDePasse = Column(String(255), nullable=False)
    role = Column(_string_enum(AdminRoleEnum, 20), default=AdminRoleEnum.ADMIN, nullable=False)

    is_active = Column(Boolean, default=True, index=True)
    created_by = Column(
        Integer, ForeignKey("administrateurs.id", ondelete="SET NULL"), nullable=True
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Utilisateur(Base):
    """Regular app users - separate table"""

    __tablename__ = "utilisateurs"

    id = Column(Integer, primary_key=True, index=True)
    nomUtilisateur = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=True)
    bio = Column(String(500), nullable=True)
    motDePasse = Column(String(255), nullable=False)

    is_active = Column(Boolean, default=True, index=True)
    email_verified = Column(Boolean, default=False, index=True, nullable=False)
    email_verification_code = Column(String(12), nullable=True, index=True)
    email_verification_sent_at = Column(DateTime(timezone=True), nullable=True)
    email_verification_expires_at = Column(DateTime(timezone=True), nullable=True)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    source = Column(_string_enum(SourceEnum, 50), default=SourceEnum.SELF_REGISTERED, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)


class AuditLog(Base):
    """Complete audit trail for all auth activities"""

    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(_string_enum(AuditActionEnum, 50), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False)  # 'administrateur' or 'utilisateur'
    entity_id = Column(Integer, nullable=False, index=True)

    actor_id = Column(Integer, nullable=True)  # Who performed the action (admin id or user id)
    actor_type = Column(String(50), nullable=True)  # 'administrateur' or 'utilisateur'

    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)

    details = Column(Text, nullable=True)  # JSON blob for additional context
    status = Column(String(20), default="success")  # success, failed, warning

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class RefreshToken(Base):
    """Store refresh tokens for both admins and users"""

    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)

    # Support both admin and user types
    entity_type = Column(String(50), nullable=False)  # 'administrateur' or 'utilisateur'
    entity_id = Column(Integer, nullable=False, index=True)

    token_jti = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LoginAttempt(Base):
    """Track login attempts for rate limiting (both admins and users)"""

    __tablename__ = "login_attempts"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), index=True, nullable=False)
    entity_type = Column(
        String(50), nullable=True
    )  # 'administrateur' or 'utilisateur' (if determined)
    ip_address = Column(String(45), nullable=False, index=True)
    success = Column(Boolean, default=False, index=True)
    attempted_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class Pharmacie(Base):
    """Pharmacy data from OpenStreetMap or bulk uploads"""

    __tablename__ = "pharmacies"

    id = Column(Integer, primary_key=True, index=True)
    osm_type = Column(String(50), default="node", nullable=False)
    osm_id = Column(BigInteger, unique=True, nullable=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    address = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=True)
    governorate = Column(String(100), nullable=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_by = Column(
        Integer, ForeignKey("administrateurs.id"), nullable=False, index=True
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class GardeSchedule(Base):
    """Uploaded garde planning rows persisted by the admin panel."""

    __tablename__ = "garde_schedules"
    __table_args__ = (
        UniqueConstraint(
            "date",
            "pharmacy_name",
            "start_time",
            "end_time",
            name="uq_garde_schedule_slot",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    pharmacy_name = Column(String(255), nullable=False, index=True)
    start_time = Column(String(20), nullable=False)
    end_time = Column(String(20), nullable=False)
    city = Column(String(120), nullable=True, index=True)
    governorate = Column(String(120), nullable=True, index=True)
    shift_type = Column(String(60), nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(
        Integer, ForeignKey("administrateurs.id"), nullable=False, index=True
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class SearchEvent(Base):
    """Track public search activity for admin analytics."""

    __tablename__ = "search_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    query_text = Column(String(255), nullable=True, index=True)
    location_label = Column(String(255), nullable=True, index=True)
    governorate = Column(String(100), nullable=True, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    result_count = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class Medicine(Base):
    """Central medicine catalog imported from admin CSV uploads."""

    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    code_pct = Column(String(50), nullable=False, unique=True, index=True)
    nom_commercial = Column(String(255), nullable=False, index=True)
    prix_public_dt = Column(Numeric(10, 3), nullable=False)
    tarif_reference_dt = Column(Numeric(10, 3), nullable=False)
    categorie_remboursement = Column(String(20), nullable=False, index=True)
    dci = Column(String(255), nullable=False, index=True)
    ap = Column(String(20), nullable=False, index=True)
    created_by = Column(
        Integer, ForeignKey("administrateurs.id"), nullable=False, index=True
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

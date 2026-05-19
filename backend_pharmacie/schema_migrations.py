"""Idempotent database schema migrations for the backend.

This module replaces the previous mix of destructive SQL files and ad hoc
startup ALTER TABLE logic with a single code path that works for SQLite and
PostgreSQL.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

import models
from sqlalchemy import inspect, text
from sqlalchemy.engine import Connection, Engine


@dataclass(frozen=True)
class Migration:
    version: str
    description: str
    apply: Callable[[Connection], None]


def run_schema_migrations(engine: Engine) -> list[str]:
    """Create missing tables and apply pending schema migrations."""
    models.Base.metadata.create_all(bind=engine)
    _ensure_schema_migrations_table(engine)

    applied_versions = _get_applied_versions(engine)
    applied_now: list[str] = []

    for migration in MIGRATIONS:
        if migration.version in applied_versions:
            continue

        with engine.begin() as connection:
            migration.apply(connection)
            connection.execute(
                text(
                    """
                    INSERT INTO schema_migrations (version, description, applied_at)
                    VALUES (:version, :description, CURRENT_TIMESTAMP)
                    """
                ),
                {"version": migration.version, "description": migration.description},
            )
        applied_now.append(migration.version)

    return applied_now


def _ensure_schema_migrations_table(engine: Engine) -> None:
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version VARCHAR(64) PRIMARY KEY,
                    description VARCHAR(255) NOT NULL,
                    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )


def _get_applied_versions(engine: Engine) -> set[str]:
    inspector = inspect(engine)
    if "schema_migrations" not in inspector.get_table_names():
        return set()

    with engine.connect() as connection:
        rows = connection.execute(text("SELECT version FROM schema_migrations")).fetchall()
    return {row[0] for row in rows}


def _normalize_user_verification_schema(connection: Connection) -> None:
    inspector = inspect(connection)
    if "utilisateurs" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"] for column in inspector.get_columns("utilisateurs")
    }

    if (
        "email_verification_code_expires_at" in existing_columns
        and "email_verification_expires_at" not in existing_columns
    ):
        connection.execute(
            text(
                "ALTER TABLE utilisateurs "
                "RENAME COLUMN email_verification_code_expires_at TO "
                "email_verification_expires_at"
            )
        )
        existing_columns.remove("email_verification_code_expires_at")
        existing_columns.add("email_verification_expires_at")

    if "email_verified" not in existing_columns:
        connection.execute(
            text(
                "ALTER TABLE utilisateurs "
                "ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT 1"
            )
        )
    if "email_verification_code" not in existing_columns:
        connection.execute(
            text(
                "ALTER TABLE utilisateurs "
                "ADD COLUMN email_verification_code VARCHAR(128)"
            )
        )
    elif connection.dialect.name == "postgresql":
        connection.execute(
            text(
                "ALTER TABLE utilisateurs "
                "ALTER COLUMN email_verification_code TYPE VARCHAR(128)"
            )
        )
    if "email_verification_failed_attempts" not in existing_columns:
        connection.execute(
            text(
                "ALTER TABLE utilisateurs "
                "ADD COLUMN email_verification_failed_attempts INTEGER NOT NULL DEFAULT 0"
            )
        )
    if "email_verification_sent_at" not in existing_columns:
        connection.execute(
            text(
                "ALTER TABLE utilisateurs "
                "ADD COLUMN email_verification_sent_at TIMESTAMP WITH TIME ZONE"
            )
        )
    if "email_verification_expires_at" not in existing_columns:
        connection.execute(
            text(
                "ALTER TABLE utilisateurs "
                "ADD COLUMN email_verification_expires_at TIMESTAMP WITH TIME ZONE"
            )
        )
    if "email_verified_at" not in existing_columns:
        connection.execute(
            text(
                "ALTER TABLE utilisateurs "
                "ADD COLUMN email_verified_at TIMESTAMP WITH TIME ZONE"
            )
        )

    if "email_verification_token" in existing_columns:
        if connection.dialect.name == "sqlite":
            _rebuild_utilisateurs_for_sqlite(connection)

    connection.execute(
        text(
            "CREATE INDEX IF NOT EXISTS ix_utilisateurs_email_verification_code "
            "ON utilisateurs (email_verification_code)"
        )
    )
    connection.execute(
        text(
            "UPDATE utilisateurs "
            "SET email_verified = TRUE "
            "WHERE email_verification_code IS NULL AND email_verified = FALSE"
        )
    )


def _backfill_admins_from_legacy_tables(connection: Connection) -> None:
    """Copy missing admin accounts from pre-split tables into administrateurs."""
    inspector = inspect(connection)
    table_names = set(inspector.get_table_names())
    if "administrateurs" not in table_names:
        return

    for source_table in ("administrateur", "administrateur_backup"):
        if source_table not in table_names:
            continue
        _insert_missing_admins_from_source(connection, source_table)


def _insert_missing_admins_from_source(connection: Connection, source_table: str) -> None:
    source_columns = {
        column["name"] for column in inspect(connection).get_columns(source_table)
    }

    phone_expr = 'src.phone' if "phone" in source_columns else "NULL"
    bio_expr = 'src.bio' if "bio" in source_columns else "NULL"
    active_expr = "COALESCE(src.is_active, TRUE)" if "is_active" in source_columns else "TRUE"
    created_at_expr = (
        "COALESCE(src.created_at, CURRENT_TIMESTAMP)"
        if "created_at" in source_columns
        else "CURRENT_TIMESTAMP"
    )
    updated_at_expr = "src.updated_at" if "updated_at" in source_columns else "NULL"

    connection.execute(
        text(
            f"""
            INSERT INTO administrateurs (
                "nomUtilisateur",
                email,
                "motDePasse",
                role,
                is_active,
                created_by,
                created_at,
                updated_at,
                phone,
                bio
            )
            SELECT
                src."nomUtilisateur",
                src.email,
                src."motDePasse",
                CASE
                    WHEN lower(src.role) = 'super_admin' THEN 'super_admin'
                    ELSE 'admin'
                END,
                {active_expr},
                NULL,
                {created_at_expr},
                {updated_at_expr},
                {phone_expr},
                {bio_expr}
            FROM {source_table} AS src
            WHERE lower(src.role) IN ('admin', 'super_admin')
              AND NOT EXISTS (
                  SELECT 1
                  FROM administrateurs AS dst
                  WHERE dst.email = src.email
                     OR dst."nomUtilisateur" = src."nomUtilisateur"
              )
            """
        )
    )


def _rebuild_utilisateurs_for_sqlite(connection: Connection) -> None:
    """Drop legacy columns from SQLite by rebuilding the table."""
    connection.execute(text("DROP TABLE IF EXISTS utilisateurs__new"))
    connection.execute(
        text(
            """
            CREATE TABLE utilisateurs__new (
                id INTEGER NOT NULL PRIMARY KEY,
                "nomUtilisateur" VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                phone VARCHAR(30),
                bio VARCHAR(500),
                "motDePasse" VARCHAR(255) NOT NULL,
                is_active BOOLEAN,
                email_verified BOOLEAN NOT NULL DEFAULT 0,
                email_verification_code VARCHAR(128),
                email_verification_failed_attempts INTEGER NOT NULL DEFAULT 0,
                email_verification_sent_at DATETIME,
                email_verification_expires_at DATETIME,
                email_verified_at DATETIME,
                source VARCHAR(15) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME,
                last_login DATETIME
            )
            """
        )
    )
    connection.execute(
        text(
            """
            INSERT INTO utilisateurs__new (
                id,
                "nomUtilisateur",
                email,
                phone,
                bio,
                "motDePasse",
                is_active,
                email_verified,
                email_verification_code,
                email_verification_failed_attempts,
                email_verification_sent_at,
                email_verification_expires_at,
                email_verified_at,
                source,
                created_at,
                updated_at,
                last_login
            )
            SELECT
                id,
                "nomUtilisateur",
                email,
                phone,
                bio,
                "motDePasse",
                is_active,
                email_verified,
                email_verification_code,
                COALESCE(email_verification_failed_attempts, 0),
                email_verification_sent_at,
                email_verification_expires_at,
                email_verified_at,
                source,
                created_at,
                updated_at,
                last_login
            FROM utilisateurs
            """
        )
    )
    connection.execute(text("DROP TABLE utilisateurs"))
    connection.execute(text("ALTER TABLE utilisateurs__new RENAME TO utilisateurs"))
    connection.execute(
        text(
            'CREATE UNIQUE INDEX IF NOT EXISTS ix_utilisateurs_nomUtilisateur '
            'ON utilisateurs ("nomUtilisateur")'
        )
    )
    connection.execute(
        text("CREATE UNIQUE INDEX IF NOT EXISTS ix_utilisateurs_email ON utilisateurs (email)")
    )
    connection.execute(
        text("CREATE INDEX IF NOT EXISTS ix_utilisateurs_id ON utilisateurs (id)")
    )
    connection.execute(
        text(
            "CREATE INDEX IF NOT EXISTS ix_utilisateurs_is_active "
            "ON utilisateurs (is_active)"
        )
    )
    connection.execute(
        text(
            "CREATE INDEX IF NOT EXISTS ix_utilisateurs_created_at "
            "ON utilisateurs (created_at)"
        )
    )


def _create_query_indexes(connection: Connection) -> None:
    """Add composite indexes used by analytics and security queries."""
    statements = [
        (
            "idx_audit_logs_actor_action",
            "CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_action "
            "ON audit_logs (actor_id, action)",
        ),
        (
            "idx_audit_logs_entity_action",
            "CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_action "
            "ON audit_logs (entity_type, action)",
        ),
        (
            "idx_login_attempts_email_attempted_at",
            "CREATE INDEX IF NOT EXISTS idx_login_attempts_email_attempted_at "
            "ON login_attempts (email, attempted_at DESC)",
        ),
    ]

    inspector = inspect(connection)
    table_names = set(inspector.get_table_names())

    for index_name, statement in statements:
        if index_name.startswith("idx_audit_logs") and "audit_logs" not in table_names:
            continue
        if index_name.startswith("idx_login_attempts") and "login_attempts" not in table_names:
            continue
        connection.execute(text(statement))


def _add_search_event_indexes(connection: Connection) -> None:
    """Add indexes for public search analytics queries."""
    if "search_events" not in set(inspect(connection).get_table_names()):
        return

    statements = [
        "CREATE INDEX IF NOT EXISTS idx_search_events_type_created_at "
        "ON search_events (event_type, created_at DESC)",
        "CREATE INDEX IF NOT EXISTS idx_search_events_governorate_created_at "
        "ON search_events (governorate, created_at DESC)",
        "CREATE INDEX IF NOT EXISTS idx_search_events_location_label_created_at "
        "ON search_events (location_label, created_at DESC)",
    ]

    for statement in statements:
        connection.execute(text(statement))


def _add_medicine_indexes(connection: Connection) -> None:
    """Add indexes supporting medicine search and admin list queries."""
    if "medicines" not in set(inspect(connection).get_table_names()):
        return

    statements = [
        "CREATE INDEX IF NOT EXISTS idx_medicines_nom_commercial ON medicines (nom_commercial)",
        "CREATE INDEX IF NOT EXISTS idx_medicines_dci ON medicines (dci)",
        "CREATE INDEX IF NOT EXISTS idx_medicines_code_pct ON medicines (code_pct)",
        "CREATE INDEX IF NOT EXISTS idx_medicines_created_at ON medicines (created_at DESC)",
    ]

    for statement in statements:
        connection.execute(text(statement))


def _add_pharmacy_location_indexes(connection: Connection) -> None:
    """Add indexes supporting nearby pharmacy queries."""
    if "pharmacies" not in set(inspect(connection).get_table_names()):
        return

    statements = [
        "CREATE INDEX IF NOT EXISTS idx_pharmacies_latitude_longitude ON pharmacies (latitude, longitude)",
        "CREATE INDEX IF NOT EXISTS idx_pharmacies_governorate ON pharmacies (governorate)",
        "CREATE INDEX IF NOT EXISTS idx_pharmacies_name_governorate ON pharmacies (name, governorate)",
    ]

    for statement in statements:
        connection.execute(text(statement))


def _add_admin_region_scope(connection: Connection) -> None:
    """Add optional regional scope for assistant administrator accounts."""
    inspector = inspect(connection)
    if "administrateurs" not in set(inspector.get_table_names()):
        return

    existing_columns = {
        column["name"] for column in inspector.get_columns("administrateurs")
    }
    if "region_scope" not in existing_columns:
        connection.execute(
            text("ALTER TABLE administrateurs ADD COLUMN region_scope VARCHAR(20)")
        )

    connection.execute(
        text(
            "CREATE INDEX IF NOT EXISTS ix_administrateurs_region_scope "
            "ON administrateurs (region_scope)"
        )
    )


def _sync_postgres_id_sequences(connection: Connection) -> None:
    """Move PostgreSQL SERIAL/IDENTITY sequences past existing primary keys.

    Some legacy migration paths inserted explicit IDs. PostgreSQL sequences do
    not automatically advance when explicit IDs are inserted, so the next insert
    can try to reuse an existing primary key.
    """
    if connection.dialect.name != "postgresql":
        return

    table_names = set(inspect(connection).get_table_names())
    sequence_tables = [
        "administrateurs",
        "utilisateurs",
        "audit_logs",
        "refresh_tokens",
        "login_attempts",
        "pharmacies",
        "garde_schedules",
        "search_events",
        "medicines",
    ]

    for table_name in sequence_tables:
        if table_name not in table_names:
            continue

        connection.execute(
            text(
                f"""
                SELECT setval(
                    pg_get_serial_sequence('{table_name}', 'id'),
                    COALESCE((SELECT MAX(id) FROM {table_name}), 1),
                    (SELECT COUNT(*) FROM {table_name}) > 0
                )
                """
            )
        )


def _harden_assistant_admin_schema(connection: Connection) -> None:
    """Add assistant account integrity helpers without rewriting existing tables."""
    inspector = inspect(connection)
    if "administrateurs" not in set(inspector.get_table_names()):
        return

    existing_columns = {
        column["name"] for column in inspector.get_columns("administrateurs")
    }
    if "last_login" not in existing_columns:
        connection.execute(
            text("ALTER TABLE administrateurs ADD COLUMN last_login TIMESTAMP WITH TIME ZONE")
        )

    connection.execute(
        text(
            "CREATE INDEX IF NOT EXISTS ix_administrateurs_last_login "
            "ON administrateurs (last_login)"
        )
    )
    connection.execute(
        text(
            "UPDATE administrateurs SET region_scope = NULL "
            "WHERE lower(role) <> 'assistant' AND region_scope IS NOT NULL"
        )
    )

    if connection.dialect.name != "postgresql":
        return

    connection.execute(
        text(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'ck_administrateurs_assistant_region_scope'
                ) THEN
                    ALTER TABLE administrateurs
                    ADD CONSTRAINT ck_administrateurs_assistant_region_scope
                    CHECK (
                        (
                            role = 'assistant'
                            AND region_scope IN ('north', 'middle', 'south')
                        )
                        OR (
                            role <> 'assistant'
                            AND region_scope IS NULL
                        )
                    ) NOT VALID;
                END IF;
            END $$;
            """
        )
    )


def _add_operational_composite_indexes(connection: Connection) -> None:
    """Add composite indexes matching high-frequency list/count query shapes."""
    table_names = set(inspect(connection).get_table_names())
    statements = []

    if "audit_logs" in table_names:
        statements.extend(
            [
                "CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc "
                "ON audit_logs (created_at DESC)",
                "CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created_at "
                "ON audit_logs (action, created_at DESC)",
                "CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_created_at "
                "ON audit_logs (entity_type, created_at DESC)",
            ]
        )
    if "login_attempts" in table_names:
        statements.append(
            "CREATE INDEX IF NOT EXISTS idx_login_attempts_success_attempted_at "
            "ON login_attempts (success, attempted_at DESC)"
        )
    if "pharmacies" in table_names:
        statements.extend(
            [
                "CREATE INDEX IF NOT EXISTS idx_pharmacies_created_at_desc "
                "ON pharmacies (created_at DESC)",
                "CREATE INDEX IF NOT EXISTS idx_pharmacies_governorate_created_at "
                "ON pharmacies (governorate, created_at DESC)",
            ]
        )
    if "garde_schedules" in table_names:
        statements.extend(
            [
                "CREATE INDEX IF NOT EXISTS idx_garde_schedules_date_start_created "
                "ON garde_schedules (date, start_time, created_at DESC)",
                "CREATE INDEX IF NOT EXISTS idx_garde_schedules_governorate_date "
                "ON garde_schedules (governorate, date DESC)",
            ]
        )
    if "medicines" in table_names:
        statements.append(
            "CREATE INDEX IF NOT EXISTS idx_medicines_name_code "
            "ON medicines (nom_commercial, code_pct)"
        )

    for statement in statements:
        connection.execute(text(statement))


MIGRATIONS = [
    Migration(
        version="2026_04_13_001_normalize_utilisateurs_verification",
        description="Normalize verification columns across existing user tables",
        apply=_normalize_user_verification_schema,
    ),
    Migration(
        version="2026_04_13_002_add_query_indexes",
        description="Add composite indexes for analytics and security queries",
        apply=_create_query_indexes,
    ),
    Migration(
        version="2026_04_13_003_backfill_admins_from_legacy_tables",
        description="Copy missing admin accounts from legacy tables into administrateurs",
        apply=_backfill_admins_from_legacy_tables,
    ),
    Migration(
        version="2026_04_13_004_add_search_event_indexes",
        description="Add indexes for search event analytics queries",
        apply=_add_search_event_indexes,
    ),
    Migration(
        version="2026_04_14_005_add_medicine_indexes",
        description="Add indexes for medicine catalog search queries",
        apply=_add_medicine_indexes,
    ),
    Migration(
        version="2026_05_08_006_add_admin_region_scope",
        description="Add regional scope for assistant administrator accounts",
        apply=_add_admin_region_scope,
    ),
    Migration(
        version="2026_05_08_007_sync_postgres_id_sequences",
        description="Synchronize PostgreSQL id sequences after explicit-id imports",
        apply=_sync_postgres_id_sequences,
    ),
    Migration(
        version="2026_05_09_008_harden_assistant_admin_schema",
        description="Add assistant account integrity constraints and last-login tracking",
        apply=_harden_assistant_admin_schema,
    ),
    Migration(
        version="2026_05_18_009_add_pharmacies_location_indexes",
        description="Add indexes for nearby pharmacy searches",
        apply=_add_pharmacy_location_indexes,
    ),
    Migration(
        version="2026_05_19_010_add_operational_composite_indexes",
        description="Add composite indexes for list, count, and dashboard query patterns",
        apply=_add_operational_composite_indexes,
    ),
]

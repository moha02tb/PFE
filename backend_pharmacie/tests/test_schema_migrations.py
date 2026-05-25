from sqlalchemy import create_engine, inspect, text

from schema_migrations import run_schema_migrations


def test_repair_migration_adds_missing_user_verification_attempts_column():
    engine = create_engine("sqlite:///:memory:")

    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE utilisateurs (
                    id INTEGER NOT NULL PRIMARY KEY,
                    "nomUtilisateur" VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    "motDePasse" VARCHAR(255) NOT NULL,
                    is_active BOOLEAN,
                    email_verified BOOLEAN NOT NULL DEFAULT 1,
                    email_verification_code VARCHAR(128),
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
                CREATE TABLE schema_migrations (
                    version VARCHAR(64) PRIMARY KEY,
                    description VARCHAR(255) NOT NULL,
                    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )
        connection.execute(
            text(
                """
                INSERT INTO schema_migrations (version, description)
                VALUES (
                    '2026_04_13_001_normalize_utilisateurs_verification',
                    'old applied migration without failed-attempts column'
                )
                """
            )
        )

    run_schema_migrations(engine)

    columns = {column["name"] for column in inspect(engine).get_columns("utilisateurs")}
    assert "email_verification_failed_attempts" in columns

#!/usr/bin/env python3
"""Run idempotent schema migrations and legacy password cleanup."""

from __future__ import annotations

import sys

from dotenv import load_dotenv

load_dotenv()

import models
from database import SessionLocal, SQLALCHEMY_DATABASE_URL, engine
from schema_migrations import run_schema_migrations
from security import hash_password


def _hash_legacy_passwords() -> dict[str, int]:
    """Hash any legacy plain-text passwords that are still stored in the DB."""
    session = SessionLocal()
    counters = {"administrateurs": 0, "utilisateurs": 0}

    try:
        for admin in session.query(models.Administrateur).all():
            if not admin.motDePasse.startswith("$2"):
                admin.motDePasse = hash_password(admin.motDePasse)
                counters["administrateurs"] += 1

        for user in session.query(models.Utilisateur).all():
            if not user.motDePasse.startswith("$2"):
                user.motDePasse = hash_password(user.motDePasse)
                counters["utilisateurs"] += 1

        session.commit()
        return counters
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def _table_count(model) -> int:
    session = SessionLocal()
    try:
        return session.query(model).count()
    finally:
        session.close()


def run_migration() -> bool:
    """Apply schema migrations and print a short summary."""
    print("=" * 60)
    print("DATABASE MIGRATION")
    print("=" * 60)
    print(f"Database URL: {SQLALCHEMY_DATABASE_URL}")

    try:
        applied = run_schema_migrations(engine)
        password_updates = _hash_legacy_passwords()

        print("\nApplied schema migrations:")
        if applied:
            for version in applied:
                print(f"  - {version}")
        else:
            print("  - none")

        print("\nLegacy password updates:")
        print(f"  - administrateurs: {password_updates['administrateurs']}")
        print(f"  - utilisateurs: {password_updates['utilisateurs']}")

        print("\nCurrent table counts:")
        print(f"  - administrateurs: {_table_count(models.Administrateur)}")
        print(f"  - utilisateurs: {_table_count(models.Utilisateur)}")
        print(f"  - pharmacies: {_table_count(models.Pharmacie)}")
        print(f"  - audit_logs: {_table_count(models.AuditLog)}")
        print(f"  - login_attempts: {_table_count(models.LoginAttempt)}")
        print(f"  - refresh_tokens: {_table_count(models.RefreshToken)}")
    except Exception as exc:
        print(f"\nMigration failed: {exc}")
        return False

    print("\nMigration completed successfully.")
    return True


if __name__ == "__main__":
    sys.exit(0 if run_migration() else 1)

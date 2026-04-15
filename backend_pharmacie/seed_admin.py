#!/usr/bin/env python3
"""Bootstrap the first administrator account for a fresh environment."""

from __future__ import annotations

import argparse
import os
import sys
from typing import Optional

from dotenv import load_dotenv
from sqlalchemy.orm import Session

import models
from database import SessionLocal, SQLALCHEMY_DATABASE_URL
from security import hash_password

load_dotenv()


def seed_admin(
    db: Session,
    *,
    email: str,
    username: str,
    password: str,
    role: str = "super_admin",
    phone: Optional[str] = None,
) -> tuple[models.Administrateur, bool]:
    """Create the bootstrap admin if it does not exist."""
    normalized_role = role.strip().lower()
    if normalized_role not in {
        models.AdminRoleEnum.ADMIN.value,
        models.AdminRoleEnum.SUPER_ADMIN.value,
    }:
        raise ValueError("role must be 'admin' or 'super_admin'")

    existing_by_email = (
        db.query(models.Administrateur)
        .filter(models.Administrateur.email == email)
        .first()
    )
    existing_by_username = (
        db.query(models.Administrateur)
        .filter(models.Administrateur.nomUtilisateur == username)
        .first()
    )

    if (
        existing_by_email
        and existing_by_username
        and existing_by_email.id != existing_by_username.id
    ):
        raise ValueError("email and username are already used by different admin accounts")

    existing_admin = existing_by_email or existing_by_username
    if existing_admin:
        return existing_admin, False

    admin = models.Administrateur(
        nomUtilisateur=username,
        email=email,
        phone=phone,
        motDePasse=hash_password(password),
        role=normalized_role,
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin, True


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Create the initial administrator account.")
    parser.add_argument("--email", default=os.getenv("SEED_ADMIN_EMAIL"))
    parser.add_argument("--username", default=os.getenv("SEED_ADMIN_USERNAME"))
    parser.add_argument("--password", default=os.getenv("SEED_ADMIN_PASSWORD"))
    parser.add_argument("--role", default=os.getenv("SEED_ADMIN_ROLE", "super_admin"))
    parser.add_argument("--phone", default=os.getenv("SEED_ADMIN_PHONE"))
    return parser


def main() -> int:
    parser = _build_parser()
    args = parser.parse_args()

    missing = [
        field
        for field, value in {
            "--email": args.email,
            "--username": args.username,
            "--password": args.password,
        }.items()
        if not value
    ]
    if missing:
        parser.error(f"missing required values: {', '.join(missing)}")

    db = SessionLocal()
    try:
        admin, created = seed_admin(
            db,
            email=args.email,
            username=args.username,
            password=args.password,
            role=args.role,
            phone=args.phone,
        )
    except Exception as exc:
        db.rollback()
        print(f"Failed to seed admin: {exc}")
        return 1
    finally:
        db.close()

    print("=" * 60)
    print("ADMIN BOOTSTRAP")
    print("=" * 60)
    print(f"Database URL: {SQLALCHEMY_DATABASE_URL}")
    print(f"Admin ID: {admin.id}")
    print(f"Email: {admin.email}")
    print(f"Username: {admin.nomUtilisateur}")
    print(f"Role: {admin.role}")
    print("Status: created" if created else "Status: already exists")
    return 0


if __name__ == "__main__":
    sys.exit(main())

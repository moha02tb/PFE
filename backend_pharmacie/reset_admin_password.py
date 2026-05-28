#!/usr/bin/env python3
"""Reset admin password to a known local development value."""

import sys
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent))
load_dotenv()

from database import SessionLocal
from models import Administrateur
from security import hash_password


def main() -> int:
    db = SessionLocal()
    try:
        admin = (
            db.query(Administrateur)
            .filter(Administrateur.email == "admin@pharmacie.com")
            .first()
        )

        if not admin:
            print("Admin user not found!")
            return 1

        print(f"Found admin: {admin.nomUtilisateur} ({admin.email})")
        print(f"  Active: {admin.is_active}")
        print(f"  Role: {admin.role}")

        new_password = "Admin@123"
        admin.motDePasse = hash_password(new_password)
        db.add(admin)
        db.commit()

        print("\nPassword reset successfully!")
        print(f"  New password: {new_password}")
        print("\nYou can now login with:")
        print("  Email: admin@pharmacie.com")
        print(f"  Password: {new_password}")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())

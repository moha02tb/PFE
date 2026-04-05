#!/usr/bin/env python3
"""
Database migration script for moving to the new authentication system.
This script will:
1. Create new tables (RefreshToken, LoginAttempt)
2. Add new columns to Administrateur table
3. Hash existing plain text passwords
"""

import sys

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

import models
from database import SQLALCHEMY_DATABASE_URL
from security import hash_password
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


def run_migration():
    """Run the database migration"""

    # Connect to database
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)

    print("=" * 60)
    print("DATABASE MIGRATION SCRIPT")
    print("=" * 60)

    # Create new tables
    print("\n[1/3] Creating new tables...")
    try:
        models.Base.metadata.create_all(bind=engine)
        print("✓ Tables created successfully")
    except Exception as e:
        print(f"✗ Error creating tables: {e}")
        return False

    # Hash existing passwords
    print("\n[2/3] Hashing existing passwords...")
    try:
        db = SessionLocal()
        admins = db.query(models.Administrateur).all()

        hashed_count = 0
        for admin in admins:
            # Only hash if not already hashed (bcrypt hashes start with $2)
            if not admin.motDePasse.startswith("$2"):
                old_password = admin.motDePasse
                admin.motDePasse = hash_password(admin.motDePasse)
                hashed_count += 1
                print(f"  ✓ Hashed password for {admin.email}")
            else:
                print(f"  ⊘ Password already hashed for {admin.email}")

        db.commit()
        db.close()

        if hashed_count == 0:
            print("✓ No passwords needed hashing")
        else:
            print(f"✓ Successfully hashed {hashed_count} password(s)")

    except Exception as e:
        print(f"✗ Error hashing passwords: {e}")
        return False

    # Verify migration
    print("\n[3/3] Verifying migration...")
    try:
        db = SessionLocal()
        admin_count = db.query(models.Administrateur).count()
        print(f"✓ Found {admin_count} administrator(s)")

        # Check if new columns exist
        with engine.connect() as conn:
            result = conn.execute(
                text(
                    "SELECT column_name FROM information_schema.columns WHERE table_name='administrateur'"
                )
            )
            columns = [row[0] for row in result]

            required_columns = ["is_active", "created_at", "updated_at"]
            for col in required_columns:
                if col in columns:
                    print(f"✓ Column '{col}' exists")
                else:
                    print(f"✗ Column '{col}' missing")

        db.close()

    except Exception as e:
        print(f"✗ Error verifying migration: {e}")
        return False

    print("\n" + "=" * 60)
    print("✓ MIGRATION COMPLETED SUCCESSFULLY")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Start the backend: python -m uvicorn main:app --reload")
    print("2. Test login at: POST /api/auth/login")
    print("3. Update frontend with new auth system")
    print("=" * 60)

    return True


if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)

#!/usr/bin/env python3
"""Simple admin migration check - writes to file only."""

import sys
from pathlib import Path

# Suppress all output
sys.stdout = open(Path(__file__).parent / "admin_check_output.txt", "w")
sys.stderr = sys.stdout

backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from database import engine
from sqlalchemy import inspect, text

try:
    print("Starting admin check...")

    # Check tables
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables in DB: {', '.join(sorted(tables))}")

    with engine.connect() as conn:
        # Check administrateurs
        result = conn.execute(text("SELECT COUNT(*) FROM administrateurs"))
        admin_count = result.scalar()
        print(f"\nAdmins in administrateurs table: {admin_count}")

        if admin_count == 0:
            print("\nNo admins found! Checking backup table...")
            result = conn.execute(text("SELECT COUNT(*) FROM administrateur_backup"))
            backup_count = result.scalar()
            print(f"Records in administrateur_backup: {backup_count}")

            if backup_count > 0:
                print("\nBackup data exists. Sample records:")
                result = conn.execute(
                    text(
                        'SELECT id, email, "nomUtilisateur", role FROM administrateur_backup LIMIT 3'
                    )
                )
                for row in result:
                    print(f"  ID: {row[0]}, Email: {row[1]}, Username: {row[2]}, Role: {row[3]}")
        else:
            print("\nAdmins found! Sample records:")
            result = conn.execute(
                text('SELECT id, email, "nomUtilisateur", role FROM administrateurs LIMIT 3')
            )
            for row in result:
                print(f"  ID: {row[0]}, Email: {row[1]}, Username: {row[2]}, Role: {row[3]}")

        # Check users
        result = conn.execute(text("SELECT COUNT(*) FROM utilisateurs"))
        user_count = result.scalar()
        print(f"\nUsers in utilisateurs table: {user_count}")

        if user_count > 0:
            result = conn.execute(
                text('SELECT id, email, "nomUtilisateur" FROM utilisateurs LIMIT 3')
            )
            for row in result:
                print(f"  ID: {row[0]}, Email: {row[1]}, Username: {row[2]}")

    print("\nDone!")

except Exception as e:
    import traceback

    print(f"ERROR: {e}")
    print(traceback.format_exc())

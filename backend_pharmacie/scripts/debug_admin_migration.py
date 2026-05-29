#!/usr/bin/env python3
"""Debug script to check admin migration status and run migrations."""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

import logging

from database import engine
from sqlalchemy import inspect, text

# Setup logging to file
logging.basicConfig(
    filename=str(backend_path / "admin_migration_debug.log"),
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def check_tables_exist():
    """Check if new tables exist."""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    logger.info(f"Database tables: {tables}")

    has_new_tables = all(t in tables for t in ["administrateurs", "utilisateurs", "audit_logs"])
    has_backup = "administrateur_backup" in tables
    has_old = "administrateur" in tables

    logger.info(
        f"New tables exist: {has_new_tables}, Backup exists: {has_backup}, Old table exists: {has_old}"
    )
    return has_new_tables, has_backup, has_old


def check_admin_count():
    """Check admin counts in all tables."""
    with engine.connect() as conn:
        # Check new administrateurs table
        result = conn.execute(text("SELECT COUNT(*) FROM administrateurs"))
        admin_count = result.scalar()
        logger.info(f"Admins in new administrateurs table: {admin_count}")

        # Check backup table
        result = conn.execute(text("SELECT COUNT(*) FROM administrateur_backup"))
        backup_count = result.scalar()
        logger.info(f"Records in administrateur_backup: {backup_count}")
        if backup_count > 0:
            # Get sample data
            result = conn.execute(
                text('SELECT id, email, "nomUtilisateur", role FROM administrateur_backup LIMIT 5')
            )
            samples = result.fetchall()
            logger.info(f"Sample backup data: {samples}")

        # Check utilisateurs
        result = conn.execute(text("SELECT COUNT(*) FROM utilisateurs"))
        user_count = result.scalar()
        logger.info(f"Users in utilisateurs table: {user_count}")

        return admin_count, backup_count, user_count


def run_migration(sql_file):
    """Run a migration SQL file."""
    logger.info(f"Running migration: {sql_file}")

    try:
        with open(sql_file, "r") as f:
            sql_content = f.read()

        with engine.connect() as conn:
            # Execute each statement
            for statement in sql_content.split(";"):
                statement = statement.strip()
                if statement:
                    logger.info(f"Executing: {statement[:100]}...")
                    conn.execute(text(statement))
            conn.commit()

        logger.info("Migration completed successfully!")
        return True
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        return False


def main():
    logger.info("=== ADMIN MIGRATION DEBUG START ===")

    # Check tables
    has_new_tables, has_backup, has_old = check_tables_exist()

    if not has_new_tables:
        logger.error("New tables don't exist! Run 001_user_table_split.sql first")
        return False

    # Check counts
    admin_count, backup_count, user_count = check_admin_count()

    logger.info(f"Summary: {admin_count} admins, {user_count} users, {backup_count} in backup")

    # If admins are missing but backup has data, run fix migration
    if admin_count == 0 and backup_count > 0:
        logger.warning("No admins in new table but backup has data! Running fix migration...")
        migration_file = backend_path / "migrations" / "002_fix_admin_migration.sql"
        if migration_file.exists():
            success = run_migration(str(migration_file))
            if success:
                # Re-check counts
                admin_count, _, _ = check_admin_count()
                logger.info(f"After fix migration: {admin_count} admins now in table")
        else:
            logger.error(f"Migration file not found: {migration_file}")
            return False

    logger.info("=== ADMIN MIGRATION DEBUG END ===")

    # Print summary to stdout as well
    print("\n=== ADMIN MIGRATION STATUS ===")
    print(f"Admins in administrateurs table: {admin_count}")
    print(f"Users in utilisateurs table: {user_count}")
    print(f"Records in backup: {backup_count}")
    print(f"\nFull log: {backend_path / 'admin_migration_debug.log'}")

    return admin_count > 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

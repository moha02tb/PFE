#!/usr/bin/env python3
"""Debug admin login issue"""
import psycopg2
import os
from pathlib import Path

# Get database URL
env_path = Path("/home/mohamed/PFE/backend_pharmacie/.env")
DATABASE_URL = None
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            if line.startswith("DATABASE_URL"):
                DATABASE_URL = line.split("=", 1)[1].strip()
                break

if not DATABASE_URL:
    print("ERROR: Could not find DATABASE_URL in .env")
    exit(1)

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Check what's in administrateurs table
cur.execute('SELECT COUNT(*) FROM administrateurs')
admin_count = cur.fetchone()[0]

cur.execute('SELECT id, email, "nomUtilisateur", role FROM administrateurs LIMIT 5')
admins = cur.fetchall()

# Check what's in old backup
cur.execute('SELECT COUNT(*) FROM administrateur_backup WHERE role IN (%s, %s)', ('admin', 'super_admin'))
backup_admin_count = cur.fetchone()[0]

cur.close()
conn.close()

print("DEBUG INFO:")
print(f"- Admins in new administrateurs table: {admin_count}")
print(f"- Backup admins (in administrateur_backup): {backup_admin_count}")

if admin_count == 0 and backup_admin_count > 0:
    print("\nPROBLEM: Admins were not migrated to the new table!")
    print("Need to migrate data from backup to administrateurs table")
    
if admins:
    print("\nExisting admins:")
    for admin in admins:
        print(f"  - ID {admin[0]}: {admin[1]} (@{admin[2]}, role={admin[3]})")
else:
    print("\nNo admins found in new table!")

#!/usr/bin/env python3
"""Update admin password directly in PostgreSQL."""

import psycopg2
from psycopg2 import sql
import sys
from bcrypt import hashpw, gensalt

# PostgreSQL connection
try:
    conn = psycopg2.connect(
        host="localhost",
        database="pharmacie_db",
        user="postgres",
        password=""  # Try without password first
    )
except psycopg2.OperationalError:
    try:
        # Try with password
        conn = psycopg2.connect(
            host="localhost",
            database="pharmacie_db",
            user="postgres",
            password="postgres"
        )
    except Exception as e:
        print(f"❌ Could not connect to PostgreSQL: {e}")
        print("\nTry one of:")
        print("  sudo -u postgres psql pharmacie_db -c \"UPDATE administrateurs SET \\\"motDePasse\\\" = '\\$2b\\$12\\$nX3GVmmvHnAwLEIo9o8oau5vW6gcO2Fnjj5gCm7i3YxOsZ4wyfrMy' WHERE email = 'admin@pharmacie.com';\"")
        sys.exit(1)

cursor = conn.cursor()

# Hash the new password
new_password = b"Admin@123"
password_hash = hashpw(new_password, gensalt(rounds=12)).decode('utf-8')

# Update admin password
query = sql.SQL(
    "UPDATE administrateurs SET \"motDePasse\" = %s WHERE email = %s RETURNING id, email"
)
cursor.execute(query, (password_hash, 'admin@pharmacie.com'))
result = cursor.fetchone()

if result:
    admin_id, admin_email = result
    print(f"✓ Updated admin password!")
    print(f"  ID: {admin_id}")
    print(f"  Email: {admin_email}")
    print(f"  New Password Hash: {password_hash[:30]}...")
    conn.commit()
else:
    print(f"❌ Admin with email 'admin@pharmacie.com' not found!")
    conn.rollback()
    sys.exit(1)

cursor.close()
conn.close()

print(f"\n✓ Password reset to: Admin@123")
print(f"  You can now login with:")
print(f"    Email: admin@pharmacie.com")
print(f"    Password: Admin@123")

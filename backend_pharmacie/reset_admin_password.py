#!/usr/bin/env python3
"""Reset admin password to a known value."""

import sys
import os
sys.path.insert(0, '/home/mohamed/PFE/backend_pharmacie')

from dotenv import load_dotenv
load_dotenv()

from database import SessionLocal
from models import Administrateur
from security import hash_password

db = SessionLocal()

# Check existing admin
admin = db.query(Administrateur).filter(
    Administrateur.email == "admin@pharmacie.com"
).first()

if not admin:
    print("❌ Admin user not found!")
    db.close()
    sys.exit(1)

print(f"✓ Found admin: {admin.nomUtilisateur} ({admin.email})")
print(f"  Active: {admin.is_active}")
print(f"  Role: {admin.role}")

# Reset password to "Admin@123"
new_password = "Admin@123"
admin.motDePasse = hash_password(new_password)
db.add(admin)
db.commit()

print(f"\n✓ Password reset successfully!")
print(f"  New password: {new_password}")
print(f"\nYou can now login with:")
print(f"  Email: admin@pharmacie.com")
print(f"  Password: {new_password}")

db.close()

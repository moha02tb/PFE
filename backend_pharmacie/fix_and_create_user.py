#!/usr/bin/env python3
"""
Fix invalid roles and create test user
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

# Fix invalid roles
print("Fixing invalid roles...")
with engine.connect() as connection:
    result = connection.execute(text("UPDATE administrateur SET role = 'ADMIN' WHERE role NOT IN ('ADMIN', 'SUPER_ADMIN', 'USER')"))
    connection.commit()
    print(f"✓ Updated {result.rowcount} row(s)")

# Now create test user
from database import SessionLocal
import models
from security import hash_password

print("\nCreating test user...")
db = SessionLocal()

try:
    # Delete existing test user if it exists
    existing = db.query(models.Administrateur).filter(
        models.Administrateur.email == "admin@pharmacie.com"
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        print("✓ Deleted existing test user")
    
    # Create new test user
    test_user = models.Administrateur(
        nomUtilisateur="admin_test",
        email="admin@pharmacie.com",
        motDePasse=hash_password("Password123"),
        role="ADMIN",
        is_active=True
    )
    
    db.add(test_user)
    db.commit()
    
    print("✓ Test user created successfully!")
    print(f"  Email: admin@pharmacie.com")
    print(f"  Password: Password123")
    print(f"  Username: admin_test")
    print(f"  Role: ADMIN")
    
except Exception as e:
    print(f"✗ Error: {e}")
    db.rollback()
finally:
    db.close()

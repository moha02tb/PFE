#!/usr/bin/env python3
"""
Script to create a test admin user for development
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from sqlalchemy.orm import sessionmaker
from database import engine, SQLALCHEMY_DATABASE_URL
import models
from security import hash_password

def create_test_user():
    """Create a test admin user"""
    
    # Create session
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Check if user already exists
        existing_user = db.query(models.Administrateur).filter(
            models.Administrateur.email == "admin@pharmacie.com"
        ).first()
        
        if existing_user:
            print("✓ Test user already exists")
            print(f"  Email: {existing_user.email}")
            print(f"  Username: {existing_user.nomUtilisateur}")
            print(f"  Role: {existing_user.role}")
            return
        
        # Create test user
        test_user = models.Administrateur(
            nomUtilisateur="admin_test",
            email="admin@pharmacie.com",
            motDePasse=hash_password("YourPassword123"),
            role="admin",
            is_active=True
        )
        
        db.add(test_user)
        db.commit()
        
        print("✓ Test user created successfully!")
        print(f"  Email: admin@pharmacie.com")
        print(f"  Password: YourPassword123")
        print(f"  Username: admin_test")
        print(f"  Role: super_admin")
        
    except Exception as e:
        print(f"✗ Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("CREATE TEST USER SCRIPT")
    print("=" * 60)
    print(f"\nDatabase URL: {SQLALCHEMY_DATABASE_URL}\n")
    
    create_test_user()

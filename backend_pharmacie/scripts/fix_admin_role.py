"""Fix admin role enum data in database."""
import os
from sqlalchemy import text
from database import SessionLocal

# Disable enum validation temporarily
os.environ['SQLALCHEMY_WARN_20'] = '0'

db = SessionLocal()

try:
    # Execute raw SQL to fix the role
    db.execute(text("UPDATE administrateurs SET role = 'admin' WHERE role = 'ADMIN'"))
    db.commit()
    print("Successfully updated admin roles from 'ADMIN' to 'admin'")
except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()

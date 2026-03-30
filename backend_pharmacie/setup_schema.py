#!/usr/bin/env python3
"""
Update database schema with new columns
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("✗ DATABASE_URL not set in .env file")
    sys.exit(1)

engine = create_engine(DATABASE_URL)

# Add missing columns to administrateur table
sql_commands = [
    """
    ALTER TABLE administrateur
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    """,
    """
    CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER NOT NULL,
        token_jti VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS login_attempts (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        success BOOLEAN DEFAULT FALSE,
        attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """
]

try:
    with engine.connect() as connection:
        for sql in sql_commands:
            connection.execute(text(sql))
        connection.commit()
    print("✓ Database schema updated successfully!")
except Exception as e:
    print(f"✗ Error updating schema: {e}")
    sys.exit(1)

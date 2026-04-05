#!/usr/bin/env python3
"""Test the new database schema implementation"""

import requests

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("DATABASE SCHEMA MIGRATION TESTS")
print("=" * 60)

user_token = None

# Test 1: Register a new user
print("\n[TEST 1] Register new user")
try:
    response = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": "frank@test.com", "password": "FrankPass123", "username": "frank_user"},
    )
    if response.status_code == 200:
        data = response.json()
        print("✓ Registration successful")
        access_token = data.get("access_token")
        token_type = data.get("token_type")
        if access_token:
            print(f"  - Access Token: {access_token[:50]}...")
            user_token = access_token
        else:
            print("  - Access Token: <missing>")
        print(f"  - Token Type: {token_type}")
    else:
        print(f"✗ Registration failed: {response.status_code}")
        print(f"  - Response: {response.text}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 2: Get current user data
if user_token:
    print("\n[TEST 2] Get /me endpoint")
    try:
        response = requests.get(
            f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {user_token}"}
        )
        if response.status_code == 200:
            data = response.json()
            print("✓ /me endpoint successful")
            print(f"  - ID: {data.get('id')}")
            print(f"  - Email: {data.get('email')}")
            print(f"  - Username: {data.get('nomUtilisateur')}")
            print(f"  - Source: {data.get('source')}")
        else:
            print(f"✗ /me failed: {response.status_code}")
            print(f"  - Response: {response.text}")
    except Exception as e:
        print(f"✗ Error: {e}")

# Test 3: Login with the registered user
print("\n[TEST 3] Login with registered user")
try:
    response = requests.post(
        f"{BASE_URL}/api/auth/login", json={"email": "frank@test.com", "password": "FrankPass123"}
    )
    if response.status_code == 200:
        print("✓ Login successful")
        data = response.json()
        print(f"  - New Access Token: {data['access_token'][:50]}...")
    else:
        print(f"✗ Login failed: {response.status_code}")
        print(f"  - Response: {response.text}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 4: Check database
print("\n[TEST 4] Check database tables")
try:
    import os

    # Load .env from backend directory
    from pathlib import Path

    import psycopg2
    from dotenv import load_dotenv

    env_path = Path("/home/mohamed/PFE/backend_pharmacie/.env")
    if env_path.exists():
        load_dotenv(env_path)

    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Check utilisateurs table
    cur.execute("SELECT COUNT(*) FROM utilisateurs")
    user_count = cur.fetchone()[0]
    print(f"✓ Users in utilisateurs table: {user_count}")

    # Check administrateurs table
    cur.execute("SELECT COUNT(*) FROM administrateurs")
    admin_count = cur.fetchone()[0]
    print(f"✓ Admins in administrateurs table: {admin_count}")

    # Check refresh_tokens
    cur.execute("SELECT COUNT(*) FROM refresh_tokens WHERE entity_type='utilisateur'")
    user_tokens = cur.fetchone()[0]
    print(f"✓ User refresh tokens: {user_tokens}")

    cur.execute("SELECT COUNT(*) FROM refresh_tokens WHERE entity_type='administrateur'")
    admin_tokens = cur.fetchone()[0]
    print(f"✓ Admin refresh tokens: {admin_tokens}")

    # Sample users
    cur.execute(
        "SELECT id, email, nomUtilisateur, source FROM utilisateurs WHERE email LIKE '%@test.com' LIMIT 3"
    )
    print("\n  Recent test users:")
    for row in cur.fetchall():
        print(f"    - ID {row[0]}: {row[1]} (@{row[2]}, source: {row[3]})")

    cur.close()
    conn.close()
except Exception as e:
    print(f"✗ Database check failed: {e}")

print("\n" + "=" * 60)
print("TESTS COMPLETED")
print("=" * 60)

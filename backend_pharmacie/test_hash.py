#!/usr/bin/env python3
"""
Test password hashing
"""

import os
from dotenv import load_dotenv

load_dotenv()

from security import hash_password

password = "test123"
try:
    hashed = hash_password(password)
    print(f"✓ Original password: {password}")
    print(f"✓ Hashed: {hashed[:30]}...")
    print(f"✓ Hash length: {len(hashed)} bytes")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()

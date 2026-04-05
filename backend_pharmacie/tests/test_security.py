"""Tests for security functions.

Tests password hashing, token creation, and authentication utilities.
"""

import pytest
from datetime import datetime, timedelta
from security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
)


@pytest.mark.unit
def test_password_hashing():
    """Test that passwords are correctly hashed."""
    password = "MySecurePassword123!"
    hashed = hash_password(password)
    
    # Hashed password should be different from original
    assert hashed != password
    # Should be a string
    assert isinstance(hashed, str)
    # Should be reasonably long (hash outputs are longer than input)
    assert len(hashed) > len(password)


@pytest.mark.unit
def test_password_verification_success():
    """Test that correct password is verified successfully."""
    password = "MySecurePassword123!"
    hashed = hash_password(password)
    
    # Should verify the correct password
    assert verify_password(password, hashed) is True


@pytest.mark.unit
def test_password_verification_failure():
    """Test that incorrect password fails verification."""
    password = "MySecurePassword123!"
    wrong_password = "DifferentPassword456!"
    hashed = hash_password(password)
    
    # Should not verify wrong password
    assert verify_password(wrong_password, hashed) is False


@pytest.mark.unit
def test_password_verification_empty():
    """Test password verification with empty strings."""
    hashed = hash_password("password123")
    
    # Empty password should not verify
    assert verify_password("", hashed) is False


@pytest.mark.unit
def test_access_token_creation():
    """Test that access tokens are created correctly."""
    user_id = 1
    role = "user"
    
    token = create_access_token(user_id, role)
    
    # Should be a string
    assert isinstance(token, str)
    # Should be non-empty
    assert len(token) > 0
    # JWT tokens have three parts separated by dots
    assert token.count(".") == 2


@pytest.mark.unit
def test_refresh_token_creation():
    """Test that refresh tokens are created correctly."""
    user_id = 1
    
    token, jti = create_refresh_token(user_id)
    
    # Should return tuple of (token, jti)
    assert isinstance(token, str)
    assert isinstance(jti, str)
    # Both should be non-empty
    assert len(token) > 0
    assert len(jti) > 0


@pytest.mark.unit
def test_different_tokens_different_payload():
    """Test that tokens with different payloads are different."""
    token1 = create_access_token(1, "user")
    token2 = create_access_token(2, "admin")
    
    # Different inputs should produce different tokens
    assert token1 != token2


@pytest.mark.unit
def test_password_salting():
    """Test that same password produces different hashes (salted)."""
    password = "SamePassword123!"
    
    hash1 = hash_password(password)
    hash2 = hash_password(password)
    
    # Same password should produce different hashes due to salting
    assert hash1 != hash2
    # But both should verify the password
    assert verify_password(password, hash1) is True
    assert verify_password(password, hash2) is True


@pytest.mark.unit
def test_hash_consistency():
    """Test that verification works for hashed passwords."""
    passwords = [
        "Simple123",
        "Complex!@#$%Password",
        "unicode_文字password",
        "Very" + "Long" * 20 + "Password"
    ]
    
    for password in passwords:
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True
        assert verify_password("wrong", hashed) is False

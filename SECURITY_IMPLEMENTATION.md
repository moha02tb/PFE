# Security Implementation Guide

## Overview
This document provides a complete guide to the enterprise-grade security upgrade implemented for the PharmacieConnect admin system.

---

## ✅ What Was Implemented

### Backend Security (FastAPI + PostgreSQL)

1. **Password Hashing (Bcrypt)**
   - All passwords hashed with bcrypt (OWASP recommended)
   - Migration script hashes existing plain text passwords
   - File: `security.py` → `hash_password()`, `verify_password()`

2. **JWT Token System**
   - **Access Tokens**: 15-minute expiry (short-lived)
   - **Refresh Tokens**: 7-day expiry (long-lived)
   - Token validation with signature verification
   - Files: `security.py`, `routers/auth.py`

3. **Token Storage & Revocation**
   - Refresh tokens stored in database for revocation
   - `RefreshToken` table tracks valid tokens
   - LoginAttempt table logs all auth attempts
   - Model file: `models.py`

4. **Authentication Middleware**
   - Dependency injection pattern with `get_current_user()`
   - HttpOnly, Secure cookies for token transmission
   - Role-based access control (admin/super_admin/user)
   - File: `dependencies.py`

5. **Security Endpoints**
   - `/api/auth/login` - Issues access + refresh tokens
   - `/api/auth/refresh` - Refresh expired access token
   - `/api/auth/logout` - Revokes refresh token
   - `/api/auth/me` - Get current user
   - `/api/auth/admin/create` - Create new admin (admin+ only)
   - File: `routers/auth.py`

6. **Input Validation**
   - Pydantic models for all inputs
   - Email validation (EmailStr)
   - Password strength requirements:
     - Minimum 8 characters
     - At least one uppercase letter
     - At least one lowercase letter
     - At least one digit
   - File: `schemas.py`

7. **Rate Limiting**
   - Login endpoint limited to 5 attempts per 15 minutes
   - Using `slowapi` library
   - File: `routers/auth.py`

8. **Security Middleware**
   - CORS: Strict origin, method, header control
   - Trusted Host: Prevents Host header injection
   - HTTPS ready (set `secure=True` in production)
   - Files: `main.py`

9. **Error Handling**
   - Generic error messages (no user enumeration)
   - Secure logging without sensitive data leaks
   - File: `routers/auth.py`

### Frontend Security (React)

1. **Axios Instance with Interceptors**
   - Automatic token refresh on 401
   - HttpOnly cookie support (`withCredentials: true`)
   - CSRF token header injection
   - File: `src/lib/api.js`

2. **Authentication Context**
   - Centralized auth state management
   - Automatic login validation on app load
   - Login/logout functions
   - File: `src/context/AuthContext.jsx`

3. **Protected Routes**
   - Role-based route protection
   - Automatic redirect to login if unauthorized
   - Access denied page for insufficient permissions
   - File: `src/components/ProtectedRoute.jsx`

4. **Secure Token Handling**
   - Access token in HttpOnly cookie (backend-managed)
   - Refresh token in localStorage (frontend needs it for refresh call)
   - Tokens removed on logout
   - File: `src/context/AuthContext.jsx`

5. **Updated Login Component**
   - Removed hardcoded test credentials from UI
   - Client-side validation (email format, password length)
   - Integration with new auth system
   - File: `src/pages/Login.jsx`

6. **Updated App Structure**
   - AuthProvider wrapper at root
   - Router inside AuthProvider
   - ProtectedRoute for all protected pages
   - File: `src/App.jsx`

7. **Updated Sidebar**
   - Uses `useAuth()` hook for logout
   - Displays current user info
   - File: `src/components/layout/SidebarNew.jsx`

---

## 🚀 Deployment Checklist

### Environment Variables
Create `.env` file with:

```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost/pharmacie_db

# JWT Secrets (generate new key for production!)
SECRET_KEY=your-super-secret-key-min-32-chars-generate-with-secrets-module
ALGORITHM=HS256

# Token Expiry
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Rate Limiting
RATE_LIMIT_LOGIN_ATTEMPTS=5
RATE_LIMIT_WINDOW_MINUTES=15

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Trusted hosts
TRUSTED_HOSTS=yourdomain.com,www.yourdomain.com
```

### Generate Secure Secret Key

```python
import secrets
print(secrets.token_urlsafe(32))
```

Replace the default SECRET_KEY with this generated value.

### Database Migration

```bash
cd backend_pharmacie
source venv/bin/activate
python migrate.py
```

This will:
1. Create new tables (RefreshToken, LoginAttempt)
2. Add new columns to Administrateur table
3. Hash existing plain text passwords

### Start Backend

```bash
cd backend_pharmacie
source venv/bin/activate
python -m uvicorn main:app --reload
# Or with workers: gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

### Start Frontend

```bash
cd admin_pharmacie
npm install
npm run dev
```

### Test Authentication

1. **Login**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@pharmacie.com", "password": "YourSecurePassword123"}'
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 900
}
```

2. **Get Current User** (with access_token cookie)
```bash
curl http://localhost:8000/api/auth/me \
  -H "Cookie: access_token=your_token_here"
```

3. **Refresh Token**
```bash
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "your_refresh_token"}'
```

4. **Logout**
```bash
curl -X POST http://localhost:8000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "your_refresh_token"}'
```

---

## 🔐 Security Best Practices

### For Development
- ✓ Plain HTTP OK for localhost development
- ✓ Reload servers automatically during development
- ✓ Logging enabled for debugging

### For Production
- ✓ **Enable HTTPS** (set `secure=True` in cookies)
- ✓ **Generate new SECRET_KEY** (don't use default)
- ✓ **Whitelist specific origins** in CORS
- ✓ **Use environment variables** for all secrets
- ✓ **Enable CSRF protection** with tokens
- ✓ **Set SameSite=Strict** on cookies
- ✓ **Use strong password policies**
- ✓ **Enable HSTS headers**
- ✓ **Log all authentication attempts**
- ✓ **Monitor failed login attempts**
- ✓ **Implement account lockout** after X failed attempts
- ✓ **Use database encryption** for sensitive data
- ✓ **Regular security audits**

### Password Policy
Enforce in user registration/admin creation:
```
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- Consider adding special character requirement
```

### Rate Limiting
Current: 5 login attempts per 15 minutes

For production, consider:
- Stricter limits (3-5 attempts)
- IP-based blocking after X failed attempts
- CAPTCHA after 3 failures
- Account lockout after 10 failures

---

## 📋 File Structure

```
backend_pharmacie/
├── .env                    # Environment variables
├── main.py                 # FastAPI app with security middleware
├── models.py               # SQLAlchemy models (updated)
├── schemas.py              # Pydantic schemas (updated)
├── database.py             # Database config with env vars
├── security.py             # NEW: JWT and bcrypt utilities
├── dependencies.py         # NEW: Auth middleware
├── migrate.py              # NEW: Database migration script
├── routers/
│   └── auth.py             # NEW: All auth endpoints

admin_pharmacie/
├── src/
│   ├── App.jsx             # Updated with AuthProvider
│   ├── lib/
│   │   └── api.js          # NEW: Axios with interceptors
│   ├── context/
│   │   └── AuthContext.jsx # NEW: Auth state management
│   ├── components/
│   │   ├── ProtectedRoute.jsx # NEW: Route protection
│   │   └── layout/
│   │       └── SidebarNew.jsx # Updated to use useAuth
│   └── pages/
│       └── Login.jsx        # Updated with new auth
```

---

## 🔄 Token Flow Diagram

```
LOGIN REQUEST
    ↓
[Email + Password] → Hash & Verify Against DB
    ↓
[Valid?] → YES → Generate Access Token (15 min)
    ↓            ↓
    NO        Generate Refresh Token (7 days)
    ↓            ↓
Return Error   Store JWT ID in Database
               ↓
            Return Both Tokens
               ↓
         Access Token → HttpOnly Cookie
         Refresh Token → Response Body (localStorage)

API REQUEST
    ↓
Access Token from Cookie → Verify Signature & Expiry
    ↓
[Valid?] → YES → Process Request
    ↓
    NO → Try Refresh Endpoint
             ↓
         Refresh Token from localStorage → Verify & Check DB
             ↓
         [Valid & Not Revoked?] → YES → Issue New Access Token
             ↓
             NO → Redirect to Login

LOGOUT
    ↓
Remove Access Token Cookie
Delete Refresh Token from Database
Clear localStorage
    ↓
Redirect to Login
```

---

## 🆘 Troubleshooting

### "module 'jose' has no attribute 'encode'"
Solution: Use `PyJWT` instead of `python-jose`. Update imports:
```python
from jose import jwt  # ❌ Wrong
from jwt import encode, decode  # ✓ Correct
```

### CORS errors
Check `main.py` CORS configuration:
```python
allow_origins=["http://localhost:5173", ...]
allow_credentials=True  # REQUIREDfor cookies
```

### Cookies not persisting
Ensure frontend uses:
```javascript
withCredentials: true  // In axios config
```

### "Invalid refresh token"
The refresh token might be revoked or expired. Check:
1. RefreshToken table for active tokens
2. Token expiry time
3. Token signature validity

### Password hashing issues
Verify passwords are being hashed:
```python
from security import hash_password, verify_password
pwd = hash_password("mypassword")
print(pwd)  # Should start with $2b$ or $2a$
```

---

## 📚 Additional Security Measures

Consider implementing for production:

1. **Two-Factor Authentication (2FA)**
   - TOTP with QR codes
   - Email/SMS verification

2. **API Rate Limiting**
   - Per-user API rate limits
   - Global rate limits

3. **Security Logging**
   - Log all authentication events
   - Alert on suspicious activities
   - SIEM integration

4. **Encryption at Rest**
   - Encrypt sensitive database columns
   - Use TLS for database connections

5. **Security Headers**
   - Content-Security-Policy
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - Strict-Transport-Security

6. **Audit Trail**
   - Who performed what action and when
   - Changes to admin roles/permissions
   - Data access logs

7. **Session Management**
   - Session timeout after inactivity
   - Force logout on password change
   - Multiple concurrent session control

---

## 📞 Support

For security issues or questions:
1. Review the code comments in `security.py` and `routers/auth.py`
2. Check FastAPI security documentation
3. Review OWASP guidelines for authentication

---

**Version**: 2.0.0  
**Last Updated**: March 2026  
**Status**: Production Ready

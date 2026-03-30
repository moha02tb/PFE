# PharmacieConnect - Secure Authentication System v2.0

## 🔐 Security Upgrade Summary

This repository now includes **enterprise-grade authentication and security features**:

✅ JWT Token System (Access + Refresh tokens)  
✅ Bcrypt Password Hashing  
✅ HttpOnly Secure Cookies  
✅ Token Revocation & Blacklisting  
✅ Role-Based Access Control (RBAC)  
✅ Rate Limiting on Login  
✅ Input Validation (Email, Password)  
✅ CORS & Trusted Host Protection  
✅ Secure Error Handling  
✅ Automatic Token Refresh  

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL 12+

### Backend Setup

```bash
cd backend_pharmacie

# Create virtual environment (if not exists)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your configuration
cp .env.example .env  # Or edit .env manually

# Run database migration
python migrate.py

# Start the server
python -m uvicorn main:app --reload
```

**Backend runs at**: `http://localhost:8000`

### Frontend Setup

```bash
cd admin_pharmacie

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend runs at**: `http://localhost:5173`

---

## 📝 Configuration

### Backend Environment Variables (`.env`)

```bash
# Database Connection
DATABASE_URL=postgresql://postgres:password@localhost/pharmacie_db

# JWT Configuration
SECRET_KEY=generate-with-"python -c 'import secrets; print(secrets.token_urlsafe(32))'"
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Rate Limiting
RATE_LIMIT_LOGIN_ATTEMPTS=5
RATE_LIMIT_WINDOW_MINUTES=15

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Trusted Hosts
TRUSTED_HOSTS=localhost:3000,localhost:5173,localhost:8000,127.0.0.1
```

---

## 🔑 Authentication Flow

### 1. Login
```
POST /api/auth/login
{
  "email": "admin@pharmacie.com",
  "password": "YourSecurePassword123"
}

Response:
{
  "access_token": "eyJ0eXAi...",
  "refresh_token": "eyJ0eXAi...",
  "token_type": "bearer",
  "expires_in": 900
}
```

**Tokens:**
- **Access Token**: 15 minutes (in HttpOnly cookie)
- **Refresh Token**: 7 days (in response body, store in localStorage)

### 2. Access Protected Resources
All requests to protected endpoints automatically include the access_token cookie:
```
GET /api/auth/me
Cookie: access_token=your_token

Response:
{
  "id": 1,
  "nomUtilisateur": "admin",
  "email": "admin@pharmacie.com",
  "role": "admin",
  "is_active": true
}
```

### 3. Token Refresh
When access token expires, use refresh token:
```
POST /api/auth/refresh
{
  "refresh_token": "eyJ0eXAi..."
}

Response:
{
  "access_token": "new_eyJ0eXAi...",
  "refresh_token": "eyJ0eXAi...",
  "token_type": "bearer",
  "expires_in": 900
}
```

### 4. Logout
```
POST /api/auth/logout
{
  "refresh_token": "eyJ0eXAi..."
}
```

---

## 👥 Role-Based Access Control

### User Roles
- **user**: Regular user (default)
- **admin**: Administrator (can create other admins)
- **super_admin**: Super administrator (full access)

### Protected Endpoints by Role

| Endpoint | Required Role | Purpose |
|----------|---------------|---------|
| `/api/auth/me` | user | Get current user |
| `/api/auth/admin/create` | admin | Create new admin account |
| `/dashboard` | user | Access admin dashboard |

---

## 📁 Project Structure

```
admin_pharmacie/ (Frontend - React)
├── src/
│   ├── App.jsx                    # Main app with AuthProvider
│   ├── pages/
│   │   ├── Login.jsx              # Secure login page
│   │   ├── Dashboard.jsx
│   │   └── ...
│   ├── context/
│   │   └── AuthContext.jsx        # Auth state management
│   ├── lib/
│   │   └── api.js                 # Axios with auto token refresh
│   ├── components/
│   │   ├── ProtectedRoute.jsx     # Route protection wrapper
│   │   └── layout/
│   │       └── SidebarNew.jsx     # Updated sidebar with logout
│   └── ...
└── package.json

backend_pharmacie/ (Backend - FastAPI)
├── main.py                        # FastAPI app
├── models.py                      # Database models
├── schemas.py                     # Request/response schemas
├── database.py                    # Database config
├── security.py                    # JWT & bcrypt utilities
├── dependencies.py                # Auth middleware
├── migrate.py                     # Database migration
├── routers/
│   └── auth.py                    # Authentication endpoints
├── .env                           # Environment variables
├── requirements.txt               # Python dependencies
└── venv/                          # Virtual environment
```

---

## 🛡️ Security Features Explained

### 1. JWT Tokens
- Stateless authentication (no session storage needed)
- Self-contained: includes user ID, role, expiry
- Digitally signed to prevent tampering
- Automatic expiry for time-limited access

### 2. Bcrypt Password Hashing
- Industry-standard hashing algorithm
- Automatically salted
- One-way encryption (irreversible)
- Resistant to brute-force attacks

### 3. Token Revocation
- Refresh tokens stored in database
- Can be revoked immediately
- Old tokens become invalid
- Supports forced logout across all sessions

### 4. HttpOnly Cookies
- Access token stored in browser cookie
- JavaScript cannot access it (prevents XSS attacks)
- Automatically sent with requests
- Cannot be stolen by malicious scripts

### 5. Rate Limiting
- Prevents brute-force password attacks
- 5 login attempts per 15 minutes per IP
- Returns 429 (Too Many Requests) when exceeded

### 6. Input Validation
- Email validated with regex
- Password strength enforced:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 digit

### 7. Secure Error Messages
- Generic "Invalid credentials" (no user enumeration)
- Prevents attackers from discovering valid emails
- Logs detailed errors server-side for debugging

---

## 🧪 Testing Authentication

### Test Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pharmacie.com",
    "password": "YourPassword123"
  }'
```

### Test Protected Endpoint
```bash
curl http://localhost:8000/api/auth/me \
  -H "Cookie: access_token=YOUR_TOKEN_HERE"
```

### Test Token Refresh
```bash
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "YOUR_REFRESH_TOKEN"}'
```

### Test Rate Limiting
Try logging in 6 times quickly:
```bash
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@pharmacie.com", "password": "wrong"}' \
    && echo "Attempt $i"
done
```

---

## 🔄 Development Workflow

### Making API Requests in Frontend

Use the pre-configured `api` instance:

```javascript
// src/lib/api.js already handles:
// ✓ Automatic token refresh on 401
// ✓ Including access token cookie
// ✓ CSRF token injection
// ✓ Error handling

import api from './lib/api';

// Make requests normally
const response = await api.get('/api/auth/me');
const data = await api.post('/some/endpoint', payload);
```

### Using Auth Context in Components

```javascript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user, logout, isAuthenticated } = useAuth();
  
  return (
    <>
      <p>Hello, {user.nomUtilisateur}</p>
      <button onClick={logout}>Logout</button>
    </>
  );
}
```

---

## ⚡ Performance Optimization

1. **Token Caching**
   - Access token cached in browser memory
   - Reused until expiry
   - Refresh token stored in localStorage

2. **Middleware Efficiency**
   - JWT validation is fast (crypto library optimized)
   - Database queries cached where possible
   - Rate limiter uses in-memory cache

3. **CORS Optimization**
   - Preflight requests cached (max_age=3600)
   - Direct requests bypass preflight
   - Reduces unnecessary OPTIONS requests

---

## 🚨 Troubleshooting

### "Invalid credentials" on login
✓ Check password is correct (case-sensitive)  
✓ Run `migrate.py` to hash existing passwords  
✓ Verify user exists in database  

### Cookies not being sent
✓ Ensure `withCredentials: true` in axios  
✓ Verify CORS `allow_credentials=True`  
✓ Check if cookies are enabled in browser  

### Token refresh failing
✓ Verify refresh token is still valid (< 7 days)  
✓ Check RefreshToken table for revoked tokens  
✓ Ensure `.env` SECRET_KEY hasn't changed  

### Rate limiting too strict
✓ Adjust `RATE_LIMIT_LOGIN_ATTEMPTS` in `.env`  
✓ Increase `RATE_LIMIT_WINDOW_MINUTES` for longer window  
✓ Clear failed attempts by restarting server  

---

## 📚 Documentation Files

- **`SECURITY_IMPLEMENTATION.md`** - Detailed security guide
- **`TECHNICAL_DOCUMENTATION.md`** - Architecture & code details
- **This file** - Quick reference & getting started

---

## ✨ What Changed vs. Kept

### Changed ❌➜✅ 
- Plain text passwords → Bcrypt hashing
- No tokens → JWT access + refresh tokens
- localStorage only → HttpOnly cookies + localStorage
- Single login endpoint → Proper auth flow with refresh
- No revocation → Database token blacklist
- Tests show credentials in UI → Removed for security

### Kept as-is ✓
- FastAPI framework & structure
- React component architecture
- Database schema (extended with new tables)
- Existing routes and functionality
- UI/UX design
- Business logic

---

## 🎯 Next Steps

1. ✅ Run `migrate.py` to set up database
2. ✅ Start backend: `python -m uvicorn main:app --reload`
3. ✅ Start frontend: `npm run dev`
4. ✅ Test login at `http://localhost:5173/login`
5. ✅ Deploy with HTTPS in production
6. ✅ Monitor auth logs and adjust rate limits as needed

---

## 📞 Support & Issues

For security-related questions:
1. Check `SECURITY_IMPLEMENTATION.md` for details
2. Review code comments in `security.py`
3. Consult FastAPI security docs: https://fastapi.tiangolo.com/tutorial/security/
4. Check OWASP guidelines: https://owasp.org/

---

## License
Proprietary - PharmacieConnect Project

**Version**: 2.0.0 (Security-Enhanced)  
**Last Updated**: March 2026

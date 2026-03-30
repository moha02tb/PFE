# API Documentation - Authentication Endpoints

## Base URL
```
http://localhost:8000
```

---

## Authentication Endpoints

### 1. Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate user with email and password. Returns access and refresh tokens.

**Rate Limiting:** 5 attempts per 15 minutes per IP address

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@pharmacie.com",
  "password": "SecurePassword123"
}
```

**Validation Rules:**
- `email`: Valid email format (required)
- `password`: 6-128 characters (required)

**Success Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 900
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `422 Unprocessable Entity` - Invalid input format
- `429 Too Many Requests` - Rate limit exceeded

**Example with cURL:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pharmacie.com",
    "password": "SecurePassword123"
  }'
```

**Frontend Usage:**
```javascript
const { login } = useAuth();
const result = await login("admin@pharmacie.com", "SecurePassword123");
if (result.success) {
  // Tokens stored automatically
  navigate('/dashboard');
}
```

---

### 2. Refresh Token

**Endpoint:** `POST /api/auth/refresh`

**Description:** Get a new access token using a refresh token. Called automatically when access token expires.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 900
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid, expired, or revoked token

**Example with cURL:**
```bash
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Automatic Usage (No Manual Call Needed):**
```javascript
// Handled automatically by src/lib/api.js
// When access token expires, refresh is called automatically
// Original request is retried with new token
```

---

### 3. Get Current User

**Endpoint:** `GET /api/auth/me`

**Description:** Get information about the currently authenticated user.

**Authentication:** Required (Access token in cookie)

**Request Headers:**
```
Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "id": 1,
  "nomUtilisateur": "admin",
  "email": "admin@pharmacie.com",
  "role": "admin",
  "is_active": true
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `401 Unauthorized` - User is inactive

**Example with cURL:**
```bash
curl http://localhost:8000/api/auth/me \
  -H "Cookie: access_token=YOUR_TOKEN"
```

**Frontend Usage:**
```javascript
import api from './lib/api';

const response = await api.get('/api/auth/me');
console.log(response.data.nomUtilisateur); // "admin"
```

---

### 4. Logout

**Endpoint:** `POST /api/auth/logout`

**Description:** Logout user and revoke refresh token.

**Authentication:** Required (Access token in cookie)

**Request Headers:**
```
Content-Type: application/json
Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Backend Actions:**
- Deletes refresh token JTI from database (revokes token)
- Clears access_token cookie
- User must login again for new tokens

**Example with cURL:**
```bash
curl -X POST http://localhost:8000/api/auth/logout \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

**Frontend Usage:**
```javascript
const { logout } = useAuth();
await logout();
// Automatically redirects to login
```

---

### 5. Create Admin User

**Endpoint:** `POST /api/auth/admin/create`

**Description:** Create a new administrator account. Admin role required.

**Authentication:** Required (Access token in cookie)  
**Authorization:** admin or super_admin role required

**Request Headers:**
```
Content-Type: application/json
Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "nomUtilisateur": "johnadmin",
  "email": "john@pharmacie.com",
  "password": "SecurePass123",
  "role": "admin"
}
```

**Validation Rules:**
- `nomUtilisateur`: 3-100 characters, must be unique
- `email`: Valid email format, must be unique
- `password`: 
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one digit
- `role`: "admin" or "super_admin" (default: "user")

**Success Response (200 OK):**
```json
{
  "id": 2,
  "nomUtilisateur": "johnadmin",
  "email": "john@pharmacie.com",
  "role": "admin",
  "is_active": true
}
```

**Error Responses:**
- `400 Bad Request` - Email already registered
- `400 Bad Request` - Username already taken
- `422 Unprocessable Entity` - Password doesn't meet requirements
- `403 Forbidden` - User doesn't have admin role

**Example with cURL:**
```bash
curl -X POST http://localhost:8000/api/auth/admin/create \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -d '{
    "nomUtilisateur": "johnadmin",
    "email": "john@pharmacie.com",
    "password": "SecurePass123",
    "role": "admin"
  }'
```

---

### 6. Health Check

**Endpoint:** `GET /health`

**Description:** Check if API is running (no authentication required).

**Success Response (200 OK):**
```json
{
  "status": "ok",
  "version": "2.0.0"
}
```

**Example with cURL:**
```bash
curl http://localhost:8000/health
```

---

## Request/Response Flow Diagrams

### Login Flow
```
CLIENT                          SERVER
  |                               |
  |-- POST /api/auth/login ------>|
  |  {email, password}            |
  |                               | Validate credentials
  |                               | Hash password check
  |                               | Generate tokens
  |                               | Store token JTI in DB
  |                               |
  |<-- 200 OK + Set-Cookie <------|
  |  {access_token,               |
  |   refresh_token,              |
  |   expires_in}                 |
```

### Protected Request Flow
```
CLIENT                          SERVER
  |                               |
  |-- GET /api/endpoint --------->|
  |  Cookie: access_token=XXX     |
  |                               | Validate token
  |                               | Check signature
  |                               | Check expiry
  |                               | Get user from DB
  |                               |
  |<-- 200 OK + Data <------------|
```

### Token Refresh Flow
```
CLIENT                          SERVER
  |                               |
  |-- POST /api/auth/refresh ---->|
  |  {refresh_token}              |
  |                               | Validate token
  |                               | Check if revoked
  |                               | Generate new token
  |                               |
  |<-- 200 OK + New Token <-------|
  |  {access_token,               |
  |   refresh_token}              |
```

---

## Token Structure

### Access Token (JWT)
```json
{
  "sub": "1",           // User ID
  "role": "admin",      // User role
  "type": "access",     // Token type
  "iat": 1700000000,    // Issued at
  "exp": 1700000900     // Expires at (15 minutes)
}
```

### Refresh Token (JWT)
```json
{
  "sub": "1",              // User ID
  "type": "refresh",       // Token type
  "jti": "abc123xyz...",   // Unique JWT ID (for revocation)
  "iat": 1700000000,       // Issued at
  "exp": 1704672000        // Expires at (7 days)
}
```

---

## Error Codes Reference

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid input, email taken, username taken |
| 401 | Unauthorized | Invalid credentials, missing token, expired token |
| 403 | Forbidden | Insufficient permissions/role |
| 422 | Unprocessable Entity | Invalid data format, password too weak |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error (check logs) |

---

## Security Headers Sent

Every response includes:

```
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 3600
```

---

## Rate Limiting Details

- **Endpoint:** `/api/auth/login`
- **Limit:** 5 attempts per 15 minutes per IP address
- **Tracking:** By client IP address
- **Response when limited:** 
  ```json
  {
    "detail": "Rate limit exceeded"
  }
  ```
- **Wait time:** 15 minutes after exceeding limit

---

## Notes for Developers

1. **Always include cookies:** Frontend axios instance has `withCredentials: true`
2. **Auto refresh:** Axios interceptor automatically refreshes tokens
3. **Error handling:** 401 triggers automatic token refresh
4. **Role checking:** Backend validates role for protected endpoints
5. **Secure tokens:** Never expose SECRET_KEY or store tokens in URL parameters

---

## Example Frontend Integration

```javascript
// 1. Login
const { login } = useAuth();
await login('email@example.com', 'password');

// 2. Make requests (automatic token handling)
import api from './lib/api';
const response = await api.get('/api/auth/me');

// 3. Logout
const { logout } = useAuth();
await logout();
```

---

**Last Updated:** March 25, 2026  
**API Version:** 2.0.0

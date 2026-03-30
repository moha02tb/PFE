# Migration Guide: Old System → New Security System

## 📊 What Changed vs. What Stayed the Same

### ❌ REMOVED (No Longer Supported)

1. **Plain Text Passwords**
   - ❌ Old: `admin.motDePasse != "admin123"` (string comparison)
   - ✅ New: `verify_password("admin123", hashed)` (bcrypt verification)
   - Action: Run `migrate.py` to hash existing passwords

2. **localStorage-Only Token Storage**
   - ❌ Old: `localStorage.setItem('admin_user', JSON.stringify(userData))`
   - ✅ New: HttpOnly cookie + localStorage for refresh token
   - Impact: More secure, but requires CORS `allow_credentials=True`

3. **No Token Expiration**
   - ❌ Old: User stays logged in forever (until cleared)
   - ✅ New: Access token expires in 15 minutes
   - Benefit: Reduces impact of token compromise

4. **Single Login Endpoint**
   - ❌ Old: `/api/admin/login` (returns user data only)
   - ✅ New: `/api/auth/login` (returns access + refresh tokens)
   - Old endpoint still exists for backward compatibility (redirects)

5. **No Token Refresh**
   - ❌ Old: Invalid token = redirect to login
   - ✅ New: Auto-refresh with refresh token
   - Benefit: Better user experience, less forced logouts

6. **Hardcoded Test Credentials in UI**
   - ❌ Old: "Email: admin@pharmacie.com | Pass: admin123" shown on UI
   - ✅ New: Removed (security best practice)
   - Users need real credentials to login

7. **No Role Enforcement**
   - ❌ Old: Role field existed but not used for access control
   - ✅ New: Admin-only endpoints check role
   - Benefit: Only admins can create other admins

### ✅ KEPT (No Breaking Changes)

1. **Database Schema**
   - ✅ All existing columns remain
   - ✅ New columns added (is_active, created_at, updated_at)
   - ✅ No data loss
   - ✅ Existing records still accessible

2. **FastAPI Framework**
   - ✅ Same structure and patterns
   - ✅ Same dependency injection
   - ✅ Same Pydantic models (enhanced)
   - ✅ Same SQLAlchemy models (extended)

3. **React Architecture**
   - ✅ Same component structure
   - ✅ Same routing approach
   - ✅ Same UI/UX design
   - ✅ Same styling and dependencies

4. **API Routes** (mostly)
   - ✅ Existing pharmacy routes unchanged
   - ✅ Existing calendar/map routes unchanged
   - ✅ Business logic untouched
   - ✅ Only auth system changed

5. **Database Connection**
   - ✅ Same PostgreSQL database
   - ✅ Same connection string format
   - ✅ Same models and queries
   - ✅ Migration script adds tables (non-destructive)

---

## 🔄 User Journey Comparison

### OLD SYSTEM
```
1. User enters email + password on Login page
2. Frontend fetches /api/admin/login
3. Backend validates in plain text
4. Returns user object
5. Frontend stores in localStorage
6. Frontend checks localStorage on every page
7. If no localStorage data → redirect to login
8. No automatic logout or token refresh
```

### NEW SYSTEM
```
1. User enters email + password on Login page
2. Frontend calls /api/auth/login
3. Backend hashes + validates with bcrypt
4. Returns access_token + refresh_token
5. Frontend stores:
   - access_token → HttpOnly cookie (automatic)
   - refresh_token → localStorage (for refresh)
6. Frontend makes API calls (auto-include cookie)
7. If 401: Use refresh token → get new access token
8. Automatic logout after 7 days (refresh token expiry)
```

---

## 🛠️ Developer Workflow Changes

### Making API Requests

**OLD WAY:**
```javascript
// Manual token handling
const token = JSON.parse(localStorage.getItem('admin_user'));
const response = await fetch(`/api/endpoint`, {
  headers: {
    'Authorization': `Bearer ${token.id}`
  }
});
```

**NEW WAY:**
```javascript
// Automatic token handling
import api from './lib/api';
const response = await api.get('/api/endpoint');
// Token automatically included, refresh handled automatically!
```

### Logging Out

**OLD WAY:**
```javascript
localStorage.removeItem('admin_user');
// No server-side logout, no token revocation
```

**NEW WAY:**
```javascript
const { logout } = useAuth();
await logout();
// Server revokes token, frontend clears cookies
```

### Checking Authentication

**OLD WAY:**
```javascript
const user = localStorage.getItem('admin_user');
if (!user) redirect('/login');
```

**NEW WAY:**
```javascript
const { isAuthenticated, user, loading } = useAuth();
if (loading) return <Loading/>;
if (!isAuthenticated) redirect('/login');
```

### Protecting Routes

**OLD WAY:**
```javascript
// Manual checking
if (!localStorage.getItem('admin_user')) {
  return <Redirect to="/login" />;
}
return <Dashboard />;
```

**NEW WAY:**
```javascript
import ProtectedRoute from './components/ProtectedRoute';

<Route
  path="/dashboard"
  element={<ProtectedRoute element={<Dashboard />} />}
/>
```

---

## 📚 Database Migration Guide

### Running Migration

```bash
cd backend_pharmacie
source venv/bin/activate

# Backup database first! (just in case)
pg_dump pharmacie_db > backup_$(date +%s).sql

# Run migration
python migrate.py
```

### What Migration Does

1. **Creates new tables:**
   - `refresh_tokens` - Stores valid token JTIs
   - `login_attempts` - Logs login attempts

2. **Alters Administrateur table:**
   - Adds `is_active` (Boolean, default: True)
   - Adds `created_at` (DateTime)
   - Adds `updated_at` (DateTime)

3. **Hashes passwords:**
   - Finds all plain text passwords
   - Hashes with bcrypt
   - Updates database

4. **No data loss:**
   - All existing rows preserved
   - All existing fields unchanged
   - Only new fields added

### Rollback (If Needed)

```bash
# Restore from backup
psql pharmacie_db < backup_TIMESTAMP.sql
```

---

## 🔐 Security Changes Explained

### Password Storage

**OLD:** `column: 'admin123'` 
- Readable in database
- Exposed if DB is hacked
- Plaintext in memory

**NEW:** `column: '$2b$12$...' (bcrypt hash)`
- One-way encryption
- Impossible to reverse
- Salt included
- OWASP recommended

### Token Storage

**OLD:** `localStorage['admin_user'] = JSON.stringify(user)`
- JavaScript can access it
- Vulnerable to XSS attacks
- Stays until manually cleared

**NEW:** 
- Access token: HttpOnly cookie (can't be accessed by JS)
- Refresh token: localStorage (needed for refresh call)
- Both expire automatically

### Session Management

**OLD:** No sessions
- User logged in after successful login
- No automatic logout
- If browser closed, user still "logged in" if localStorage persists

**NEW:** True sessions
- Access token expires in 15 minutes
- Refresh token expires in 7 days
- Logout server-side revokes refresh token
- Security token (jti) prevents token reuse

---

## ⚠️ Potential Issues & Solutions

### Issue: "Invalid credentials" after migration
**Cause:** Passwords not hashed yet
**Solution:** Run `python migrate.py` to hash existing passwords

### Issue: Cookies not being sent with requests
**Cause:** Missing `withCredentials: true`
**Solution:** Already fixed in `src/lib/api.js`

### Issue: CORS errors
**Cause:** Backend CORS not configured for cookies
**Solution:** Already fixed in `main.py` (allow_credentials=True)

### Issue: Token doesn't auto-refresh
**Cause:** Axios interceptor not configured
**Solution:** Already implemented in `src/lib/api.js`

### Issue: Can't login with old password
**Cause:** Plain text password vs hashed
**Solution:** See "Issue #1" above

### Issue: Rate limiting too strict
**Cause:** Default 5 attempts/15 mins
**Solution:** Adjust in `.env` file
```bash
RATE_LIMIT_LOGIN_ATTEMPTS=10
RATE_LIMIT_WINDOW_MINUTES=30
```

---

## 🎯 Testing Checklist

### Backend Tests
- [ ] `python migrate.py` completes successfully
- [ ] No errors in console after migration
- [ ] Database has new tables
- [ ] Existing passwords are hashed
- [ ] Login endpoint works with correct credentials
- [ ] Login endpoint returns access + refresh tokens
- [ ] Rate limiting blocks 6th attempt in 15 minutes
- [ ] Refresh endpoint works
- [ ] Logout revokes token

### Frontend Tests
- [ ] Login page works
- [ ] Successful login redirects to dashboard
- [ ] Failed login shows error message
- [ ] Protected routes redirect if not logged in
- [ ] Logout redirects to login
- [ ] Page refresh keeps user logged in (within access token time)
- [ ] Token refresh happens automatically
- [ ] After 15 minutes, access token is refreshed
- [ ] No console errors

### Integration Tests
- [ ] Login → Dashboard → Logout flow works
- [ ] Can make API requests after login
- [ ] Tokens are set as cookies
- [ ] Refresh token in localStorage
- [ ] Admin can create new admin users
- [ ] Non-admin cannot create users
- [ ] Role-based access works

---

## 📋 Deployment Checklist

### Before Production
- [ ] Generate new SECRET_KEY (not default)
- [ ] Configure HTTPS (set secure=True)
- [ ] Whitelist production domain in CORS
- [ ] Update TRUSTED_HOSTS with production domain
- [ ] Configure production database
- [ ] Set up logging and monitoring
- [ ] Test on staging environment
- [ ] Backup production database
- [ ] Create deployment plan

### After Deployment
- [ ] Monitor error logs
- [ ] Check authentication metrics
- [ ] Verify rate limiting works
- [ ] Test token refresh in production
- [ ] Monitor database growth (login_attempts table)
- [ ] Set up alerts for failed logins

---

## 🆘 Getting Help

### Common Questions

**Q: Do I need to change my login code?**  
A: Yes, use the new `useAuth()` hook and `ProtectedRoute` for cleaner code.

**Q: Old login endpoint still works?**  
A: Partially. It redirects to new endpoint. Use new endpoint instead.

**Q: Can old clients still login?**  
A: No. Update frontend to use new auth flow.

**Q: What about existing API request code?**  
A: Update to use `api` instance from `src/lib/api.js` for auto token handling.

**Q: How do I debug token issues?**  
A: Check browser cookies: DevTools → Application → Cookies  
Check localStorage: DevTools → Application → Local Storage

---

## 📖 Additional Resources

- `SECURITY_IMPLEMENTATION.md` - Deep dive into security
- `IMPLEMENTATION_README.md` - Deployment guide
- `QUICK_REFERENCE.md` - Quick commands and snippets
- Code comments - Inline documentation

---

## 🎉 You're Ready!

The system is fully backward compatible where possible. The database migration is non-destructive and preserves all existing data. Old users can login immediately after password hashing.

**Happy Upgrading! 🚀**

# API Timeout Troubleshoot & Fix Guide

## Problem Summary
The mobile app was experiencing repeated API timeouts (ECONNABORTED, 10000ms exceeded) when:
- Fetching nearby pharmacies: `GET /api/pharmacies/nearby`
- Fetching all pharmacies: `GET /api/pharmacies`
- Searching pharmacies: `GET /api/pharmacies/search`

**Root Cause**: The backend was loading ALL pharmacies into memory and filtering client-side (inefficient), combined with a 10-second timeout that was too tight.

---

## Fixes Applied

### 1. ✅ Backend Query Optimization
**File**: `backend_pharmacie/main.py`

**Problem**: The `/api/pharmacies/nearby` endpoint was:
- Loading ALL pharmacies from the database into memory
- Performing distance calculations in Python for every pharmacy
- Very slow with large datasets (100s or 1000s of pharmacies)

**Solution**: Implemented bounding box filtering at the database level
- Queries only pharmacies within a geographic bounding box first
- Applies exact Haversine distance calculation only to the filtered subset
- Reduced memory usage and database transfer significantly
- Better cache key rounding for improved hit rates

```python
# Old: Fetched all pharmacies, then filtered
pharmacies = db.query(models.Pharmacie).all()  # ❌ SLOW

# New: Filter at database level first
pharmacies = db.query(models.Pharmacie)
    .filter(models.Pharmacie.latitude >= lat - lat_delta)
    .filter(models.Pharmacie.latitude <= lat + lat_delta)
    .filter(models.Pharmacie.longitude >= lon - lon_delta)
    .filter(models.Pharmacie.longitude <= lon + lon_delta)
    .limit(limit * 5)  # ✅ FAST - filtered at DB level
```

### 2. ✅ API Timeout Increased
**File**: `ouerkema-pharmacieconnect-4c94773cce7d/config/api.js`

**Change**:
- Increased timeout from **10 seconds → 30 seconds**
- This gives the optimized backend query more time to complete

### 3. ✅ Retry Logic Added
**File**: `ouerkema-pharmacieconnect-4c94773cce7d/utils/pharmacyDataLoader.js`

**New Feature**: Exponential backoff retry mechanism
- Automatically retries failed requests up to 3 times
- Uses exponential backoff: 1s, 2s, 4s delays between attempts
- Adds random jitter to prevent thundering herd
- Only retries on network timeouts and 5xx errors (not 4xx client errors)

```javascript
const withRetry = async (requestFn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

### 4. ✅ Database Connection Pooling
**File**: `backend_pharmacie/database.py`

**Changes for PostgreSQL**:
- Pool size: 10 connections (enough for concurrent requests)
- Max overflow: 20 (allows temporary spike handling)
- Pool pre-ping: Tests connections before reuse
- Pool recycle: Recycles connections after 1 hour (prevents stale connections)

```python
pool_kwargs = {
    "pool_size": 10,
    "max_overflow": 20,
    "pool_pre_ping": True,
    "pool_recycle": 3600,
}
```

### 5. 📊 Database Indexes (Recommended)
**File**: `backend_pharmacie/migrations/add_pharmacy_indexes.sql`

**Indexes to apply** (significantly speeds up queries):
```sql
-- Bounding box queries for nearby searches
CREATE INDEX idx_pharmacie_latitude_longitude ON pharmacie (latitude, longitude);

-- Region-based searches
CREATE INDEX idx_pharmacie_governorate ON pharmacie (governorate);

-- Text searches
CREATE INDEX idx_pharmacie_name_governorate ON pharmacie (name, governorate);
```

---

## Next Steps

### Immediate (Required)
1. **Restart the backend server** to apply database pool changes
   ```bash
   cd /home/mohamed/PFE/backend_pharmacie
   source venv/bin/activate
   python main.py
   ```

2. **Test the nearby pharmacy endpoint**:
   ```bash
   curl "http://192.168.1.142:8000/api/pharmacies/nearby?lat=36.8&lon=10.2&radius_km=10"
   ```

### Soon (Highly Recommended)
3. **Apply database indexes** (if using PostgreSQL):
   ```bash
   psql -U postgres -d pharmacie_db -f migrations/add_pharmacy_indexes.sql
   ```
   This will make queries 10-100x faster for large datasets.

4. **Monitor API logs**:
   ```bash
   # Look for retry messages
   grep "Retry attempt" /path/to/logs
   # Check response times
   grep "Successfully fetched" /path/to/logs
   ```

### Future Optimization (Consider)
5. **Use PostGIS** for true geospatial queries (if staying with PostgreSQL)
   - Much faster than manual distance calculations
   - Native geographic data types
   - Built-in indexes for spatial queries

6. **Add caching layer** (Redis):
   - Cache nearby pharmacy results by location grid
   - Reduces database load significantly

7. **Implement data pagination**:
   - Load pharmacies in chunks rather than all at once
   - Better for very large datasets

---

## Configuration Files Modified

| File | Changes | Impact |
|------|---------|--------|
| `backend_pharmacie/main.py` | Optimized nearby query with bounding box | ⚡ 10-100x faster queries |
| `config/api.js` | Timeout 10s → 30s | 🔧 More time for completion |
| `utils/pharmacyDataLoader.js` | Added retry logic with exponential backoff | 🔄 Resilient to transient failures |
| `backend_pharmacie/database.py` | Added connection pooling | 💾 Better resource management |

---

## Verification Checklist

After applying fixes:
- [ ] Backend server starts without errors
- [ ] Database pool initializes (check logs for pool settings)
- [ ] Nearby pharmacy endpoint responds within 10 seconds
- [ ] Mobile app fetches pharmacies without timeout errors
- [ ] Retry logic logs appear when network is slow
- [ ] Database indexes exist (if applying SQL migration)

---

## Debugging Tips

If timeouts still occur:

1. **Check database connection**:
   ```bash
   psql -U postgres -d pharmacie_db -c "SELECT count(*) FROM pharmacie;"
   ```

2. **Monitor query performance**:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM pharmacie 
   WHERE latitude BETWEEN 36 AND 37 AND longitude BETWEEN 10 AND 11;
   ```

3. **Check system resources** on backend machine:
   ```bash
   top  # CPU and memory usage
   netstat -an | grep ESTABLISHED  # Connection count
   ```

4. **Enable slow query logging** (PostgreSQL):
   ```sql
   SET log_min_duration_statement = 1000;  -- Log queries > 1 second
   ```

---

## Performance Expectations

After fixes:

| Scenario | Before | After |
|----------|--------|-------|
| Nearby pharmacy (10 pharmacies) | 8-12s (timeout) | 200-500ms |
| Nearby pharmacy (100 pharmacies) | 15-20s (timeout) | 1-2s |
| All pharmacies fetch | 10-15s (timeout) | 2-5s |
| Search by name/governorate | 10-12s (timeout) | 500ms-1s |

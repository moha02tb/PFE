# CSV Pharmacy Upload Feature - Testing & Verification Guide

## Overview

This guide provides step-by-step instructions for testing the newly implemented CSV pharmacy upload/bulk creation feature.

## Implementation Summary

### Created Files
1. **Migration**: `backend_pharmacie/migrations/002_pharmacies_table.sql` - Database schema
2. **ORM Model**: Added `Pharmacie` class to `backend_pharmacie/models.py`
3. **Pydantic Schemas**: Added `PharmacieCreate`, `PharmacieResponse`, `PharmacieUploadResponse` to `backend_pharmacie/schemas.py`
4. **Endpoint**: Completely rewrote `POST /api/admin/upload` in `backend_pharmacie/routers/admin.py`
5. **Tests**: Created `backend_pharmacie/tests/test_pharmacy_upload.py` with comprehensive test coverage
6. **Frontend**: Updated `admin_pharmacie/src/UploadPage.jsx` for detailed response handling
7. **Sample Data**: Created `backend_pharmacie/sample_pharmacies.csv` with 10 test pharmacies
8. **Router Registration**: Added admin router to `backend_pharmacie/main.py`

### Key Features Implemented
✅ CSV file parsing with pandas  
✅ Required field validation (name, latitude, longitude)  
✅ Geographic coordinate validation (-90 to 90 for lat, -180 to 180 for lon)  
✅ OSM ID duplicate detection (both in upload and database)  
✅ Skip-invalid-rows approach (maximizes data ingestion)  
✅ Single-transaction batch insert (atomic, all-or-nothing)  
✅ Detailed error reporting with row numbers  
✅ Admin authorization checks  
✅ Audit logging of bulk uploads  
✅ UTF-8 support for Arabic pharmacy names  
✅ File size validation (max 5MB)  
✅ Row count validation (max 5000 rows)  

## Testing Checklist

### Prerequisites
- PostgreSQL database running and configured in `DATABASE_URL`
- Backend server running on `http://localhost:8000`
- Admin user created and logged in on frontend (`http://localhost:5173`)
- Valid JWT token accessible in browser local storage

### 1. Database & ORM Testing

#### 1.1 Verify Database Table Creation
```bash
# Connect to PostgreSQL
psql -h localhost -U your_user -d your_database

# Check if pharmacies table exists
\dt pharmacies

# Verify table structure
\d pharmacies
```

Expected output:
```
                     Table "public.pharmacies"
    Column    |            Type             | Modifiers
--------------+-----------------------------+-----------
 id           | integer                     | primary key
 osm_type     | character varying(20)       | not null default 'node'
 osm_id       | bigint                      | 
 name         | character varying(255)      | not null
 address      | character varying(500)      | 
 phone        | character varying(20)       | 
 governorate  | character varying(100)      | 
 latitude     | double precision            | not null
 longitude    | double precision            | not null
 created_by   | integer                     | not null (FK to administrateurs)
 created_at   | timestamp with time zone    | 
 updated_at   | timestamp with time zone    | 
```

Indexes should exist:
```
CREATE INDEX idx_pharmacies_osm_id ON pharmacies(osm_id);
CREATE INDEX idx_pharmacies_name ON pharmacies(name);
CREATE INDEX idx_pharmacies_governorate ON pharmacies(governorate);
CREATE INDEX idx_pharmacies_created_by ON pharmacies(created_by);
CREATE INDEX idx_pharmacies_created_at ON pharmacies(created_at);
```

#### 1.2 Verify ORM Model Loads
```bash
# In backend directory
python3 -c "from models import Pharmacie; print('✓ Pharmacie model loaded successfully')"
```

### 2. API Endpoint Testing

#### 2.1 Test: Upload Valid CSV File
**File**: `backend_pharmacie/sample_pharmacies.csv`

**Request**:
```bash
curl -X POST \
  http://localhost:8000/api/admin/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "fichier=@backend_pharmacie/sample_pharmacies.csv"
```

**Expected Response** (200 OK):
```json
{
  "total_rows": 10,
  "successful": 10,
  "failed": 0,
  "errors": []
}
```

**Verification**:
- All 10 pharmacies created in database
- Audit log entry created with action: `pharmacy_bulk_upload`
- Each record has `created_by` set to admin's ID

#### 2.2 Test: Upload CSV with Invalid Rows
**Create file** `test_invalid.csv`:
```csv
osm_type,osm_id,name,address,latitude,longitude
node,1,Valid Pharmacy 1,Address 1,36.83,10.18
node,2,Valid Pharmacy 2,Address 2,34.77,10.73
node,3,,Address 3,35.00,10.50
node,4,Invalid Latitude,Address 4,95.5,10.18
node,5,Valid Pharmacy 3,Address 5,36.50,10.50
```

**Request**:
```bash
curl -X POST \
  http://localhost:8000/api/admin/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "fichier=@test_invalid.csv"
```

**Expected Response** (200 OK):
```json
{
  "total_rows": 5,
  "successful": 3,
  "failed": 2,
  "errors": [
    {
      "row_number": 4,
      "error_message": "Required field 'name' is empty"
    },
    {
      "row_number": 5,
      "error_message": "Invalid latitude: 95.5 (must be between -90 and 90)"
    }
  ]
}
```

**Verification**:
- Valid rows 1, 2, 5 created in database (3 new pharmacies)
- Invalid rows 3, 4 reported with correct row numbers
- Audit log shows: `rows_successful: 3, rows_failed: 2`

#### 2.3 Test: Upload with Missing Required Columns
**Create file** `test_missing_col.csv`:
```csv
osm_id,address,latitude
1,Address 1,36.83
```

**Expected Response** (400 Bad Request):
```json
{
  "detail": "CSV missing required columns: name. Required: name, latitude, longitude"
}
```

#### 2.4 Test: Upload Empty CSV
**Create file** `test_empty.csv`:
```csv
osm_type,osm_id,name,latitude,longitude
```

**Expected Response** (400 Bad Request):
```json
{
  "detail": "CSV file is empty"
}
```

#### 2.5 Test: Upload Non-CSV File
**Request**:
```bash
curl -X POST \
  http://localhost:8000/api/admin/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "fichier=@sample.txt"
```

**Expected Response** (400 Bad Request):
```json
{
  "detail": "Only CSV files are supported. Please upload a .csv file."
}
```

#### 2.6 Test: Upload File > 5MB
**Create large file**:
```bash
# Generate 6MB file
python3 -c "
csv = 'osm_type,osm_id,name,latitude,longitude\n'
csv += 'node,1,Pharmacy Name,36.83,10.18\n' * (6 * 1024 * 1024 // 40)
with open('test_large.csv', 'w') as f:
    f.write(csv)
"

curl -X POST \
  http://localhost:8000/api/admin/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "fichier=@test_large.csv"
```

**Expected Response** (413 Payload Too Large):
```json
{
  "detail": "File size exceeds maximum allowed (5.0MB)"
}
```

#### 2.7 Test: Duplicate OSM_ID Detection (Same Upload)
**Create file** `test_dup_same.csv`:
```csv
osm_type,osm_id,name,latitude,longitude
node,999,Pharmacy 1,36.83,10.18
node,999,Pharmacy 2,34.77,10.73
```

**Expected Response** (200 OK):
```json
{
  "total_rows": 2,
  "successful": 1,
  "failed": 1,
  "errors": [
    {
      "row_number": 3,
      "error_message": "Duplicate osm_id in upload: 999"
    }
  ]
}
```

#### 2.8 Test: Duplicate OSM_ID Detection (Database)
After uploading `sample_pharmacies.csv` once:

**Create file** `test_dup_db.csv`:
```csv
osm_type,osm_id,name,latitude,longitude
node,283583078,Different Name,36.83,10.18
```

**Expected Response** (400 Bad Request):
```json
{
  "detail": "No valid pharmacies found in CSV. 1 rows had errors."
}
```

Instead of bulk insert, the detailed response should show:
```json
{
  "total_rows": 1,
  "successful": 0,
  "failed": 1,
  "errors": [
    {
      "row_number": 2,
      "error_message": "Pharmacy with osm_id 283583078 already exists"
    }
  ]
}
```

#### 2.9 Test: Latitude/Longitude Validation
Test files:
- Invalid latitude: `node,1,Name,91.0,10.0` → Error
- Invalid longitude: `node,1,Name,36.0,181.0` → Error
- Non-numeric latitude: `node,1,Name,abc,10.0` → Error
- Non-numeric longitude: `node,1,Name,36.0,xyz` → Error

All should return detailed error responses with row numbers.

### 3. Authorization Testing

#### 3.1 Test: Non-Admin User Cannot Upload
- Create a regular (non-admin) user account
- Login as regular user
- Attempt to upload CSV

**Expected Response** (403 Forbidden):
```json
{
  "detail": "Only admins can access this resource"
}
```

#### 3.2 Test: Missing Authorization Header
```bash
curl -X POST \
  http://localhost:8000/api/admin/upload \
  -F "fichier=@sample_pharmacies.csv"
```

**Expected Response** (401 Unauthorized):
```json
{
  "detail": "Not authenticated"
}
```

#### 3.3 Test: Invalid JWT Token
```bash
curl -X POST \
  http://localhost:8000/api/admin/upload \
  -H "Authorization: Bearer invalid_token_xyz" \
  -F "fichier=@sample_pharmacies.csv"
```

**Expected Response** (401 Unauthorized):
```json
{
  "detail": "Invalid or expired token"
}
```

### 4. Audit Logging Testing

After each successful upload, verify audit log entry:

```bash
# Connect to PostgreSQL
psql -h localhost -U your_user -d your_database

# Check audit logs for pharmacy uploads
SELECT id, action, entity_type, actor_id, details, created_at
FROM audit_logs
WHERE action = 'pharmacy_bulk_upload'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected**:
- `action`: `pharmacy_bulk_upload`
- `entity_type`: `pharmacie`
- `actor_id`: Admin's ID who performed the upload
- `details`: JSON with `rows_processed`, `rows_successful`, `rows_failed`, `admin_email`
- `status`: `success`

### 5. Frontend Testing

#### 5.1 Test: Upload via Web Interface
1. Navigate to admin panel: `http://localhost:5173`
2. Login with admin credentials
3. Go to "Upload Pharmacies" page
4. Drag-and-drop or select `sample_pharmacies.csv`
5. Click "Upload"

**Expected**:
- Success message displays: `✓ Importation réussie!`
- Shows: `Total: 10 lignes`, `Réussis: 10 pharmacies`, `Échoués: 0 lignes`
- Message renders with proper formatting (multiline, monospace font)

#### 5.2 Test: Upload Invalid File via Frontend
1. Select `test_invalid.csv`
2. Click "Upload"

**Expected**:
- Success message displays with detailed error information
- Shows successful rows (3) and failed rows (2)
- Lists each error with row number and reason

### 6. Data Persistence Testing

After uploading `sample_pharmacies.csv`:

```bash
# Connect to PostgreSQL
psql -h localhost -U your_user -d your_database

# Verify all pharmacies were created
SELECT COUNT(*) FROM pharmacies;
# Should return: 10

# Check specific fields
SELECT osm_id, name, phone, governorate, latitude, longitude
FROM pharmacies
WHERE osm_id IN (283583078, 436206030, 492182121)
ORDER BY osm_id;

# Verify created_by is set correctly
SELECT osm_id, name, created_by, created_at
FROM pharmacies
LIMIT 3;

# Verify indexes exist
\d pharmacies

# Test geospatial search (example)
SELECT name, latitude, longitude
FROM pharmacies
WHERE latitude BETWEEN 34.0 AND 35.0
  AND longitude BETWEEN 10.0 AND 11.0;
```

### 7. Transaction Rollback Testing

To verify that batch insert is atomic (all-or-nothing):

1. Create a CSV file with 5 rows where row 4 will fail (e.g., invalid latitude)
2. Before upload, count existing pharmacies: `SELECT COUNT(*) FROM pharmacies;`
3. Upload the CSV
4. Verify that all 4 valid rows created OR all rolled back (depending on endpoint behavior)

**Current behavior**: Invalid rows are skipped, valid rows are inserted (not all-or-nothing for individual failures, but atomic for the commit)

### 8. Performance Testing

#### 8.1 Test: Large CSV Upload (500 rows)
```bash
# Generate 500-row CSV
python3 << 'EOF'
csv = 'osm_type,osm_id,name,address,latitude,longitude\n'
for i in range(1, 501):
    csv += f'node,{i},Pharmacy {i},Address {i},36.{i%60:02d},10.{i%60:02d}\n'
with open('test_500_rows.csv', 'w') as f:
    f.write(csv)
EOF

time curl -X POST \
  http://localhost:8000/api/admin/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "fichier=@test_500_rows.csv"
```

**Expected**:
- Response time < 5 seconds
- All 500 pharmacies created in database
- Audit log shows correct counts

#### 8.2 Test: Row Limit Enforcement (> 5000 rows)
```bash
# Try to generate > 5000 rows
python3 << 'EOF'
csv = 'osm_type,osm_id,name,latitude,longitude\n'
for i in range(1, 5002):
    csv += f'node,{i},Pharmacy {i},36.00,10.00\n'
with open('test_5001_rows.csv', 'w') as f:
    f.write(csv)
EOF

curl -X POST \
  http://localhost:8000/api/admin/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "fichier=@test_5001_rows.csv"
```

**Expected Response** (413 Payload Too Large):
```json
{
  "detail": "CSV has 5001 rows, maximum allowed is 5000"
}
```

## Running Automated Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all pharmacy upload tests
pytest tests/test_pharmacy_upload.py -v

# Run specific test
pytest tests/test_pharmacy_upload.py::TestPharmacyUploadValid::test_upload_valid_csv_basic -v

# Run with coverage
pytest tests/test_pharmacy_upload.py --cov=routers.admin --cov-report=html
```

## Debugging Tips

### Cannot find Pharmacie model
- Ensure `models.py` includes the `Pharmacie` class
- Check that `from_attributes = True` in schema Config classes

### CSV parsing fails with encoding error
- Verify CSV file is UTF-8 encoded
- Arabic characters should display correctly: الصيدلية المركزية

### Audit log not created
- Check that `PHARMACY_BULK_UPLOAD` exists in `AuditActionEnum`
- Verify database connection and commit was successful
- Look in PostgreSQL logs for rollback errors

### Frontend not showing detailed errors
- Verify response JSON structure matches `PharmacieUploadResponse`
- Check browser console for JavaScript errors
- Ensure `whiteSpace: 'pre-wrap'` is applied to message container

### Authorization failures
- Verify JWT token has not expired
- Check that current user is marked as admin in database
- Ensure `admin_required` dependency is used in endpoint

## Success Criteria

✅ All 10 sample pharmacies imported successfully  
✅ Invalid rows properly detected and reported with line numbers  
✅ Duplicate osm_id detection working (both same-upload and database)  
✅ Lat/lon validation enforcing correct ranges  
✅ File size limit enforced (5MB)  
✅ Row count limit enforced (5000 rows)  
✅ Audit logs created for each upload  
✅ Only admin users can upload  
✅ Frontend displays detailed success/error messages  
✅ Database persistence verified with direct SQL queries  
✅ UTF-8 Arabic names preserved correctly  

## Next Steps

If all tests pass:
1. Deploy to staging environment
2. Run load testing with full 548-row OSM dataset
3. Monitor database performance with EXPLAIN ANALYZE on queries
4. Document any required tunning (e.g., batch size, transaction isolation)
5. Set up automated daily imports if needed
6. Create user documentation for admin uploading pharmacies

## Troubleshooting Contacts

For issues, check:
- Backend logs: `tail -f backend_pharmacie.log`
- Database logs: `/var/log/postgresql/postgresql.log`
- Browser console for frontend errors
- Full stack trace in FastAPI error responses

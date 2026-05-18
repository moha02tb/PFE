-- Migration: Add indexes for pharmacy geospatial queries
-- Purpose: Optimize nearby pharmacy searches and other location-based queries
-- Run: psql -U postgres -d pharmacie_db -f this_file.sql

-- Index on latitude and longitude for bounding box queries
CREATE INDEX IF NOT EXISTS idx_pharmacie_latitude_longitude 
ON pharmacies (latitude, longitude);

-- Index on governorate for region-based searches
CREATE INDEX IF NOT EXISTS idx_pharmacie_governorate 
ON pharmacies (governorate);

-- Composite index for common search patterns
CREATE INDEX IF NOT EXISTS idx_pharmacie_name_governorate 
ON pharmacies (name, governorate);

-- Index for coordinate existence checks
CREATE INDEX IF NOT EXISTS idx_pharmacie_coords_notnull 
ON pharmacies (id) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

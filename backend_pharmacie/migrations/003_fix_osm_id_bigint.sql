-- Migration: Change osm_id column from INTEGER to BIGINT
-- Reason: OpenStreetMap IDs can exceed 32-bit integer limits

ALTER TABLE pharmacies 
ALTER COLUMN osm_id TYPE BIGINT;

-- Update the constraint if it exists
ALTER TABLE pharmacies 
DROP CONSTRAINT IF EXISTS pharmacies_osm_id_key;

ALTER TABLE pharmacies 
ADD CONSTRAINT pharmacies_osm_id_key UNIQUE (osm_id);

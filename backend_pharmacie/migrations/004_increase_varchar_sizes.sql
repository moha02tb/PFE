-- Migration: Increase VARCHAR column sizes for pharmacies table
-- Reason: Phone numbers and osm_type values can exceed their current limits
--         International phone numbers can include extensions and extra digits

-- Increase osm_type from VARCHAR(20) to VARCHAR(50)
ALTER TABLE pharmacies 
ALTER COLUMN osm_type TYPE VARCHAR(50);

-- Increase phone from VARCHAR(20) to VARCHAR(50)
ALTER TABLE pharmacies 
ALTER COLUMN phone TYPE VARCHAR(50);

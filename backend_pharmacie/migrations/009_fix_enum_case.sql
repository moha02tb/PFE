-- Fix enum case mismatches in utilisateurs.source column
-- Convert uppercase enum values to lowercase to match SourceEnum definition

BEGIN;

-- Update source column to use lowercase enum values
UPDATE utilisateurs 
SET source = LOWER(source) 
WHERE source != LOWER(source);

-- Verify the fix
SELECT DISTINCT source FROM utilisateurs;

COMMIT;

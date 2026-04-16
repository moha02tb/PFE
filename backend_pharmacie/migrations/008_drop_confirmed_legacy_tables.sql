-- PostgreSQL cleanup of confirmed obsolete legacy tables.
-- Target database: pharmacie_db
--
-- Preconditions already validated manually:
--   - administrateur / administrateur_backup no longer contain unmigrated admins
--   - utilisateur, pharmacie, pharmacie_brute, fichier_source, import_log, garde, ville
--     are legacy tables not used by the current FastAPI backend
--   - pharmacy_garde is intentionally kept because it still contains data
--
-- This script is destructive. Review row counts and backups before execution.

BEGIN;

-- Old auth/account tables superseded by administrateurs + utilisateurs.
DROP TABLE IF EXISTS administrateur_backup;
DROP TABLE IF EXISTS administrateur;
DROP TABLE IF EXISTS utilisateur;

-- Old pharmacy/import tables superseded by pharmacies.
DROP TABLE IF EXISTS pharmacie;
DROP TABLE IF EXISTS pharmacie_brute;
DROP TABLE IF EXISTS fichier_source;
DROP TABLE IF EXISTS import_log;

-- Empty legacy domain tables that are not part of the current FastAPI ORM.
DROP TABLE IF EXISTS garde;
DROP TABLE IF EXISTS ville;

COMMIT;

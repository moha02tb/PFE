-- PostgreSQL cleanup and alignment for the FastAPI auth/admin architecture.
-- Target database: pharmacie_db
--
-- Canonical application tables:
--   administrateurs, utilisateurs, pharmacies, refresh_tokens, audit_logs, login_attempts
--
-- This migration intentionally does NOT drop non-empty legacy tables such as
-- administrateur, administrateur_backup, or pharmacy_garde. Review those after
-- validating data and downstream usage.

BEGIN;

-- 1. Align utilisateurs with the FastAPI ORM / service layer.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'utilisateurs'
          AND column_name = 'email_verification_code_expires_at'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'utilisateurs'
          AND column_name = 'email_verification_expires_at'
    ) THEN
        ALTER TABLE utilisateurs
        RENAME COLUMN email_verification_code_expires_at TO email_verification_expires_at;
    END IF;
END $$;

ALTER TABLE utilisateurs
    ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

UPDATE utilisateurs
SET email_verified = TRUE
WHERE COALESCE(email_verified, FALSE) = FALSE
  AND email_verification_code IS NULL;

-- 2. Backfill missing admin accounts from legacy tables.
INSERT INTO administrateurs (
    "nomUtilisateur",
    email,
    "motDePasse",
    role,
    is_active,
    created_by,
    created_at,
    updated_at,
    phone,
    bio
)
SELECT
    src."nomUtilisateur",
    src.email,
    src."motDePasse",
    CASE
        WHEN lower(src.role) = 'super_admin' THEN 'super_admin'
        ELSE 'admin'
    END,
    COALESCE(src.is_active, TRUE),
    NULL,
    COALESCE(src.created_at, NOW()),
    src.updated_at,
    NULL,
    NULL
FROM administrateur AS src
WHERE lower(src.role) IN ('admin', 'super_admin')
  AND NOT EXISTS (
      SELECT 1
      FROM administrateurs AS dst
      WHERE dst.email = src.email
         OR dst."nomUtilisateur" = src."nomUtilisateur"
  );

INSERT INTO administrateurs (
    "nomUtilisateur",
    email,
    "motDePasse",
    role,
    is_active,
    created_by,
    created_at,
    updated_at,
    phone,
    bio
)
SELECT
    src."nomUtilisateur",
    src.email,
    src."motDePasse",
    CASE
        WHEN lower(src.role) = 'super_admin' THEN 'super_admin'
        ELSE 'admin'
    END,
    COALESCE(src.is_active, TRUE),
    NULL,
    COALESCE(src.created_at, NOW()),
    src.updated_at,
    NULL,
    NULL
FROM administrateur_backup AS src
WHERE lower(src.role) IN ('admin', 'super_admin')
  AND NOT EXISTS (
      SELECT 1
      FROM administrateurs AS dst
      WHERE dst.email = src.email
         OR dst."nomUtilisateur" = src."nomUtilisateur"
  );

-- 3. Keep only useful indexes for the FastAPI code paths.
DROP INDEX IF EXISTS idx_administrateurs_email;

CREATE INDEX IF NOT EXISTS idx_administrateurs_created_at
    ON administrateurs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_administrateurs_created_by
    ON administrateurs (created_by);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_created_at
    ON utilisateurs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_email_verification_code
    ON utilisateurs (email_verification_code);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_attempted_at
    ON login_attempts (email, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_action
    ON audit_logs (actor_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_action
    ON audit_logs (entity_type, action);
CREATE INDEX IF NOT EXISTS idx_pharmacies_created_at
    ON pharmacies (created_at DESC);

-- 4. Drop duplicate empty legacy tables only when they are empty and have no dependent objects.
DO $$
DECLARE
    candidate text;
    row_count bigint;
BEGIN
    FOREACH candidate IN ARRAY ARRAY[
        'utilisateur',
        'pharmacie',
        'pharmacie_brute',
        'fichier_source',
        'import_log',
        'garde',
        'ville'
    ]
    LOOP
        IF EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = candidate
        ) THEN
            EXECUTE format('SELECT COUNT(*) FROM %I', candidate) INTO row_count;
            IF row_count = 0 THEN
                BEGIN
                    EXECUTE format('DROP TABLE %I', candidate);
                    RAISE NOTICE 'Dropped empty legacy table %', candidate;
                EXCEPTION
                    WHEN dependent_objects_still_exist THEN
                        RAISE NOTICE 'Skipped %, dependent objects still exist', candidate;
                END;
            ELSE
                RAISE NOTICE 'Skipped %, table is not empty (% rows)', candidate, row_count;
            END IF;
        END IF;
    END LOOP;
END $$;

COMMIT;

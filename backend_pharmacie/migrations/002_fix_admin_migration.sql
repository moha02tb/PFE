-- Fix migration: Ensure all admins from backup are in new administrateurs table
-- Note: ON CONFLICT and NOT IN subquery are valid PostgreSQL syntax

-- First, let's check what we're working with
SELECT 'Checking admin migration status...' as status;

-- Copy any remaining admins from backup that aren't in new table
INSERT INTO administrateurs (id, "nomUtilisateur", email, "motDePasse", role, is_active, created_at, updated_at)
SELECT id, "nomUtilisateur", email, "motDePasse", role, is_active, created_at, updated_at
FROM administrateur_backup
WHERE role IN ('admin', 'super_admin')
  AND email NOT IN (SELECT email FROM administrateurs)
ON CONFLICT (email) DO NOTHING;

-- Verify the migration
SELECT 'Admin migration completed!' as status;
SELECT COUNT(*) as total_admins FROM administrateurs;
SELECT COUNT(*) as total_users FROM utilisateurs;

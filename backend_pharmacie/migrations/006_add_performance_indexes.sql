-- Performance indexes for high-frequency backend queries (Phase 2)

CREATE INDEX IF NOT EXISTS idx_administrateurs_email ON administrateurs (email);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs (email);
CREATE INDEX IF NOT EXISTS idx_pharmacies_governorate ON pharmacies (governorate);
CREATE INDEX IF NOT EXISTS idx_pharmacies_osm_id ON pharmacies (osm_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_action ON audit_logs (actor_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_action ON audit_logs (entity_type, action);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_attempted_at ON login_attempts (email, attempted_at DESC);

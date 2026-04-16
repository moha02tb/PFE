-- Migration: Split administrateur table
-- This migration splits the administrateur table into administrateurs and utilisateurs

DROP TABLE IF EXISTS administrateurs;
DROP TABLE IF EXISTS utilisateurs;
DROP TABLE IF EXISTS audit_logs;

-- Backup existing data
CREATE TABLE administrateur_backup AS SELECT * FROM administrateur;

-- Create administrateurs table (admins only)
CREATE TABLE administrateurs (
    id SERIAL PRIMARY KEY,
    "nomUtilisateur" VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    "motDePasse" VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_administrateurs_email ON administrateurs(email);
CREATE INDEX idx_administrateurs_is_active ON administrateurs(is_active);

-- Create utilisateurs table (regular users)
CREATE TABLE utilisateurs (
    id SERIAL PRIMARY KEY,
    "nomUtilisateur" VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    "motDePasse" VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    source VARCHAR(50) NOT NULL DEFAULT 'self_registered',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX idx_utilisateurs_is_active ON utilisateurs(is_active);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    actor_id INTEGER,
    actor_type VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    details TEXT,
    status VARCHAR(20) DEFAULT 'success',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Migrate admin data
INSERT INTO administrateurs (id, "nomUtilisateur", email, "motDePasse", role, is_active, created_at, updated_at)
SELECT id, "nomUtilisateur", email, "motDePasse", role, is_active, created_at, updated_at
FROM administrateur
WHERE role IN ('admin', 'super_admin');

-- Migrate user data
INSERT INTO utilisateurs (id, "nomUtilisateur", email, "motDePasse", is_active, source, created_at, updated_at)
SELECT id, "nomUtilisateur", email, "motDePasse", is_active, 'self_registered', created_at, updated_at
FROM administrateur
WHERE role = 'user';

ALTER TABLE refresh_tokens ADD entity_type VARCHAR(50);
ALTER TABLE refresh_tokens ADD entity_id INTEGER;

-- Update login_attempts table
ALTER TABLE login_attempts ADD entity_type VARCHAR(50);

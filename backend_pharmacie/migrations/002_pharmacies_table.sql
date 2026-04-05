-- Migration: Create pharmacies table
-- This migration creates the pharmacies table for OSM pharmacy data

DROP TABLE IF EXISTS pharmacies;

-- Create pharmacies table
CREATE TABLE pharmacies (
    id SERIAL PRIMARY KEY,
    osm_type VARCHAR(20) NOT NULL DEFAULT 'node',
    osm_id BIGINT UNIQUE,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    phone VARCHAR(20),
    governorate VARCHAR(100),
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES administrateurs(id)
);

-- Create indexes for common queries
CREATE INDEX idx_pharmacies_osm_id ON pharmacies(osm_id);
CREATE INDEX idx_pharmacies_name ON pharmacies(name);
CREATE INDEX idx_pharmacies_governorate ON pharmacies(governorate);
CREATE INDEX idx_pharmacies_created_by ON pharmacies(created_by);
CREATE INDEX idx_pharmacies_created_at ON pharmacies(created_at);

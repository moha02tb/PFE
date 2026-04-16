-- Migration: add profile fields for admin and regular users
-- Adds optional phone and bio columns used by web/mobile profile screens

ALTER TABLE administrateurs
ADD phone VARCHAR(30);

ALTER TABLE administrateurs
ADD bio VARCHAR(500);

ALTER TABLE utilisateurs
ADD phone VARCHAR(30);

ALTER TABLE utilisateurs
ADD bio VARCHAR(500);

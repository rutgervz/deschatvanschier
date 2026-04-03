-- ===========================================
-- De Schat van Schier — Migration v3
-- Run AFTER migration_v2.sql in Supabase SQL Editor
-- Adds: active_budget and active_tier to plans for "dit wordt 'm" functionality
-- ===========================================

ALTER TABLE plans ADD COLUMN IF NOT EXISTS active_budget TEXT DEFAULT '';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS active_tier INTEGER DEFAULT 0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS active_costs_label TEXT DEFAULT '';

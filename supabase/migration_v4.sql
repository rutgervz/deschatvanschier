-- ===========================================
-- De Schat van Schier — Migration v4
-- Run AFTER migration_v3.sql in Supabase SQL Editor
-- Adds: tips and helpers tables
-- ===========================================

CREATE TABLE IF NOT EXISTS tips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id INTEGER REFERENCES plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  reason TEXT NOT NULL,
  tip TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS helpers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id INTEGER REFERENCES plans(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('kind', 'mogelijkmaker')),
  name TEXT NOT NULL,
  motivation TEXT NOT NULL,
  contribution TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tips_plan ON tips(plan_id);
CREATE INDEX IF NOT EXISTS idx_helpers_plan ON helpers(plan_id);

ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE helpers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_tips" ON tips FOR SELECT USING (true);
CREATE POLICY "insert_tips" ON tips FOR INSERT WITH CHECK (true);
CREATE POLICY "read_helpers" ON helpers FOR SELECT USING (true);
CREATE POLICY "insert_helpers" ON helpers FOR INSERT WITH CHECK (true);

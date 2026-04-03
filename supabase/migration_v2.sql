-- ===========================================
-- De Schat van Schier — Migration v2
-- Run AFTER migration.sql in Supabase SQL Editor
-- Adds: enriched canvas, versioned cost estimates
-- ===========================================

-- Enriched canvas: AI-improved version of the plan canvas
CREATE TABLE IF NOT EXISTS enriched_canvas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id INTEGER REFERENCES plans(id) ON DELETE CASCADE UNIQUE,
  for_whom TEXT DEFAULT '',
  why TEXT DEFAULT '',
  need TEXT DEFAULT '',
  challenge TEXT DEFAULT '',
  frameworks TEXT DEFAULT '',
  enablers TEXT DEFAULT '',
  steps TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cost estimate versions: each AI update creates a new version
CREATE TABLE IF NOT EXISTS cost_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id INTEGER REFERENCES plans(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  label TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cost estimate line items: belong to a version
CREATE TABLE IF NOT EXISTS cost_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version_id UUID REFERENCES cost_versions(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES plans(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  amount_low INTEGER DEFAULT 0,
  amount_high INTEGER DEFAULT 0,
  note TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enriched_canvas_plan ON enriched_canvas(plan_id);
CREATE INDEX IF NOT EXISTS idx_cost_versions_plan ON cost_versions(plan_id);
CREATE INDEX IF NOT EXISTS idx_cost_items_version ON cost_items(version_id);
CREATE INDEX IF NOT EXISTS idx_cost_items_plan ON cost_items(plan_id);

-- RLS
ALTER TABLE enriched_canvas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_items ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "read_enriched_canvas" ON enriched_canvas FOR SELECT USING (true);
CREATE POLICY "read_cost_versions" ON cost_versions FOR SELECT USING (true);
CREATE POLICY "read_cost_items" ON cost_items FOR SELECT USING (true);

-- Public write (via service role API)
CREATE POLICY "insert_enriched_canvas" ON enriched_canvas FOR INSERT WITH CHECK (true);
CREATE POLICY "update_enriched_canvas" ON enriched_canvas FOR UPDATE USING (true);
CREATE POLICY "insert_cost_versions" ON cost_versions FOR INSERT WITH CHECK (true);
CREATE POLICY "update_cost_versions" ON cost_versions FOR UPDATE USING (true);
CREATE POLICY "insert_cost_items" ON cost_items FOR INSERT WITH CHECK (true);
CREATE POLICY "delete_cost_items" ON cost_items FOR DELETE USING (true);

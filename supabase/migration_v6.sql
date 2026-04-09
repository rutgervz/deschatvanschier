-- ===========================================
-- De Schat van Schier — Migration v6
-- Adds: site_settings table for feature toggles
-- ===========================================

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "update_settings" ON site_settings FOR UPDATE USING (true);

-- Feature toggles
INSERT INTO site_settings (key, value) VALUES ('show_costs', 'false');

-- Om kosten weer aan te zetten:
-- UPDATE site_settings SET value = 'true', updated_at = NOW() WHERE key = 'show_costs';

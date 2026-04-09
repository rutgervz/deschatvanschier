-- ===========================================
-- De Schat van Schier — Migration v8
-- Adds: voters and votes tables for sleutels voting
-- ===========================================

CREATE TABLE IF NOT EXISTS voters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  group_name TEXT NOT NULL,
  total_keys INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  voter_id UUID REFERENCES voters(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES plans(id) ON DELETE CASCADE,
  keys INTEGER NOT NULL DEFAULT 1 CHECK (keys >= 1 AND keys <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_votes_plan ON votes(plan_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter_id);

ALTER TABLE voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_voters" ON voters FOR SELECT USING (true);
CREATE POLICY "insert_voters" ON voters FOR INSERT WITH CHECK (true);
CREATE POLICY "read_votes" ON votes FOR SELECT USING (true);
CREATE POLICY "insert_votes" ON votes FOR INSERT WITH CHECK (true);

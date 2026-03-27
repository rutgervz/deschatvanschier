-- ===========================================
-- De Schat van Schier — Supabase Migration
-- Run this in Supabase SQL Editor
-- ===========================================

-- Plans table: stores all plan data
CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  team TEXT[] NOT NULL DEFAULT '{}',
  for_whom TEXT DEFAULT '',
  why TEXT DEFAULT '',
  need TEXT DEFAULT '',
  challenge TEXT DEFAULT '',
  frameworks TEXT DEFAULT '',
  enablers TEXT DEFAULT '',
  steps TEXT DEFAULT '',
  budget TEXT DEFAULT '',
  tier INTEGER DEFAULT 3,
  costs JSONB DEFAULT '[]',
  costs_total TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrichments table: AI-generated enrichments per plan
CREATE TABLE IF NOT EXISTS enrichments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id INTEGER REFERENCES plans(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('costs', 'permits', 'contacts', 'tips', 'general')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT DEFAULT 'chat',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table: stores chat history per plan
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id INTEGER REFERENCES plans(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_enrichments_plan_id ON enrichments(plan_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_plan_id ON chat_messages(plan_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(plan_id, created_at);

-- Enable Row Level Security
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Public read plans" ON plans FOR SELECT USING (true);
CREATE POLICY "Public read enrichments" ON enrichments FOR SELECT USING (true);
CREATE POLICY "Public read chat_messages" ON chat_messages FOR SELECT USING (true);

-- Public insert for enrichments and chat (anyone can contribute)
CREATE POLICY "Public insert enrichments" ON enrichments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert chat_messages" ON chat_messages FOR INSERT WITH CHECK (true);

-- Only service role can update/delete
CREATE POLICY "Service update plans" ON plans FOR UPDATE USING (true);
CREATE POLICY "Service delete enrichments" ON enrichments FOR DELETE USING (true);

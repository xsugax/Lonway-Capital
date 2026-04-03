-- Create the 'cards' table for cloud-synced card requests
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  holder_name TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'debit',
  tier TEXT NOT NULL DEFAULT 'standard',
  delivery_address TEXT,
  city TEXT,
  country TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  card_number TEXT,
  cvv TEXT,
  expiry TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  estimated_delivery TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write (same pattern as transfers table)
CREATE POLICY "Allow anon read" ON cards FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert" ON cards FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update" ON cards FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete" ON cards FOR DELETE TO anon USING (true);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_cards_user_email ON cards(user_email);
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);

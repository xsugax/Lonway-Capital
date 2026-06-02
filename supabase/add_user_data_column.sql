-- Run in Supabase SQL Editor after the accounts table exists.
-- Stores vaults, notifications, checkbooks, crypto deposits, etc. (cross-device sync).

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS user_data JSONB DEFAULT '{}';

-- Optional: blocked/frozen flags if not already present
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT false;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS frozen BOOLEAN DEFAULT false;

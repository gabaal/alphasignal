-- Migration: Add price_at_add column to watchlist table
-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE watchlist
ADD COLUMN IF NOT EXISTS price_at_add NUMERIC;

-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'watchlist'
ORDER BY ordinal_position;

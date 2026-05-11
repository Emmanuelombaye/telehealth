-- ============================================================
-- Migration: Add consultation_live column to orders table
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add the column (safe, will skip if already exists)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS consultation_live boolean DEFAULT false;

-- Update existing rows to have false (in case of NULL)
UPDATE public.orders SET consultation_live = false WHERE consultation_live IS NULL;

-- Enable Realtime for the orders table (required for patient dashboard live banner)
-- Go to Supabase Dashboard → Database → Replication → Enable for: orders
-- OR run:
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'consultation_live';

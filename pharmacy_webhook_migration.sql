-- ============================================================
-- pharmacy_webhook_migration.sql
-- Run this in Supabase Dashboard > SQL Editor
-- Adds all columns needed for the automated pharmacy webhook
-- integration (dispatch-prescription + pharmacy-webhook functions)
-- ============================================================

-- 1. Add pharmacy dispatch columns to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pharmacy_name            TEXT,
  ADD COLUMN IF NOT EXISTS pharmacy_confirmation_id TEXT,
  ADD COLUMN IF NOT EXISTS pharmacy_dispatched_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pharmacy_event           TEXT,
  ADD COLUMN IF NOT EXISTS rx_dispatched            BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tracking_url             TEXT,
  ADD COLUMN IF NOT EXISTS estimated_delivery       DATE,
  ADD COLUMN IF NOT EXISTS zoom_status              TEXT,
  ADD COLUMN IF NOT EXISTS zoom_doctor_message      TEXT,
  ADD COLUMN IF NOT EXISTS ndc_code                 TEXT,
  ADD COLUMN IF NOT EXISTS dea_schedule             TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS quantity                 INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS refills_authorized       INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS shipping_address_line1   TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address_line2   TEXT,
  ADD COLUMN IF NOT EXISTS shipping_city            TEXT,
  ADD COLUMN IF NOT EXISTS shipping_state           TEXT,
  ADD COLUMN IF NOT EXISTS shipping_zip             TEXT;

-- 2. Index for fast webhook lookup by order_number
CREATE INDEX IF NOT EXISTS idx_orders_order_number
  ON public.orders (order_number);

-- 3. Index for pharmacy dispatch status
CREATE INDEX IF NOT EXISTS idx_orders_rx_dispatched
  ON public.orders (rx_dispatched);

-- 4. Allow the service_role (Edge Functions) to update orders
--    without RLS blocking (service_role bypasses RLS by default,
--    but we explicitly grant for clarity)
GRANT UPDATE ON public.orders TO service_role;
GRANT SELECT ON public.orders TO service_role;

-- 5. Allow the anon/authenticated role to read tracking info
--    on their own orders (patients can see their tracking)
CREATE POLICY IF NOT EXISTS "Patients can view own order tracking"
  ON public.orders
  FOR SELECT
  USING (
    auth.uid() = patient_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('doctor', 'brand_admin', 'super_admin')
    )
  );

-- 6. Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders'
  AND table_schema = 'public'
  AND column_name IN (
    'pharmacy_name', 'pharmacy_confirmation_id', 'pharmacy_dispatched_at',
    'pharmacy_event', 'rx_dispatched', 'tracking_url', 'estimated_delivery',
    'shipping_address_line1', 'shipping_city', 'shipping_state', 'shipping_zip'
  )
ORDER BY column_name;

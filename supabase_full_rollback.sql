-- ==============================================================================
-- FULL ROLLBACK: Reverses the last 2 SQL commands run on this database
-- Run this in: Supabase Dashboard > SQL Editor
-- ==============================================================================

BEGIN;

-- ============================================================
-- STEP 1: UNDO supabase_inject_enterprise_volume.sql
-- Removes all 8,850 fake seeded orders (RX-VOL- prefix)
-- ============================================================
DELETE FROM public.orders
WHERE order_number LIKE 'RX-VOL-%';

RAISE NOTICE 'Step 1 complete: Removed injected seed orders.';

-- ============================================================
-- STEP 2: UNDO pharmacy_integration_master_v2.sql
-- Part A: Drop the new RLS policies that were created
-- ============================================================
DROP POLICY IF EXISTS "Orders select policy" ON public.orders;
DROP POLICY IF EXISTS "Orders insert policy" ON public.orders;
DROP POLICY IF EXISTS "Orders update policy" ON public.orders;
DROP POLICY IF EXISTS "Pharmacy can update their orders" ON public.orders;

RAISE NOTICE 'Step 2a complete: Removed new RLS policies.';

-- ============================================================
-- Part B: Drop the indexes that were created
-- ============================================================
DROP INDEX IF EXISTS public.idx_orders_order_number;
DROP INDEX IF EXISTS public.idx_orders_rx_dispatched;
DROP INDEX IF EXISTS public.idx_orders_user_id;

RAISE NOTICE 'Step 2b complete: Removed new indexes.';

-- ============================================================
-- Part C: Remove the new columns that were added to orders
-- ============================================================
ALTER TABLE public.orders
  DROP COLUMN IF EXISTS pharmacy_name,
  DROP COLUMN IF EXISTS pharmacy_confirmation_id,
  DROP COLUMN IF EXISTS pharmacy_dispatched_at,
  DROP COLUMN IF EXISTS pharmacy_event,
  DROP COLUMN IF EXISTS rx_dispatched,
  DROP COLUMN IF EXISTS tracking_url,
  DROP COLUMN IF EXISTS estimated_delivery,
  DROP COLUMN IF EXISTS zoom_status,
  DROP COLUMN IF EXISTS zoom_doctor_message,
  DROP COLUMN IF EXISTS ndc_code,
  DROP COLUMN IF EXISTS dea_schedule,
  DROP COLUMN IF EXISTS quantity,
  DROP COLUMN IF EXISTS refills_authorized,
  DROP COLUMN IF EXISTS shipping_address_line1,
  DROP COLUMN IF EXISTS shipping_address_line2,
  DROP COLUMN IF EXISTS shipping_city,
  DROP COLUMN IF EXISTS shipping_state,
  DROP COLUMN IF EXISTS shipping_zip,
  DROP COLUMN IF EXISTS tracking_number;

RAISE NOTICE 'Step 2c complete: Removed pharmacy columns from orders table.';

-- ============================================================
-- FINAL: Restore original safe RLS policies
-- ============================================================
CREATE POLICY "Enable all for authenticated users" ON public.orders
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

RAISE NOTICE '✅ FULL ROLLBACK COMPLETE. Database restored to previous state.';

COMMIT;

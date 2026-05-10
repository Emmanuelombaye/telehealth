-- ============================================================
-- pharmacy_integration_master_v2.sql
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. CLEANUP ALL EXISTING POLICIES ON ORDERS
-- This prevents "column patient_id does not exist" errors from old policies
DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'orders') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders', pol.policyname);
    END LOOP;
END $$;

-- 2. ADD REQUIRED COLUMNS TO ORDERS TABLE
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pharmacy_name            TEXT,
  ADD COLUMN IF NOT EXISTS pharmacy_confirmation_id TEXT,
  ADD COLUMN IF NOT EXISTS pharmacy_dispatched_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pharmacy_event           TEXT,
  ADD COLUMN IF NOT EXISTS rx_dispatched            BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tracking_url             TEXT,
  ADD COLUMN IF NOT EXISTS estimated_delivery       TEXT,
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
  ADD COLUMN IF NOT EXISTS shipping_zip             TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number          TEXT;

-- 3. SETUP INDEXES
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_rx_dispatched ON public.orders (rx_dispatched);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);

-- 4. ENABLE RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 5. NEW SECURE POLICIES (Using 'user_id' as verified in DB)
-- SELECT: Patients see own. Staff see all.
CREATE POLICY "Orders select policy"
  ON public.orders
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('doctor', 'brand_admin', 'super_admin')
    )
  );

-- INSERT: Authenticated users can create
CREATE POLICY "Orders insert policy"
  ON public.orders
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
  );

-- UPDATE: Patients update own. Staff update all.
CREATE POLICY "Orders update policy"
  ON public.orders
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('doctor', 'brand_admin', 'super_admin')
    )
  );

-- 6. PERMISSIONS
GRANT ALL ON public.orders TO service_role;

-- 7. ENSURE STAFF PROFILES EXIST
INSERT INTO public.profiles (id, email, role, full_name)
SELECT id, email, 'brand_admin', 'Brand Administrator'
FROM auth.users
WHERE email = 'admin@peakbodyco.com'
ON CONFLICT (id) DO UPDATE SET role = 'brand_admin';

INSERT INTO public.profiles (id, email, role, full_name)
SELECT id, email, 'doctor', 'Clinical Provider'
FROM auth.users
WHERE email = 'doctor@peakbodyco.com'
ON CONFLICT (id) DO UPDATE SET role = 'doctor';

-- 8. VERIFY
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('pharmacy_name', 'tracking_url', 'user_id');

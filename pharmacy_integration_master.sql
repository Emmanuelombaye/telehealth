-- ============================================================
-- pharmacy_integration_master.sql
-- Run this in Supabase Dashboard > SQL Editor
-- This is the MASTER script for pharmacy automation.
-- It adds required columns and sets up secure RLS access.
-- ============================================================

-- 1. ADD REQUIRED COLUMNS TO ORDERS TABLE
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pharmacy_name            TEXT,
  ADD COLUMN IF NOT EXISTS pharmacy_confirmation_id TEXT,
  ADD COLUMN IF NOT EXISTS pharmacy_dispatched_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pharmacy_event           TEXT,
  ADD COLUMN IF NOT EXISTS rx_dispatched            BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tracking_url             TEXT,
  ADD COLUMN IF NOT EXISTS estimated_delivery       TEXT, -- Changed to TEXT for compatibility with existing data
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
  ADD COLUMN IF NOT EXISTS tracking_number          TEXT; -- Ensuring tracking_number exists

-- 2. SETUP INDEXES
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_rx_dispatched ON public.orders (rx_dispatched);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);

-- 3. RESET RLS POLICIES FOR ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Orders read policy" ON public.orders;
DROP POLICY IF EXISTS "Orders insert policy" ON public.orders;
DROP POLICY IF EXISTS "Orders update policy" ON public.orders;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Patients can view own order tracking" ON public.orders;

-- 4. NEW SECURE POLICIES (Using 'user_id' as verified in DB)
-- READ: Patients see their own. Staff see all.
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

-- INSERT: Authenticated users can create orders
CREATE POLICY "Orders insert policy"
  ON public.orders
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
  );

-- UPDATE: Patients update their own. Staff update all.
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

-- 5. PERMISSIONS FOR EDGE FUNCTIONS
GRANT ALL ON public.orders TO service_role;

-- 6. ENSURE STAFF PROFILES EXIST (Helper)
-- This ensures the admin and doctor users can actually bypass RLS
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

-- 7. VERIFY SCHEMA
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('pharmacy_name', 'tracking_url', 'user_id');

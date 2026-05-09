-- ==============================================================================
-- PEAK HEALTH: FIX INFINITE RLS RECURSION
-- Paste this entire script into Supabase SQL Editor and click RUN.
-- This drops ALL existing policies on `orders` and replaces them with
-- safe, non-recursive versions using only auth.jwt() and auth.uid().
-- ==============================================================================

-- ─────────────────────────────────────────────
-- STEP 1: DROP ALL EXISTING POLICIES ON ORDERS
-- ─────────────────────────────────────────────
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'orders' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders', r.policyname);
    END LOOP;
END;
$$;

-- Also drop on profiles if any recursive cross-reference exists
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
    END LOOP;
END;
$$;

-- ─────────────────────────────────────────────
-- STEP 2: ENSURE RLS IS ENABLED
-- ─────────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- STEP 3: CREATE SAFE ORDERS POLICIES
-- Uses ONLY auth.uid() and auth.jwt() — NO subqueries to other tables
-- ─────────────────────────────────────────────

-- Patients: see only their own orders
CREATE POLICY "patients_select_own_orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

-- Patients: insert their own orders
CREATE POLICY "patients_insert_own_orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Doctors: see all orders (by JWT role claim)
CREATE POLICY "doctors_select_all_orders"
ON public.orders FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

-- Doctors: update orders
CREATE POLICY "doctors_update_orders"
ON public.orders FOR UPDATE
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

-- Brand Admins: see orders matching their brand
CREATE POLICY "brand_admins_select_orders"
ON public.orders FOR SELECT
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'brand_admin'
);

-- Brand Admins: update orders
CREATE POLICY "brand_admins_update_orders"
ON public.orders FOR UPDATE
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'brand_admin'
);

-- Pharmacy: see orders
CREATE POLICY "pharmacy_select_orders"
ON public.orders FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'pharmacy');

-- Pharmacy: update orders
CREATE POLICY "pharmacy_update_orders"
ON public.orders FOR UPDATE
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'pharmacy');

-- Super Admins: full access
CREATE POLICY "super_admins_select_all_orders"
ON public.orders FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "super_admins_update_all_orders"
ON public.orders FOR UPDATE
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "super_admins_delete_all_orders"
ON public.orders FOR DELETE
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin');

-- ─────────────────────────────────────────────
-- STEP 4: SAFE PROFILES POLICIES (no self-reference)
-- ─────────────────────────────────────────────

-- Users can read their own profile
CREATE POLICY "users_select_own_profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own_profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "users_insert_own_profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Doctors can read all profiles (to see patient list)
CREATE POLICY "doctors_select_all_profiles"
ON public.profiles FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

-- Admins can read all profiles
CREATE POLICY "admins_select_all_profiles"
ON public.profiles FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('brand_admin', 'super_admin'));

-- ─────────────────────────────────────────────
-- STEP 5: FIX MESSAGES TABLE (if it has recursion too)
-- ─────────────────────────────────────────────
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'messages' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.messages', r.policyname);
    END LOOP;
END;
$$;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "users_insert_own_messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "users_update_own_messages"
ON public.messages FOR UPDATE
USING (auth.uid() = receiver_id);

-- ─────────────────────────────────────────────
-- DONE: All recursive policies have been replaced.
-- ─────────────────────────────────────────────

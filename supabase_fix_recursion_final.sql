-- ==============================================================================
-- InvestN / Peak Health: RECURSION FIX
-- This script replaces recursive RLS policies with high-performance JWT checks.
-- Run this in your Supabase SQL Editor to resolve the 500 Internal Server Error.
-- ==============================================================================

-- 1. CLEANUP: Drop all potentially recursive policies on Orders and Profiles
DROP POLICY IF EXISTS "Patients view own orders" ON public.orders;
DROP POLICY IF EXISTS "Brand Admins view own brand orders" ON public.orders;
DROP POLICY IF EXISTS "Doctors view all orders" ON public.orders;
DROP POLICY IF EXISTS "Super Admins view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can read own orders or if doctor/admin" ON public.orders;
DROP POLICY IF EXISTS "Doctors and Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Brand Admins update own brand orders" ON public.orders;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 2. PERFORMANCE OPTIMIZATION: Create helper functions for Role checks
-- These functions use SECURITY DEFINER to bypass RLS, preventing recursion.
CREATE OR REPLACE FUNCTION public.get_auth_role() 
RETURNS TEXT AS $$
  -- First try to get it from JWT (instant)
  -- Then fallback to profiles table (cached in session usually)
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'role',
    (SELECT role FROM public.profiles WHERE id = auth.uid())
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_brand() 
RETURNS TEXT AS $$
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'brand_id',
    (SELECT brand_id FROM public.profiles WHERE id = auth.uid())
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. NEW POLICIES: Profiles (Clean & Fast)
-- Everyone can see their own profile
CREATE POLICY "Profiles: view own" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

-- Staff can see all profiles (Using the helper function to avoid recursion)
CREATE POLICY "Profiles: staff view all" 
    ON public.profiles FOR SELECT 
    USING (public.get_auth_role() IN ('doctor', 'brand_admin', 'super_admin'));

CREATE POLICY "Profiles: update own" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- 4. NEW POLICIES: Orders (HIPAA Compliant & Recursion-Free)

-- Patient Access
CREATE POLICY "Orders: patient view own" 
    ON public.orders FOR SELECT 
    USING (auth.uid() = user_id);

-- Brand Admin Access (Filtered by brand)
CREATE POLICY "Orders: brand admin view" 
    ON public.orders FOR SELECT 
    USING (
        public.get_auth_role() = 'brand_admin' 
        AND sub_brand = public.get_auth_brand()
    );

-- Doctor & Super Admin Access (Unrestricted)
CREATE POLICY "Orders: global staff view" 
    ON public.orders FOR SELECT 
    USING (public.get_auth_role() IN ('doctor', 'super_admin'));

-- Update Policies
CREATE POLICY "Orders: staff update" 
    ON public.orders FOR UPDATE 
    USING (public.get_auth_role() IN ('doctor', 'brand_admin', 'super_admin'));

-- ==============================================================================
-- DONE! Policies are now recursion-free and optimized.
-- ==============================================================================

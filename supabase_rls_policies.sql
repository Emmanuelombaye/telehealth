-- ==============================================================================
-- InvestN / Peak Health: Multi-Tenant RLS Policies
-- This script enforces strict HIPAA-compliant Multi-Tenancy for Brands.
-- Copy and Paste this into your Supabase SQL Editor and click "Run"
-- ==============================================================================

-- 1. Enable Row Level Security on the Orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Patients can only see their own orders
CREATE POLICY "Patients view own orders" 
    ON public.orders FOR SELECT 
    USING (
        auth.uid() = user_id 
    );

-- 3. Policy: Brand Admins can only see orders for their specific Brand
CREATE POLICY "Brand Admins view own brand orders" 
    ON public.orders FOR SELECT 
    USING (
        sub_brand = (auth.jwt() -> 'user_metadata' ->> 'brand_id')
        AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'brand_admin'
    );

-- 4. Policy: Doctors (MSO Network) can see ALL global orders 
CREATE POLICY "Doctors view all orders" 
    ON public.orders FOR SELECT 
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor'
    );

-- 5. Policy: Super Admins can see EVERYTHING
CREATE POLICY "Super Admins view all orders" 
    ON public.orders FOR SELECT 
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    );

-- 6. Insert Policies
CREATE POLICY "Patients insert own orders" 
    ON public.orders FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 7. Update Policies
CREATE POLICY "Doctors update orders" 
    ON public.orders FOR UPDATE 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

CREATE POLICY "Brand Admins update own brand orders" 
    ON public.orders FOR UPDATE 
    USING (
        sub_brand = (auth.jwt() -> 'user_metadata' ->> 'brand_id')
        AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'brand_admin'
    );

-- 8. Super Admin Update
CREATE POLICY "Super Admins update all orders" 
    ON public.orders FOR UPDATE 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin');

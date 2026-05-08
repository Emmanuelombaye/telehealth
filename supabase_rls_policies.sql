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
        AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'patient'
    );

-- 3. Policy: Brand Admins can only see orders for their specific Brand
CREATE POLICY "Brand Admins view own brand orders" 
    ON public.orders FOR SELECT 
    USING (
        sub_brand = (SELECT brand_id FROM public.profiles WHERE id = auth.uid())
        AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'brand_admin'
    );

-- 4. Policy: Doctors (MSO Network) can see ALL global orders 
-- (They need to see the global queue across all brands)
CREATE POLICY "Doctors view all orders" 
    ON public.orders FOR SELECT 
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'doctor'
    );

-- 5. Policy: Super Admins can see EVERYTHING
CREATE POLICY "Super Admins view all orders" 
    ON public.orders FOR SELECT 
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    );

-- 6. Insert Policies (Allowing creation of orders)
-- Patients must be allowed to create an order for themselves
CREATE POLICY "Patients insert own orders" 
    ON public.orders FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 7. Update Policies
-- Doctors can update an order (to approve Rx)
-- Brand Admins can update an order (to Ship it) for their brand
CREATE POLICY "Doctors update orders" 
    ON public.orders FOR UPDATE 
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'doctor');

CREATE POLICY "Brand Admins update own brand orders" 
    ON public.orders FOR UPDATE 
    USING (
        sub_brand = (SELECT brand_id FROM public.profiles WHERE id = auth.uid())
        AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'brand_admin'
    );

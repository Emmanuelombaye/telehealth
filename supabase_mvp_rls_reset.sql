-- ==============================================================================
-- MVP RLS RESET: Enables public access for testing and automation scripts
-- ==============================================================================

BEGIN;

-- 1. Reset Orders Table Policies
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Orders select policy" ON public.orders;
DROP POLICY IF EXISTS "Orders insert policy" ON public.orders;
DROP POLICY IF EXISTS "Orders update policy" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable update for all users" ON public.orders;

CREATE POLICY "MVP Public Select" ON public.orders FOR SELECT USING (true);
CREATE POLICY "MVP Public Insert" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "MVP Public Update" ON public.orders FOR UPDATE USING (true);

-- 2. Reset Products Table Policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
CREATE POLICY "MVP Public Product Select" ON public.products FOR SELECT USING (true);

-- 3. Reset Prescriptions Table Policies
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Prescriptions select policy" ON public.prescriptions;
CREATE POLICY "MVP Public Prescription Select" ON public.prescriptions FOR SELECT USING (true);
CREATE POLICY "MVP Public Prescription Insert" ON public.prescriptions FOR INSERT WITH CHECK (true);

COMMIT;

-- ✅ RLS reset to public for MVP testing.

-- Fix RLS for visit_summaries table
-- Allow Doctors to insert and read visit summaries
-- Allow Patients to read their own visit summaries

-- 1. Ensure table has RLS enabled
ALTER TABLE public.visit_summaries ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Doctors can insert visit summaries" ON public.visit_summaries;
DROP POLICY IF EXISTS "Doctors can read visit summaries" ON public.visit_summaries;
DROP POLICY IF EXISTS "Patients can read their own summaries" ON public.visit_summaries;

-- 3. Policy: Doctors can insert (authenticated doctors)
CREATE POLICY "Doctors can insert visit summaries" 
ON public.visit_summaries 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.jwt() ->> 'role' = 'doctor' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'doctor')
);

-- 4. Policy: Doctors can read all summaries for clinical context
CREATE POLICY "Doctors can read visit summaries" 
ON public.visit_summaries 
FOR SELECT 
TO authenticated 
USING (
  auth.jwt() ->> 'role' = 'doctor' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'doctor')
);

-- 5. Policy: Patients can read their own summaries
CREATE POLICY "Patients can read their own summaries" 
ON public.visit_summaries 
FOR SELECT 
TO authenticated 
USING (
  patient_id = auth.uid()
);

GRANT ALL ON public.visit_summaries TO authenticated;
GRANT ALL ON public.visit_summaries TO service_role;

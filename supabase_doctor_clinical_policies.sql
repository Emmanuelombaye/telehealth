-- ==============================================================================
-- InvestN / Peak Health: Doctor & Pharmacy Clinical RLS Policies
-- This script ensures Doctors can read/write clinical data across the platform,
-- while implicitly maintaining the restriction that Admin/SuperAdmin cannot.
-- ==============================================================================

-- 1. Intake Forms (Doctors)
CREATE POLICY "Doctors can view intake forms" 
    ON public.intake_forms FOR SELECT 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

CREATE POLICY "Doctors can update intake forms" 
    ON public.intake_forms FOR UPDATE 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

-- 2. Visit Forms (Doctors)
CREATE POLICY "Doctors can view visit forms" 
    ON public.visit_forms FOR SELECT 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

CREATE POLICY "Doctors can update visit forms" 
    ON public.visit_forms FOR UPDATE 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

-- 3. Prescriptions (Doctors & Pharmacy)
CREATE POLICY "Doctors can view prescriptions" 
    ON public.prescriptions FOR SELECT 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

CREATE POLICY "Doctors can insert prescriptions" 
    ON public.prescriptions FOR INSERT 
    WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

CREATE POLICY "Doctors can update prescriptions" 
    ON public.prescriptions FOR UPDATE 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

CREATE POLICY "Pharmacy can view prescriptions" 
    ON public.prescriptions FOR SELECT 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'pharmacy');

CREATE POLICY "Pharmacy can update prescriptions" 
    ON public.prescriptions FOR UPDATE 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'pharmacy');

-- 4. Visit Summaries (Doctors)
CREATE POLICY "Doctors can view visit summaries" 
    ON public.visit_summaries FOR SELECT 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

-- 5. Lab Results (Doctors)
CREATE POLICY "Doctors can view lab results" 
    ON public.lab_results FOR SELECT 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

CREATE POLICY "Doctors can update lab results" 
    ON public.lab_results FOR UPDATE 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

CREATE POLICY "Doctors can insert lab results" 
    ON public.lab_results FOR INSERT 
    WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

-- 6. Patient Documents (Doctors)
CREATE POLICY "Doctors can view patient documents" 
    ON public.patient_documents FOR SELECT 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

CREATE POLICY "Doctors can upload patient documents" 
    ON public.patient_documents FOR INSERT 
    WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

-- 7. Medical Records (Doctors)
CREATE POLICY "Doctors can view medical records" 
    ON public.medical_records FOR SELECT 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

CREATE POLICY "Doctors can insert medical records" 
    ON public.medical_records FOR INSERT 
    WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

CREATE POLICY "Doctors can update medical records" 
    ON public.medical_records FOR UPDATE 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'doctor');

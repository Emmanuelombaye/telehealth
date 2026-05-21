-- ==============================================================================
-- Remove SuperAdmin audit seed orders that were stored as fake "patients"
-- (patient_name = 'Patient for Peak Health' | VitalCare | GlowRx).
-- Run in Supabase SQL Editor (service role / postgres).
-- ==============================================================================

-- Preview rows to delete
SELECT id, order_number, patient_name, sub_brand, medication, status, created_at
FROM public.orders
WHERE patient_name ILIKE 'Patient for %'
   OR patient_name ILIKE 'Audit Revenue Seed (%'
   OR order_number ILIKE 'SA-TEST-%'
   OR (patient_name ILIKE 'audit medication' AND medication = 'Audit Medication');

-- Optional: vitals tied to those placeholder names (no user_id on audit rows)
DELETE FROM public.vital_readings
WHERE patient_name ILIKE 'Patient for %';

-- Delete audit orders
DELETE FROM public.orders
WHERE patient_name ILIKE 'Patient for %'
   OR patient_name ILIKE 'Audit Revenue Seed (%'
   OR order_number ILIKE 'SA-TEST-%'
   OR (patient_name ILIKE 'audit medication' AND medication = 'Audit Medication');

-- Verify
SELECT COUNT(*) AS remaining_placeholder_orders
FROM public.orders
WHERE patient_name ILIKE 'Patient for %'
   OR order_number ILIKE 'SA-TEST-%';

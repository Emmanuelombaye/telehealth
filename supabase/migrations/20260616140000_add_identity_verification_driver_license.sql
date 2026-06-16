-- =============================================================================
-- Peak Health — Identity Verification Driver's License Support
-- Adds columns to store raw Driver's License details and configures RLS policies
-- so patients can upload and update their ID info client-side.
-- =============================================================================

-- 1. Add Driver's License fields
ALTER TABLE public.identity_verification
  ADD COLUMN IF NOT EXISTS driver_license_number     TEXT,
  ADD COLUMN IF NOT EXISTS driver_license_state      TEXT,
  ADD COLUMN IF NOT EXISTS driver_license_image_path TEXT;

-- 2. Configure RLS Policies
-- Enable users to insert their own verification row
DROP POLICY IF EXISTS "Users insert own identity" ON public.identity_verification;
CREATE POLICY "Users insert own identity"
  ON public.identity_verification
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable users to update their own verification row
DROP POLICY IF EXISTS "Users update own identity" ON public.identity_verification;
CREATE POLICY "Users update own identity"
  ON public.identity_verification
  FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON COLUMN public.identity_verification.driver_license_number IS
  'Raw Driver''s License number inputted by patient.';
COMMENT ON COLUMN public.identity_verification.driver_license_state IS
  'Two-letter US state code for the Driver''s License.';
COMMENT ON COLUMN public.identity_verification.driver_license_image_path IS
  'Storage path for Driver''s License front photo in the patient-documents bucket.';

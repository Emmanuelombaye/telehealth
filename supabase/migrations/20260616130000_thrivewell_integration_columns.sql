-- =============================================================================
-- Peak Health — ThriveWell Rx Integration Columns
-- Tracks the full ThriveWell prescription submission lifecycle per order.
-- All columns added safely with IF NOT EXISTS — zero risk to existing data.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Orders table — ThriveWell lifecycle tracking
-- ---------------------------------------------------------------------------

-- Which ThriveWell endpoint was used: "controlled" | "non-controlled"
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS thrivewell_type            TEXT;

-- ThriveWell flow_number returned on success (e.g. "FLOW00000001")
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS thrivewell_flow_number     TEXT;

-- ThriveWell internal order_id (e.g. "NEWCLINIC-000001")
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS thrivewell_order_id        TEXT;

-- Timestamp this order was successfully submitted to ThriveWell
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS thrivewell_dispatched_at   TIMESTAMPTZ;

-- Whether the ThriveWell API call returned status=success
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS thrivewell_submitted        BOOLEAN DEFAULT false;

-- Raw ThriveWell error message if submission failed (for ops debugging)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS thrivewell_error            TEXT;

-- Patient fields required by ThriveWell but not yet on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS patient_phone              TEXT;    -- patient cell phone
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS patient_gender             TEXT;    -- Male / Female / Other
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS patient_dob                TEXT;    -- YYYY-MM-DD
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS patient_email              TEXT;    -- patient email
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS allergy_information        TEXT;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS patient_current_medication TEXT;

-- Shipping address fields (flat — easier than nested JSONB for edge fn access)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_address_line1     TEXT;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_address_line2     TEXT;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_city              TEXT;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_zip               TEXT;

-- Prescription / medication metadata
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS medication_code            TEXT;    -- NDC code (e.g. "TEST-INV")
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS quantity                   INTEGER;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refills_authorized         INTEGER DEFAULT 0;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS dosage_instructions        TEXT;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS dea_schedule               TEXT;    -- "none" | "II" | "III" | "IV" | "V"
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS ndc_code                   TEXT;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS diagnosis                  TEXT;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS appointment_date           TEXT;    -- YYYY-MM-DD

-- Driver's license (required for controlled substance submissions)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS driver_license             TEXT;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS driver_license_state       TEXT;

-- ---------------------------------------------------------------------------
-- 2. Profiles table — prescribing doctor credentials
-- NPI and DEA are required by ThriveWell for every submission.
-- Stored on the doctor's profile row; looked up by doctor_id on the order.
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS provider_npi               TEXT;    -- 10-digit NPI
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS provider_dea               TEXT;    -- 2 letters + 7 numbers
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS provider_address_line1     TEXT;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS provider_address_line2     TEXT;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS provider_city              TEXT;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS provider_state             TEXT;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS provider_zip               TEXT;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS specialty                  TEXT;

-- ---------------------------------------------------------------------------
-- 3. Indexes for common ops queries
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_thrivewell_flow
  ON public.orders (thrivewell_flow_number)
  WHERE thrivewell_flow_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_thrivewell_dispatched
  ON public.orders (thrivewell_dispatched_at DESC)
  WHERE thrivewell_dispatched_at IS NOT NULL;

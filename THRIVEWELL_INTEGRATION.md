# ThriveWell Rx Integration — Setup & Operations Guide

Covers the end-to-end lifecycle for submitting prescriptions to ThriveWell Rx
through the External Prescription API (`flow.thrivewellrx.com`).

---

## Architecture Overview

```
Doctor clicks "Approve & Dispatch Rx" (pharmacy = ThriveWell Rx)
        │
        ▼
dispatch-prescription  (Edge Function)
        │
        └─► thrivewell-dispatch  (Edge Function — service-to-service)
                │
                ├── dea_schedule ∈ {II, III, IV, V}?
                │       └── POST /prescription/controlled
                │               requires: driver_license_image (Base64) + prescription PDF (Base64)
                │
                └── dea_schedule = "none" / absent?
                        └── POST /prescription/non-controlled
                                (no attachments required)
                │
                ├── On success → orders table updated (status=rx_sent, thrivewell_flow_number, etc.)
                ├── Admin audit log entry written
                └── PHI access log entry written
```

ThriveWell is a **synchronous** API — no incoming webhooks. Confirmation
(`flow_number`, `order_id`) arrives in the HTTP response body and is
immediately persisted to the `orders` table.

---

## Endpoint Routing Logic

| `orders.dea_schedule` | ThriveWell Endpoint | Attachments Required |
|---|---|---|
| `"II"`, `"III"`, `"IV"`, `"V"` (case-insensitive) | `/prescription/controlled` | `driver_license_image` (Base64 JPG/PNG/WEBP) + `encoded_prescription_pdf` (Base64 PDF) |
| `"none"` or absent | `/prescription/non-controlled` | None |

> **Important**: The `/prescription/controlled` endpoint also accepts non-controlled
> medications. If in doubt, prefer the controlled endpoint for patients who have
> previously provided a driver's license image.

---

## Step 1 — Configure Secrets in Supabase

Go to **Supabase Dashboard → Settings → Edge Functions → Secrets** and add:

| Secret Name | Value | Notes |
|---|---|---|
| `THRIVEWELL_USERNAME` | `your_clinic_username` | Provided by ThriveWell pharmacy contact |
| `THRIVEWELL_PASSWORD` | `your_clinic_password` | Provided by ThriveWell pharmacy contact |
| `THRIVEWELL_BASE_URL` | `https://flow.thrivewellrx.com/api` | Use staging URL during testing if available |

> Keep these credentials confidential. ThriveWell uses HTTP Basic Auth —
> they are transmitted on every API call.

---

## Step 2 — Run the Database Migration

```bash
supabase db push
```

This applies `20260616130000_thrivewell_integration_columns.sql` which adds:

**On `orders` table:**
- `thrivewell_type` — `"controlled"` or `"non-controlled"`
- `thrivewell_flow_number` — ThriveWell's internal flow reference (e.g. `FLOW00000001`)
- `thrivewell_order_id` — ThriveWell's clinic-specific order ID (e.g. `NEWCLINIC-000001`)
- `thrivewell_dispatched_at` — timestamp of successful submission
- `thrivewell_submitted` — boolean success flag
- `thrivewell_error` — error message if submission failed
- `patient_phone`, `patient_gender`, `patient_dob`, `patient_email`, `allergy_information`
- `shipping_address_line1/2`, `shipping_city`, `shipping_zip`
- `medication_code`, `quantity`, `refills_authorized`, `dea_schedule`, `ndc_code`
- `diagnosis`, `appointment_date`, `driver_license`, `driver_license_state`

**On `profiles` table (doctor profiles):**
- `provider_npi` — 10-digit NPI number
- `provider_dea` — DEA number (2 letters + 7 digits)
- `provider_address_line1/2`, `provider_city`, `provider_state`, `provider_zip`
- `specialty`

---

## Step 3 — Deploy the Edge Functions

```bash
# Deploy ThriveWell dispatch function
supabase functions deploy thrivewell-dispatch

# Redeploy dispatch-prescription (updated routing)
supabase functions deploy dispatch-prescription
```

> `thrivewell-dispatch` is called from within `dispatch-prescription` via
> service-to-service fetch. JWT verification **must remain ON** for `thrivewell-dispatch`
> since it receives the doctor's Bearer token forwarded from `dispatch-prescription`.

---

## Step 4 — Populate Doctor NPI & DEA

For ThriveWell to accept prescriptions, each prescribing doctor's profile
must have their NPI and DEA on file. Update via Supabase Dashboard → Table Editor → profiles:

```sql
UPDATE public.profiles
SET
  provider_npi           = '1306335955',   -- 10-digit NPI
  provider_dea           = 'BJ1234567',    -- 2 letters + 7 digits
  provider_address_line1 = '900 Commonwealth Place',
  provider_address_line2 = 'Suite 200',
  provider_city          = 'Virginia Beach',
  provider_state         = 'VA',
  provider_zip           = '23464'
WHERE email = 'doctor@yourpractice.com';
```

---

## Step 5 — Populate Order Data Fields

ThriveWell requires patient demographic and shipping data. Ensure these fields
are populated on each order before dispatch. They are typically collected during
patient checkout/enrollment:

| Field | Source |
|---|---|
| `patient_dob` | Enrollment intake form |
| `patient_phone` | Patient profile |
| `patient_gender` | Enrollment intake form |
| `patient_email` | Auth / profile |
| `shipping_address_line1`, `city`, `state`, `zip` | Checkout shipping form |
| `medication_code` / `ndc_code` | Product catalog |
| `dea_schedule` | Product catalog (set to "none" for non-controlled) |

For **controlled substances**, also ensure:
- `driver_license` — patient's DL number
- `driver_license_state` — state abbreviation

---

## Step 6 — Select ThriveWell in Doctor Queue

When a doctor approves an Rx, select **"ThriveWell Rx — External API"** from
the **Pharmacy Destination** dropdown in the Doctor Queue. Then click
**Approve & Dispatch Rx**.

The system will:
1. Detect DEA schedule and pick the right endpoint
2. Call ThriveWell API with full patient + prescriber payload
3. On success: set `status = "rx_sent"` and store `thrivewell_flow_number`
4. Write audit + PHI access log entries

---

## Controlled Substance Attachment Flow (Phase 2)

For controlled substance submissions, ThriveWell requires:
- `driver_license_image` — Base64-encoded JPG/PNG/WEBP of patient's DL
- `encoded_prescription_pdf` — Base64-encoded signed PDF of the prescription

**Current state (Phase 1):** These fields are passed as empty strings.
ThriveWell will return a `422` validation error for controlled substances
until the attachment upload UI is built.

**Recommended Phase 2 implementation:**
1. Add a file upload step to the patient Identity verification page
2. Store the Base64 strings in Supabase Storage (server-side only, not in DB)
3. Pass the storage path to `thrivewell-dispatch` which fetches and Base64-encodes on the fly

---

## Monitoring — Ops Queries

**All ThriveWell submissions today:**
```sql
SELECT order_number, medication, patient_name,
       thrivewell_type, thrivewell_flow_number, thrivewell_dispatched_at, thrivewell_error
FROM orders
WHERE thrivewell_dispatched_at > now() - interval '24 hours'
ORDER BY thrivewell_dispatched_at DESC;
```

**Failed ThriveWell submissions:**
```sql
SELECT order_number, medication, patient_name,
       thrivewell_type, thrivewell_error, pharmacy_dispatched_at
FROM orders
WHERE pharmacy_name = 'ThriveWell Rx'
  AND (thrivewell_submitted = false OR thrivewell_submitted IS NULL)
  AND pharmacy_dispatched_at > now() - interval '7 days'
ORDER BY pharmacy_dispatched_at DESC;
```

**Orders missing NPI (will fail at ThriveWell):**
```sql
SELECT o.order_number, o.medication, o.patient_name, p.email AS doctor_email
FROM orders o
LEFT JOIN profiles p ON p.id = o.doctor_id
WHERE o.pharmacy_name = 'ThriveWell Rx'
  AND (p.provider_npi IS NULL OR trim(p.provider_npi) = '');
```

---

## Staging / Testing

When `THRIVEWELL_USERNAME` or `THRIVEWELL_PASSWORD` are not set, `thrivewell-dispatch`
logs a warning and **simulates** a successful submission — no actual API call is made.
The `thrivewell_flow_number` will be prefixed with `FLOW-SIM-`.

To test with live ThriveWell staging credentials (if provided):
```bash
supabase functions secrets set THRIVEWELL_USERNAME=your_test_username
supabase functions secrets set THRIVEWELL_PASSWORD=your_test_password
supabase functions secrets set THRIVEWELL_BASE_URL=https://flow-staging.thrivewellrx.com/api
```

ThriveWell's test medication NDC codes:
- Non-controlled: `TEST-INV-NC`
- Controlled: `TEST-INV`

---

## Error Reference

| ThriveWell Status Code | Meaning | Action |
|---|---|---|
| `200 success` | Prescription accepted | Normal — flow_number stored |
| `422` | Validation error | Check required fields; see `thrivewell_error` in orders |
| `404` (controlled med on non-controlled endpoint) | Wrong endpoint | Ensure `dea_schedule` is set correctly on the order |
| `401` / `403` | Bad credentials | Verify `THRIVEWELL_USERNAME` + `THRIVEWELL_PASSWORD` |
| Network timeout | ThriveWell API unreachable | Retry manually from ops dashboard |

---

## Files Changed / Created

| File | Change |
|---|---|
| `supabase/functions/thrivewell-dispatch/index.ts` | **NEW** — ThriveWell dispatch edge function |
| `supabase/functions/dispatch-prescription/index.ts` | **MODIFIED** — Added ThriveWell routing branch |
| `supabase/migrations/20260616130000_thrivewell_integration_columns.sql` | **NEW** — DB columns |
| `src/app/pages/doctor/pages/Queue.tsx` | **MODIFIED** — ThriveWell + PMCI added to pharmacy dropdown |
| `.env.production.example` | **MODIFIED** — Documented ThriveWell secret variables |

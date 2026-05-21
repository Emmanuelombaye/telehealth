-- =============================================================================
-- Peak Health — STAGING: implementation probe + gate seed data (idempotent)
-- =============================================================================
--
-- PURPOSE
--   1) Build a temp report of which schema objects exist (tables, columns,
--      functions) that the conditional video + scheduling + admin paths rely on.
--   2) Upsert two catalog products: one VIDEO/SYNC-capable, one plain async,
--      so `npm run check:scheduling-gate` and manual shop flows have clear targets.
--   3) Optionally seed consult_routing_rules + a disposable scheduling_pending row.
--      If those tables are missing (migrations not applied), seeds are SKIPPED
--      with a report row — the script still completes (products seed always runs).
--
-- WHAT THIS FILE CANNOT DO (use Dashboard / Auth API / Edge deploy instead)
--   - Create auth.users or real JWT app_metadata (doctor/patient accounts).
--   - Deploy Calendly webhooks, Resend, Twilio, or Edge functions.
--   - Prove Zoom/Meet links (vendor generates those after booking).
--
-- RUN
--   Supabase SQL Editor → paste entire file → Run once per staging project.
--   Safe to re-run: uses fixed UUIDs + ON CONFLICT / DELETE scoped to GATE-* keys.
--
-- COMPARED TO THE “FULL PRODUCTION GATE” DIAGRAM (features ours may still lack)
--   - Full EHR / Canvas / Healthie charting and clinical document lifecycle.
--   - Hosted observability (Sentry, uptime, log-based alerts) wired to CI.
--   - Automated end-to-end browser tests in CI for shop → webhook → join URL.
--   - State board / credential verification workflows beyond profile fields.
--   - Multi-tenant billing, tax, and pharmacy SLA dashboards in-product.
-- =============================================================================

SET client_min_messages = NOTICE;

-- -----------------------------------------------------------------------------
-- A) Report table (session-local)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS gate_implementation_report;
CREATE TEMP TABLE gate_implementation_report (
  id            serial PRIMARY KEY,
  area          text NOT NULL,
  check_name    text NOT NULL,
  status        text NOT NULL, -- OK | MISSING | WARN | N/A
  detail        text
);

-- -----------------------------------------------------------------------------
-- B) Table inventory (public schema)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'orders',
    'products',
    'profiles',
    'consult_routing_rules',
    'scheduling_pending_bookings',
    'admin_audit_logs',
    'admin_questionnaires',
    'notifications',
    'doctor_invitations',
    'doctor_availability'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      INSERT INTO gate_implementation_report (area, check_name, status, detail)
      VALUES ('schema.table', tbl, 'OK', 'public.' || tbl);
    ELSE
      INSERT INTO gate_implementation_report (area, check_name, status, detail)
      VALUES ('schema.table', tbl, 'MISSING', 'Apply repo migrations / optional legacy SQL');
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- C) orders columns used by video + scheduling + patient Appointments + email
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  col text;
  cols text[] := ARRAY[
    'scheduling_ref',
    'scheduling_booking_url',
    'zoom_status',
    'zoom_join_url',
    'zoom_rescheduled_time',
    'zoom_doctor_message',
    'consultation_time',
    'consultation_live',
    'doctor_id',
    'doctor',
    'patient_email',
    'patient_name',
    'user_id',
    'order_number',
    'intake_answers',
    'patient_vitals',
    'payment_status',
    'stripe_payment_intent_id'
  ];
BEGIN
  FOREACH col IN ARRAY cols LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = col
    ) THEN
      INSERT INTO gate_implementation_report (area, check_name, status, detail)
      VALUES ('orders.column', col, 'OK', 'public.orders.' || col);
    ELSE
      INSERT INTO gate_implementation_report (area, check_name, status, detail)
      VALUES ('orders.column', col, 'MISSING', 'Run latest migrations (orders parity)');
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- D) profiles columns for clinician scheduling
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  col text;
  cols text[] := ARRAY['calendly_url', 'licensed_states', 'patients_count', 'role', 'status', 'full_name'];
BEGIN
  FOREACH col IN ARRAY cols LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = col
    ) THEN
      INSERT INTO gate_implementation_report (area, check_name, status, detail)
      VALUES ('profiles.column', col, 'OK', 'public.profiles.' || col);
    ELSE
      INSERT INTO gate_implementation_report (area, check_name, status, detail)
      VALUES ('profiles.column', col, 'MISSING', 'Extend profiles schema');
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- E) SECURITY DEFINER helpers (RLS / Shop consult_routing_rules fetch)
-- -----------------------------------------------------------------------------
INSERT INTO gate_implementation_report (area, check_name, status, detail)
SELECT
  'function',
  p.proname::text,
  'OK',
  pg_get_function_identity_arguments(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('get_auth_role', 'get_auth_brand');

INSERT INTO gate_implementation_report (area, check_name, status, detail)
SELECT 'function', v.expected, 'MISSING', 'Apply production_core_rbac migration'
FROM (VALUES ('get_auth_role'), ('get_auth_brand')) AS v(expected)
WHERE NOT EXISTS (
  SELECT 1 FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = v.expected
);

-- -----------------------------------------------------------------------------
-- F) RLS snapshot (counts only — cannot prove correctness)
-- -----------------------------------------------------------------------------
INSERT INTO gate_implementation_report (area, check_name, status, detail)
SELECT
  'rls',
  c.relname::text,
  CASE WHEN c.relrowsecurity THEN 'OK' ELSE 'WARN' END,
  'policies=' || (
    SELECT count(*)::text FROM pg_policies pol WHERE pol.schemaname = 'public' AND pol.tablename = c.relname
  )
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN ('orders', 'products', 'profiles', 'consult_routing_rules', 'scheduling_pending_bookings');

-- -----------------------------------------------------------------------------
-- G) Edge / external (cannot verify from SQL alone)
-- -----------------------------------------------------------------------------
INSERT INTO gate_implementation_report (area, check_name, status, detail) VALUES
  ('edge', 'assign-doctor', 'N/A', 'Deploy function + secrets; SQL cannot probe'),
  ('edge', 'email-trigger', 'N/A', 'DB webhook on orders → Resend/Twilio secrets'),
  ('edge', 'calendly-webhook', 'N/A', 'Calendly → Edge URL + signing if used'),
  ('edge', 'merge-scheduling-pending', 'N/A', 'Invoked from patient app after order insert'),
  ('external', 'Calendly / Cal.com live booking', 'N/A', 'Vendor generates Meet/Zoom after patient books');

-- -----------------------------------------------------------------------------
-- H) SEED — two fixed products for “one video, one not” gate (catalog)
-- -----------------------------------------------------------------------------
INSERT INTO public.products (
  id,
  name,
  tagline,
  description,
  price_usd,
  category,
  image_url,
  features,
  popular,
  active
) VALUES (
  '11111111-1111-1111-1111-111111111101'::uuid,
  '[GATE] Video sync protocol (TEST)',
  'Requires scheduled video visit in supported states',
  'Staging-only product: Shop should show embedded scheduler on last intake step when rules match. Remove or deactivate before public launch if undesired.',
  199.00,
  'Weight Loss',
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
  jsonb_build_object(
    'requires_video_consult', true,
    'video_required_states', jsonb_build_array('CA', 'NY', 'TX'),
    'scheduling_embed_url', 'https://calendly.com/telelaunch/discoverycall',
    'gateways', jsonb_build_array('stripe', 'paypal', 'apple_pay', 'google_pay'),
    'questionnaire', jsonb_build_array(
      jsonb_build_object('id', 'gate_bmi', 'label', 'Approximate BMI category', 'type', 'select', 'required', true,
        'options', jsonb_build_array('Under 25', '25–30', '30–35', '35+')),
      jsonb_build_object('id', 'gate_symptom', 'label', 'Any chest pain with exertion?', 'type', 'radio', 'required', true,
        'options', jsonb_build_array('No', 'Yes'))
    ),
    'rating', 4.9,
    'reviews', 120,
    '_gate', jsonb_build_object('marker', 'PH_VIDEO_SYNC', 'created_by', 'scripts/sql/staging_gate_implementation_probe_and_seed.sql')
  ),
  false,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  tagline     = EXCLUDED.tagline,
  description = EXCLUDED.description,
  price_usd   = EXCLUDED.price_usd,
  category    = EXCLUDED.category,
  image_url   = EXCLUDED.image_url,
  features    = EXCLUDED.features,
  popular     = EXCLUDED.popular,
  active      = EXCLUDED.active;

INSERT INTO public.products (
  id,
  name,
  tagline,
  description,
  price_usd,
  category,
  image_url,
  features,
  popular,
  active
) VALUES (
  '22222222-2222-2222-2222-222222222202'::uuid,
  '[GATE] Async-only protocol (TEST)',
  'No sync video requirement in features',
  'Staging-only product: should NOT force Cal embed in Shop when used alone (unless global env or DB routing overrides).',
  89.00,
  'Skincare',
  'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80',
  jsonb_build_object(
    'gateways', jsonb_build_array('stripe', 'paypal', 'apple_pay', 'google_pay'),
    'questionnaire', jsonb_build_array(
      jsonb_build_object('id', 'gate_skin_goal', 'label', 'Primary goal', 'type', 'select', 'required', true,
        'options', jsonb_build_array('Acne', 'Texture', 'Anti-aging'))
    ),
    'rating', 4.7,
    'reviews', 80,
    '_gate', jsonb_build_object('marker', 'PH_ASYNC_ONLY', 'created_by', 'scripts/sql/staging_gate_implementation_probe_and_seed.sql')
  ),
  false,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  tagline     = EXCLUDED.tagline,
  description = EXCLUDED.description,
  price_usd   = EXCLUDED.price_usd,
  category    = EXCLUDED.category,
  image_url   = EXCLUDED.image_url,
  features    = EXCLUDED.features,
  popular     = EXCLUDED.popular,
  active      = EXCLUDED.active;

INSERT INTO gate_implementation_report (area, check_name, status, detail) VALUES
  ('seed.products', '[GATE] Video sync protocol (TEST)', 'OK', 'id=11111111-1111-1111-1111-111111111101'),
  ('seed.products', '[GATE] Async-only protocol (TEST)', 'OK', 'id=22222222-2222-2222-2222-222222222202');

-- -----------------------------------------------------------------------------
-- I) SEED — example consult_routing_rules row (skipped until migration applied)
--     Created by: supabase/migrations/20260516120000_scheduling_correlation_and_routing.sql
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.consult_routing_rules') IS NOT NULL THEN
    INSERT INTO public.consult_routing_rules (
      id,
      priority,
      active,
      match_states,
      match_categories,
      match_product_ids,
      requires_sync_video,
      clinical_json,
      label
    ) VALUES (
      '33333333-3333-3333-3333-333333333303'::uuid,
      5,
      true,
      ARRAY['FL']::text[],
      ARRAY['Weight Loss']::text[],
      ARRAY['11111111-1111-1111-1111-111111111101'::uuid],
      true,
      '{"bmi_min": 35}'::jsonb,
      '[GATE] FL + weight loss + high BMI forces video (example)'
    )
    ON CONFLICT (id) DO UPDATE SET
      priority            = EXCLUDED.priority,
      active                = EXCLUDED.active,
      match_states          = EXCLUDED.match_states,
      match_categories      = EXCLUDED.match_categories,
      match_product_ids     = EXCLUDED.match_product_ids,
      requires_sync_video   = EXCLUDED.requires_sync_video,
      clinical_json         = EXCLUDED.clinical_json,
      label                 = EXCLUDED.label;

    INSERT INTO gate_implementation_report (area, check_name, status, detail)
    SELECT 'seed.consult_routing_rules', id::text, 'OK', coalesce(label, '')
    FROM public.consult_routing_rules
    WHERE id = '33333333-3333-3333-3333-333333333303'::uuid;
  ELSE
    INSERT INTO gate_implementation_report (area, check_name, status, detail) VALUES
      ('seed.consult_routing_rules', 'consult_routing_rules', 'SKIPPED',
       'Table missing — run 20260516120000_scheduling_correlation_and_routing.sql or `supabase db push`, then re-run this script.');
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- J) SEED — disposable scheduling_pending_bookings row (skipped until migration applied)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.scheduling_pending_bookings') IS NOT NULL THEN
    DELETE FROM public.scheduling_pending_bookings
    WHERE scheduling_ref = 'GATE-TEST-SCHEDULING-REF';

    INSERT INTO public.scheduling_pending_bookings (
      scheduling_ref,
      patient_email,
      invitee_name,
      meeting_url,
      consultation_time_iso,
      zoom_status,
      provider,
      raw_payload,
      order_number
    ) VALUES (
      'GATE-TEST-SCHEDULING-REF',
      'gate-test-patient@example.com',
      'Gate Test Patient',
      'https://meet.google.com/gate-test-placeholder',
      timezone('utc'::text, now()) + interval '3 days',
      'confirmed',
      'calendly',
      '{"note": "staging seed — replace with real Calendly payload in integration tests"}'::jsonb,
      NULL
    );

    INSERT INTO gate_implementation_report (area, check_name, status, detail) VALUES
      ('seed.scheduling_pending_bookings', 'GATE-TEST-SCHEDULING-REF', 'OK', 'Delete when finished QA');
  ELSE
    INSERT INTO gate_implementation_report (area, check_name, status, detail) VALUES
      ('seed.scheduling_pending_bookings', 'scheduling_pending_bookings', 'SKIPPED',
       'Table missing — same migration as consult_routing_rules; then re-run this script.');
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- K) SEED — admin_questionnaires template (skipped until migration applied)
--     Created by: supabase/migrations/20260515190000_admin_questionnaires_orders_columns_audit.sql
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.admin_questionnaires') IS NOT NULL THEN
    INSERT INTO public.admin_questionnaires (
      id,
      name,
      slug,
      status,
      questions,
      brand_id
    ) VALUES (
      '44444444-4444-4444-4444-444444444404'::uuid,
      '[GATE] Sample intake (TEST)',
      'gate-sample-intake',
      'draft',
      '[
        {"id":"q1","type":"text","title":"What is your main concern?","required":true},
        {"id":"q2","type":"yes_no","title":"Any allergies to medications?","required":true}
      ]'::jsonb,
      NULL
    )
    ON CONFLICT (id) DO UPDATE SET
      name       = EXCLUDED.name,
      slug       = EXCLUDED.slug,
      status     = EXCLUDED.status,
      questions  = EXCLUDED.questions,
      brand_id   = EXCLUDED.brand_id,
      updated_at = timezone('utc'::text, now());

    INSERT INTO gate_implementation_report (area, check_name, status, detail) VALUES
      ('seed.admin_questionnaires', '[GATE] Sample intake (TEST)', 'OK', 'id=44444444-4444-4444-4444-444444444404');
  ELSE
    INSERT INTO gate_implementation_report (area, check_name, status, detail) VALUES
      ('seed.admin_questionnaires', 'admin_questionnaires', 'SKIPPED',
       'Table missing — run 20260515190000_admin_questionnaires_orders_columns_audit.sql or `supabase db push`, then re-run.');
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- L) Product / rules sanity SELECTs (human-readable)
-- -----------------------------------------------------------------------------
INSERT INTO gate_implementation_report (area, check_name, status, detail)
SELECT
  'verify.catalog',
  'active_product_count',
  'OK',
  count(*)::text || ' active rows in public.products'
FROM public.products WHERE coalesce(active, true);

INSERT INTO gate_implementation_report (area, check_name, status, detail)
SELECT
  'verify.catalog',
  'gate_video_product_features',
  CASE
    WHEN (features ? 'requires_video_consult') AND (features->>'requires_video_consult')::boolean
    THEN 'OK'
    ELSE 'WARN'
  END,
  left(features::text, 400)
FROM public.products
WHERE id = '11111111-1111-1111-1111-111111111101'::uuid;

INSERT INTO gate_implementation_report (area, check_name, status, detail)
SELECT
  'verify.catalog',
  'gate_async_product_features',
  CASE
    WHEN coalesce((features->>'requires_video_consult')::boolean, false) IS NOT TRUE
     AND NOT (features ? 'video_required_states')
    THEN 'OK'
    ELSE 'WARN'
  END,
  left(features::text, 400)
FROM public.products
WHERE id = '22222222-2222-2222-2222-222222222202'::uuid;

-- -----------------------------------------------------------------------------
-- M) REPORT OUTPUT
-- -----------------------------------------------------------------------------
SELECT
  area,
  check_name,
  status,
  detail
FROM gate_implementation_report
ORDER BY
  CASE area
    WHEN 'schema.table' THEN 1
    WHEN 'orders.column' THEN 2
    WHEN 'profiles.column' THEN 3
    WHEN 'function' THEN 4
    WHEN 'rls' THEN 5
    WHEN 'edge' THEN 6
    WHEN 'external' THEN 7
    WHEN 'seed.products' THEN 8
    WHEN 'seed.consult_routing_rules' THEN 9
    WHEN 'seed.scheduling_pending_bookings' THEN 10
    WHEN 'seed.admin_questionnaires' THEN 11
    WHEN 'verify.catalog' THEN 12
    ELSE 99
  END,
  check_name;

SELECT status, count(*) AS n
FROM gate_implementation_report
GROUP BY status
ORDER BY status;

-- -----------------------------------------------------------------------------
-- N) CLEANUP SNIPPET (optional — run manually if you want to remove test rows)
-- -----------------------------------------------------------------------------
/*
DELETE FROM public.scheduling_pending_bookings WHERE scheduling_ref = 'GATE-TEST-SCHEDULING-REF';
DELETE FROM public.consult_routing_rules WHERE id = '33333333-3333-3333-3333-333333333303'::uuid;
DELETE FROM public.admin_questionnaires WHERE id = '44444444-4444-4444-4444-444444444404'::uuid;
UPDATE public.products SET active = false WHERE id IN (
  '11111111-1111-1111-1111-111111111101'::uuid,
  '22222222-2222-2222-2222-222222222202'::uuid
);
*/

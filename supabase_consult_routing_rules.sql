-- Optional: admin-configurable routing (state + category + product + clinical JSON).
-- Run in Supabase SQL Editor if you use the full rules engine from the patient shop.

CREATE TABLE IF NOT EXISTS public.consult_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT true,
  match_states TEXT[] NULL,
  match_categories TEXT[] NULL,
  match_product_ids UUID[] NULL,
  requires_sync_video BOOLEAN NOT NULL DEFAULT true,
  clinical_json JSONB NULL,
  label TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS consult_routing_rules_active_priority
  ON public.consult_routing_rules (active, priority);

ALTER TABLE public.consult_routing_rules ENABLE ROW LEVEL SECURITY;

-- Patient shop loads rules as anon — read-only for active rows.
DROP POLICY IF EXISTS "consult_routing_rules_select_public" ON public.consult_routing_rules;
CREATE POLICY "consult_routing_rules_select_public"
  ON public.consult_routing_rules FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- Mutations: use Supabase SQL Editor or a server-side admin with service role.
-- (No INSERT/UPDATE policies for anon/authenticated.)

COMMENT ON TABLE public.consult_routing_rules IS
  'Peak Health: OR-matched rules for mandatory sync video before Rx. Example: GLP-1 in CA with BMI>=40.';

-- Example (optional): uncomment to seed
-- INSERT INTO public.consult_routing_rules (priority, match_categories, match_states, clinical_json, label)
-- VALUES (
--   10,
--   ARRAY['Weight Loss'],
--   ARRAY['CA'],
--   '{"bmi_min": 40}'::jsonb,
--   'CA weight loss high BMI'
-- );

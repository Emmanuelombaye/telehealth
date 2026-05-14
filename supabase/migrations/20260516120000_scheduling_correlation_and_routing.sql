-- =============================================================================
-- Peak Health — scheduling correlation + consult routing (Cal / Calendly)
-- Idempotent. Apply after production_core / admin_questionnaires migrations.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Orders — stable ref + saved booking page URL (email / appointments UX)
-- -----------------------------------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS scheduling_ref TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS scheduling_booking_url TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_scheduling_ref
  ON public.orders (scheduling_ref)
  WHERE scheduling_ref IS NOT NULL;

COMMENT ON COLUMN public.orders.scheduling_booking_url IS
  'Public booking URL the patient used at enrollment (Calendly/Cal); email fallback when doctor has no calendar URL.';

-- -----------------------------------------------------------------------------
-- 2) Pending Calendly/Cal bookings before order exists (edge: calendly-webhook)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scheduling_pending_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  consumed_at TIMESTAMPTZ,
  scheduling_ref TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  invitee_name TEXT,
  meeting_url TEXT,
  consultation_time_iso TIMESTAMPTZ,
  zoom_status TEXT DEFAULT 'confirmed',
  provider TEXT DEFAULT 'calendly',
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_number TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_scheduling_pending_ref_active
  ON public.scheduling_pending_bookings (scheduling_ref)
  WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_scheduling_pending_email_created
  ON public.scheduling_pending_bookings (patient_email, created_at DESC);

COMMENT ON TABLE public.scheduling_pending_bookings IS
  'Calendly/Cal bookings when no order matched yet; merged into orders via merge-scheduling-pending.';

ALTER TABLE public.scheduling_pending_bookings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.scheduling_pending_bookings FROM PUBLIC;
GRANT ALL ON TABLE public.scheduling_pending_bookings TO service_role;

-- -----------------------------------------------------------------------------
-- 3) Consult routing rules (patient shop reads as anon — see videoConsultRules.ts)
-- -----------------------------------------------------------------------------
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

DROP POLICY IF EXISTS "consult_routing_rules_select_public" ON public.consult_routing_rules;
CREATE POLICY "consult_routing_rules_select_public"
  ON public.consult_routing_rules FOR SELECT
  TO anon, authenticated
  USING (active = true);

DROP POLICY IF EXISTS "consult_routing_super_admin_all" ON public.consult_routing_rules;
CREATE POLICY "consult_routing_super_admin_all"
  ON public.consult_routing_rules FOR ALL TO authenticated
  USING (public.get_auth_role() = 'super_admin')
  WITH CHECK (public.get_auth_role() = 'super_admin');

GRANT SELECT ON TABLE public.consult_routing_rules TO anon, authenticated;
GRANT ALL ON TABLE public.consult_routing_rules TO service_role;

COMMENT ON TABLE public.consult_routing_rules IS
  'Optional rules for mandatory sync video (state/category/product/clinical JSON).';

-- ═══════════════════════════════════════════════════════════════════════════
-- Scheduling correlation: Calendly/Cal bookings before order row exists
-- + stable ref on orders for webhook merge after enrollment submit.
-- Run once in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS scheduling_ref TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_scheduling_ref
  ON public.orders (scheduling_ref)
  WHERE scheduling_ref IS NOT NULL;

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
  'Stores Calendly/Cal bookings when no order row matched yet; merged into orders on submit via merge-scheduling-pending.';

ALTER TABLE public.scheduling_pending_bookings DISABLE ROW LEVEL SECURITY;

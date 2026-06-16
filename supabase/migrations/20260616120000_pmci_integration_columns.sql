-- =============================================================================
-- Peak Health — PMCI Hub Integration Columns
-- Adds columns needed to track the full PMCI email → webhook lifecycle
-- per order without touching existing columns or RLS policies.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Orders table — PMCI lifecycle tracking columns
-- ---------------------------------------------------------------------------

-- When we emailed the PMCI mailbox (doctor approval triggered dispatch)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pmci_dispatched_at       TIMESTAMPTZ;

-- Whether the email was successfully sent (false = delivery error, null = not attempted)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pmci_email_sent          BOOLEAN DEFAULT false;

-- The PMCI integrationPartnerId returned in order.matched
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pmci_partner_id          TEXT;

-- Timestamp PMCI confirmed they matched the order (order.matched event)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pmci_matched_at          TIMESTAMPTZ;

-- Carrier string from order.shipped (e.g. "UPS", "USPS", "FedEx")
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS carrier                  TEXT;

-- Full tracking URL (constructed from carrier + tracking_number if not provided)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_url             TEXT;

-- Estimated delivery date (populated from pharmacy data when available)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS estimated_delivery       TEXT;

-- Human-readable pharmacy name (e.g. "PMCI Hub")
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pharmacy_name            TEXT;

-- Raw pharmacy event string for debugging (last received event)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pharmacy_event           TEXT;

-- Pharmacy confirmation ID returned after dispatch
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pharmacy_confirmation_id TEXT;

-- Timestamp the Rx was dispatched to any pharmacy
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pharmacy_dispatched_at   TIMESTAMPTZ;

-- Flag set true when pharmacy dispatch call succeeded
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS rx_dispatched            BOOLEAN DEFAULT false;

-- ---------------------------------------------------------------------------
-- 2. PMCI webhook events — idempotency log
--    Each incoming webhook is recorded here before processing.
--    If the same (order_id, event) pair already exists → skip (already handled).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pmci_webhook_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  event         TEXT        NOT NULL,          -- "order.matched" | "order.shipped" | "legacy"
  pmci_order_id TEXT        NOT NULL,          -- orderId from PMCI payload
  order_db_id   UUID,                          -- resolved orders.id (null if no match)
  raw_payload   JSONB       NOT NULL,          -- full payload for forensics
  processed     BOOLEAN     NOT NULL DEFAULT false,
  error         TEXT                           -- set if processing failed
);

-- Index for fast duplicate checks
CREATE UNIQUE INDEX IF NOT EXISTS idx_pmci_events_idempotency
  ON public.pmci_webhook_events (pmci_order_id, event);

-- Index for operations dashboard queries
CREATE INDEX IF NOT EXISTS idx_pmci_events_received
  ON public.pmci_webhook_events (received_at DESC);

-- RLS: service_role only (edge functions use service key; no client access needed)
ALTER TABLE public.pmci_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pmci_events_service_only" ON public.pmci_webhook_events;
CREATE POLICY "pmci_events_service_only"
  ON public.pmci_webhook_events
  USING (false);   -- blocks all authenticated/anon; edge fn uses service_role which bypasses RLS

COMMENT ON TABLE public.pmci_webhook_events IS
  'Idempotency log for PMCI Hub webhook events. One row per (pmci_order_id, event). '
  'Prevents duplicate processing on PMCI retries.';

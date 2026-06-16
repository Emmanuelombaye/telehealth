# PMCI Hub Integration — Setup & Operations Guide

This document covers the full lifecycle of the Peak Health ↔ PMCI Hub integration:
email-based order submission and Extended webhook callbacks.

---

## Architecture Overview

```
Doctor approves Rx (dispatch-prescription edge fn)
        │
        ├── pharmacy === "pmci"
        │       │
        │       └── Compose plain-text email (PMCI spec)
        │               └── Send via email-trigger edge fn ──► PMCI Hub mailbox
        │
        └── pharmacy === other  ──► Truepill / REST API (unchanged)


PMCI Hub processes order
        │
        ├── order.matched  (confirmed receipt)
        │       └── POST /functions/v1/pmci-webhook
        │
        └── order.shipped  (in transit + tracking)
                └── POST /functions/v1/pmci-webhook
                        │
                        ├── Idempotency check (pmci_webhook_events table)
                        ├── Update orders table (status, tracking, carrier)
                        └── Insert patient notification (Supabase notifications)
```

---

## Step 1 — Configure Secrets in Supabase

Go to **Supabase Dashboard → Settings → Edge Functions → Secrets** and add:

| Secret Name | Value | Notes |
|---|---|---|
| `PMCI_MAILBOX` | `orders@pmcihub.com` | Provided by PMCI Hub |
| `PMCI_FROM_EMAIL` | `rx@peak-health.io` | Must be whitelisted with PMCI |
| `PMCI_SUBJECT_PREFIX` | `Peak Health Prescription Order Submission` | Agree exact string with PMCI |
| `PMCI_WEBHOOK_SECRET` | `<generated>` | See below |

Generate the webhook secret:
```bash
openssl rand -hex 32
```

Share `PMCI_WEBHOOK_SECRET` with PMCI Hub — they will include it as
`X-PMCI-Signature: sha256=<hmac>` on every webhook call.

---

## Step 2 — Deploy the Edge Functions

```bash
# Deploy new PMCI webhook receiver
supabase functions deploy pmci-webhook --no-verify-jwt

# Redeploy updated dispatch-prescription
supabase functions deploy dispatch-prescription
```

> `--no-verify-jwt` is required on `pmci-webhook` because PMCI Hub calls
> it without a Supabase JWT. Authentication is handled by HMAC signature instead.

---

## Step 3 — Run the Database Migration

```bash
supabase db push
```

This applies `20260616120000_pmci_integration_columns.sql` which:
- Adds PMCI lifecycle columns to `orders` (`pmci_dispatched_at`, `pmci_matched_at`, etc.)
- Creates the `pmci_webhook_events` idempotency table

---

## Step 4 — Give PMCI Your Webhook Endpoint

Provide PMCI Hub with:

```
https://<your-project-ref>.supabase.co/functions/v1/pmci-webhook
```

Request **Extended integration** (not Legacy) so you receive both
`order.matched` and `order.shipped` events.

---

## Step 5 — Select PMCI as Pharmacy in Doctor Queue

When a doctor approves an Rx, pass `"pharmacy": "pmci"` in the
`dispatch-prescription` request body. The function will:

1. Build the PMCI-spec plain-text email body
2. Send it via `email-trigger` to `PMCI_MAILBOX`
3. Set `orders.status = "rx_sent"` and `pmci_email_sent = true`

---

## Webhook Event Reference

### `order.matched`

Received when PMCI successfully parses and matches the email to a patient order.

**What we update on `orders`:**
- `pmci_matched_at` — timestamp from PMCI
- `pmci_partner_id` — PMCI's internal integration partner ID
- `pharmacy_event = "order.matched"`
- `pharmacy_name = "PMCI Hub"`

**Status stays `rx_sent`** — order is confirmed at pharmacy but not yet shipped.

---

### `order.shipped`

Received when medication leaves the pharmacy.

**What we update on `orders`:**
- `status = "shipped"`
- `tracking_number`
- `carrier` (e.g. "UPS")
- `tracking_url` (auto-constructed from carrier + tracking number)
- `pharmacy_event = "order.shipped"`

**Patient notification** is automatically created in `notifications` table,
visible immediately in the Patient Portal → Notifications tab.

---

## Idempotency & Retries

PMCI Hub retries webhooks on non-2xx responses. Our integration handles this safely:

- Every event is logged to `pmci_webhook_events` with a unique index on `(pmci_order_id, event)`
- On retry, if the event was already `processed = true`, we return HTTP 200 immediately
  without re-applying any DB updates
- If the previous attempt failed mid-processing, the row is upserted and the update is retried

---

## Monitoring — Operations Queries

**Check all PMCI events received today:**
```sql
SELECT event, pmci_order_id, received_at, processed, error
FROM pmci_webhook_events
WHERE received_at > now() - interval '24 hours'
ORDER BY received_at DESC;
```

**Find orders where email was sent but never matched (stuck orders):**
```sql
SELECT order_number, medication, patient_name, pmci_dispatched_at, pmci_matched_at
FROM orders
WHERE pmci_email_sent = true
  AND pmci_matched_at IS NULL
  AND pmci_dispatched_at < now() - interval '4 hours'
ORDER BY pmci_dispatched_at DESC;
```

**Find shipped orders by carrier:**
```sql
SELECT order_number, carrier, tracking_number, tracking_url, updated_at
FROM orders
WHERE status = 'shipped'
  AND pharmacy_name = 'PMCI Hub'
ORDER BY updated_at DESC;
```

---

## Staging / Testing

When `PMCI_MAILBOX` or `PMCI_FROM_EMAIL` are not set, `dispatch-prescription`
logs a warning and **simulates** a successful dispatch without sending any email.
This is intentional — it allows full local and staging testing without PMCI credentials.

To simulate a webhook locally:
```bash
curl -X POST http://localhost:54321/functions/v1/pmci-webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"order.matched","orderId":"<your-order-number>","matchedAt":"2026-06-16T12:00:00.000Z","integrationPartnerId":20}'

curl -X POST http://localhost:54321/functions/v1/pmci-webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"order.shipped","orderId":"<your-order-number>","trackingNumber":"1ZK5A6520102397632","carrier":"UPS"}'
```

> Note: Signature verification is skipped when `PMCI_WEBHOOK_SECRET` is not set.
> Always configure it in production.

---

## Files Changed / Created

| File | Change |
|---|---|
| `supabase/functions/pmci-webhook/index.ts` | **NEW** — PMCI Extended webhook receiver |
| `supabase/functions/dispatch-prescription/index.ts` | **MODIFIED** — Added PMCI email dispatch path |
| `supabase/migrations/20260616120000_pmci_integration_columns.sql` | **NEW** — DB columns + idempotency table |
| `.env.production.example` | **MODIFIED** — Documented PMCI secret variables |

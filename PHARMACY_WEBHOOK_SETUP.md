# Pharmacy Webhook — Supabase Edge Functions Deployment

## Step 1: Deploy the Edge Functions to Supabase

Run these commands from the project root (requires Supabase CLI):

```bash
# Login (only needed once)
npx supabase login

# Link to your Supabase project (get project-ref from Supabase Dashboard URL)
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy both pharmacy functions
npx supabase functions deploy pharmacy-webhook
npx supabase functions deploy dispatch-prescription
```

## Step 2: Set Environment Variables in Supabase

Go to: **Supabase Dashboard → Edge Functions → Manage Secrets**

Add these secrets:

| Secret Name | Value | Description |
|---|---|---|
| `PHARMACY_WEBHOOK_SECRET` | `generate-a-random-32-char-string` | Shared secret for HMAC verification. Generate with: `openssl rand -hex 32` |
| `PHARMACY_API_URL` | `https://api.truepill.com/v1/prescriptions` | Pharmacy API endpoint (get from pharmacy partner) |
| `PHARMACY_API_KEY` | `your-pharmacy-api-bearer-token` | Bearer token from pharmacy partner |

> **Note:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically injected — you don't need to add those.

## Step 3: Run the Database Migration

1. Go to **Supabase Dashboard → SQL Editor**
2. Open the file `pharmacy_webhook_migration.sql`
3. Paste and run it

## Step 4: Give Webhook URL to Pharmacy Partner

Tell the pharmacy tech team to send shipment webhooks to:

```
POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/pharmacy-webhook
```

With these headers:
```
Content-Type: application/json
X-Pharmacy-Signature: sha256=<HMAC_SHA256_of_body_using_PHARMACY_WEBHOOK_SECRET>
```

And this payload shape:
```json
{
  "event": "shipped",
  "external_ref": "PEAK-ORDER-123",
  "tracking_number": "9400111899223821623119",
  "carrier": "USPS",
  "tracking_url": "https://tools.usps.com/...",
  "estimated_delivery": "2024-12-10",
  "pharmacy_name": "Truepill",
  "timestamp": "2024-12-08T14:32:00Z"
}
```

### Supported `event` values:
| Pharmacy Event | Peak Health Status |
|---|---|
| `order_received` | `rx_sent` |
| `in_production` | `rx_sent` |
| `shipped` | `shipped` |
| `out_for_delivery` | `shipped` |
| `delivered` | `delivered` |
| `cancelled` | `cancelled` |
| `refill_due` | `refill_eligible` |

## Step 5: Test the Webhook

Use this curl command to simulate a pharmacy webhook (replace the secret):

```bash
BODY='{"event":"shipped","external_ref":"PEAK-ORDER-001","tracking_number":"9400111899223821623119","carrier":"USPS","tracking_url":"https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223821623119","estimated_delivery":"2024-12-10","pharmacy_name":"Truepill","timestamp":"2024-12-08T14:32:00Z"}'

SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "YOUR_PHARMACY_WEBHOOK_SECRET" | sed 's/.* //')

curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/pharmacy-webhook \
  -H "Content-Type: application/json" \
  -H "X-Pharmacy-Signature: sha256=$SIGNATURE" \
  -d "$BODY"
```

Expected response:
```json
{"received":true,"order_id":"...","new_status":"shipped"}
```

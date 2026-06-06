# Partner API test site

Two ways to test integration with a **separate partner frontend**.

## 1. Production pattern (recommended)

API key stays on a small Node proxy — partner site only calls `/api/*`.

```bash
cd d:\telehealth\telehealth
$env:PARTNER_API_KEY = "your-edge-secret"
npm run partner-api:proxy
```

Open http://localhost:5198

## 2. Dev-only (key in browser)

```bash
npm run partner-api:demo
```

Edit `config.js` from `config.example.js`.

## Verify API is deployed

```bash
npm run check:partner-api
$env:PARTNER_API_KEY = "your-secret"
npm run check:partner-api
```

## Docs

- [docs/PARTNER_API.md](../../docs/PARTNER_API.md) — endpoint reference  
- [docs/PARTNER_INTEGRATION.md](../../docs/PARTNER_INTEGRATION.md) — architecture & onboarding

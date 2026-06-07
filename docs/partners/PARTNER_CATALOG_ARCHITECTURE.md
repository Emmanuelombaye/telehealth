# Partner catalog & patient portal routing

Scalable model for **many brands** on one Peak Health platform. Each partner declares how products are sold; the patient portal never hardcodes `/patient/shop` or Peak marketing URLs.

## Catalog modes

| Mode | Who owns products | Shop click in portal | First enrollment |
|------|-------------------|----------------------|------------------|
| `external-catalog` | Partner marketing site (Summit MD) | → `marketingShopUrl` | Partner site → Peak signup → portal |
| `api-catalog` | Partner UI + Partner API catalog | → `/care/{slug}/shop` (Peak enroll, branded) | Partner or Peak shop |
| `peak-shop` | Peak `/care/{slug}/shop` or `/patient/shop` | → branded enroll path | Peak shop |

Register each partner in `src/lib/partners/integrations/*.ts` with `catalogMode`, `marketingShopUrl`, and `handoffSource`.

## Code map

| Layer | Responsibility |
|-------|----------------|
| `src/lib/partners/catalogRouting.ts` | `resolvePatientShopDestination()` — shop href + external flag |
| `src/lib/brands/patientNav.ts` | `usePatientNav()` — all portal paths under `/care/{slug}/patient` |
| `src/app/components/patient/PatientShopLink.tsx` | `<Link>` vs `<a>` for shop |
| `src/app/components/patient/PartnerExternalShopRedirect.tsx` | Blocks Peak catalog for external partners |
| `src/lib/brands/brandDocument.ts` | Tab title, favicon, logo from brand kit |

## Architecture diagram

```mermaid
flowchart TB
  subgraph PartnerSites["Partner marketing sites"]
    SM[Summit MD shop<br/>summitmd.com/shop]
    NS[North Star site<br/>joinnorthstarmd.com]
  end

  subgraph Peak["Peak Health platform — peak-health.io"]
    REG[Partner registry<br/>catalogMode + brand kit]
    AUTH["/care/{slug}/login<br/>signup-first handoff"]
    PORTAL["/care/{slug}/patient<br/>care · orders · messages"]
    SHOP["/care/{slug}/shop<br/>Peak enroll UI"]
    API[Partner API edge<br/>catalog · enroll-start]
  end

  subgraph Modes["catalogMode routing"]
    EXT[external-catalog]
    APIcat[api-catalog]
    PEAK[peak-shop]
  end

  SM -->|"intake + product pick"| AUTH
  AUTH -->|"create account"| PORTAL
  PORTAL -->|"Browse plans click"| REG
  REG --> EXT
  EXT -->|"redirect external"| SM
  REG --> APIcat
  APIcat -->|"internal shop"| SHOP
  REG --> PEAK
  PEAK --> SHOP
  NS -.->|"optional API catalog"| API
  SM -.->|"optional analytics"| API
  SHOP --> PORTAL
```

## Patient journey — Summit MD (external-catalog)

```mermaid
sequenceDiagram
  participant P as Patient
  participant S as Summit MD shop
  participant Peak as Peak /care/summit-md
  participant Portal as Summit-branded portal

  P->>S: Select product + complete intake
  S->>Peak: Open login?mode=signup&source=summitmd-shop
  Peak->>P: Create account (Summit logo, title, theme)
  P->>Portal: /care/summit-md/patient
  Note over Portal: Orders, messages, visits — Summit branding
  P->>Portal: Click Browse plans
  Portal->>S: Redirect to summitmd.com/shop
  Note over Portal,S: Never shows Peak product catalog
```

## Adding a new international partner

1. **Supabase** — `brands` row + `brand_hostnames` (optional).
2. **Static kit** — `src/lib/brands/{slug}.ts` + `src/brand-sites/{slug}/site.ts` (logo URL, theme, copy).
3. **Partner integration** — `src/lib/partners/integrations/{slug}.ts`:
   - `catalogMode`: pick one of three modes above
   - `marketingShopUrl`, `handoffSource`, `defaultAuthMode: "signup"` if shop is external
4. **Register** — `registerPartner()` in `src/lib/partners/index.ts`.
5. **Portal UI** — use `usePatientNav()` and `PatientShopLink`; do not hardcode `/patient/...`.

Peak default (`peak-health` slug) is unchanged: `/patient` + `/patient/shop`.

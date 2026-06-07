# Partner connect — scalable integration

One registry for **API docs**, **products**, **login URLs**, and **branded patient portal** handoff.

**Code:** `src/lib/partners/`

---

## Add a new partner (3 files)

### 1. Brand + site kit (if white-label)

```text
src/lib/brands/myPartner.ts          → ActiveBrand (id, slug, logoUrl)
src/brand-sites/my-partner/site.ts   → theme, copy, hosts
src/brand-sites/index.ts             → add to SITES[]
src/lib/brands/registry.ts           → PARTNER_BRANDS.push(...)
```

### 2. Partner integration registry

Create `src/lib/partners/integrations/myPartner.ts`:

```typescript
import type { PartnerIntegration } from "../types";

export const myPartnerIntegration: PartnerIntegration = {
  slug: "my-partner",
  brandId: "<uuid-from-supabase-brands>",
  displayName: "My Partner",
  handoffSource: "mypartner-shop",       // ?source= on login URL
  marketingShopUrl: "https://partner.com/shop",
  logoUrl: "https://partner.com/logo.png",
  catalogMode: "external-catalog",       // or "api-catalog" | "peak-shop"
  handoffMessage: "Sign in to your patient portal.",
  categoryMap: { subscriptions: "weight-loss" },
};
```

Register in `src/lib/partners/index.ts`:

```typescript
import { myPartnerIntegration } from "./integrations/myPartner";
registerPartner(myPartnerIntegration);
```

### 3. Supabase

Run multi-tenant SQL patterns + issue Partner API key. Deploy `partner-api` edge function.

---

## API docs (no key)

| Tool | URL |
|------|-----|
| Swagger UI | `{PARTNER_API}?action=docs_ui` |
| OpenAPI | `{PARTNER_API}?action=openapi` |
| Health | `{PARTNER_API}?action=health` |
| Connect guide | `{PARTNER_API}?action=connect&brand_slug={slug}` + `X-Partner-Api-Key` |
| Products | `GET ?action=catalog&brand_slug={slug}` + API key |

From app code:

```typescript
import { partnerApiDocs, partnerDevHandoffPacket } from "@/lib/partners";

const docs = partnerApiDocs("summit-md");
// docs.swagger, docs.openapi, docs.catalog, docs.connect

const packet = partnerDevHandoffPacket("summit-md");
// copy/paste env + URLs for external devs
```

---

## Catalog modes

| Mode | Who has products | Peak handoff |
|------|------------------|--------------|
| `external-catalog` | Partner marketing site (SummitMD) | Login → `/care/{slug}/patient` |
| `api-catalog` | `GET catalog` from Partner API | Enroll or login |
| `peak-shop` | Peak `/care/{slug}/shop` | Full Peak enrollment UI |

---

## Login URL (external shop → Peak portal)

```typescript
import { buildPartnerPatientLoginUrl } from "@/lib/partners";

const handoff = buildPartnerPatientLoginUrl("summit-md", {
  category: "subscriptions",
  productId: "<peak-product-uuid>",
});
window.location.href = handoff.loginUrl;
```

Peak login shows **partner logo**, `source` handoff message, and after auth redirects to `/care/{slug}/patient`.

---

## Registered partners

| Slug | Source param | Catalog |
|------|--------------|---------|
| `summit-md` | `summitmd-shop` | external |
| `north-star-md` | `northstar-shop` | api |

See also: [SUMMIT_MD_FRONTEND.md](./SUMMIT_MD_FRONTEND.md), [NORTH_STAR_MD_FRONTEND.md](./NORTH_STAR_MD_FRONTEND.md), [PARTNER_CONNECT.md](../PARTNER_CONNECT.md).

# Summit MD — site kit

**Integration registry:** `src/lib/partners/integrations/summitMd.ts`  
**Connect guide:** [docs/partners/README.md](../../../docs/partners/README.md)

```typescript
import { buildPartnerPatientLoginUrl, partnerApiDocs } from "@/lib/partners";

partnerApiDocs("summit-md"); // Swagger, catalog, connect URLs
buildPartnerPatientLoginUrl("summit-md", { category: "subscriptions" });
```

| Portal | URL |
|--------|-----|
| Patient login | `/care/summit-md/login?brand=summit-md&brandId=7caaa526-…&source=summitmd-shop` |
| Patient app | `/care/summit-md/patient` |

Marketing shop lives on **summitmd.vercel.app** — not Peak `/shop`.

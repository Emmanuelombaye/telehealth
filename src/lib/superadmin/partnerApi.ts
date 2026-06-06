/** Partner API base — used by Super Admin integration panel */
export function partnerApiBaseUrl(): string {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  if (url) return `${url.replace(/\/$/, "")}/functions/v1/partner-api`;
  return "https://kvopgyhcjcniaocjozje.supabase.co/functions/v1/partner-api";
}

export function partnerApiDocsUiUrl(): string {
  return `${partnerApiBaseUrl()}?action=docs_ui`;
}

export function partnerApiOpenApiUrl(): string {
  return `${partnerApiBaseUrl()}?action=openapi`;
}

export function partnerApiConnectUrl(brandSlug: string): string {
  return `${partnerApiBaseUrl()}?action=connect&brand_slug=${encodeURIComponent(brandSlug)}`;
}

export function partnerApiCurlExamples(opts: {
  brandSlug: string;
  apiKey?: string;
}) {
  const base = partnerApiBaseUrl();
  const key = opts.apiKey?.trim() || "YOUR_API_KEY";
  const slug = opts.brandSlug;
  return {
    health: `curl "${base}?action=health"`,
    catalog: `curl -H "X-Partner-Api-Key: ${key}" "${base}?action=catalog&brand_slug=${slug}"`,
    brand: `curl -H "X-Partner-Api-Key: ${key}" "${base}?action=brand&brand_slug=${slug}"`,
    enrollment_start: `curl -X POST "${base}" -H "X-Partner-Api-Key: ${key}" -H "Content-Type: application/json" -d "{\\"action\\":\\"enrollment_start\\",\\"brand_slug\\":\\"${slug}\\",\\"category\\":\\"weight-loss\\"}"`,
  };
}

export type PartnerApiKeyRow = {
  id: string;
  brand_id: string;
  label: string;
  key_prefix: string;
  status: string;
  last_used_at: string | null;
  created_at: string;
};

export type BrandHostnameRow = {
  id: string;
  brand_id: string;
  hostname: string;
  host_kind: "marketing" | "care" | "admin" | "affiliate" | "api";
  is_primary: boolean;
  created_at?: string;
};

export type IssuedPartnerKey = {
  id: string;
  api_key: string;
  key_prefix: string;
  brand_slug: string;
  label: string;
};

export function slugifyBrandName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function partnerHandoffPacket(opts: {
  brandName: string;
  brandSlug: string;
  brandId: string;
  apiKey?: string;
  portalOrigin?: string | null;
}) {
  const base = partnerApiBaseUrl();
  const curls = partnerApiCurlExamples({
    brandSlug: opts.brandSlug,
    apiKey: opts.apiKey,
  });
  const lines = [
    `Partner: ${opts.brandName}`,
    `brand_slug: ${opts.brandSlug}`,
    `brand_id: ${opts.brandId}`,
    `API base: ${base}`,
    `Auth header: X-Partner-Api-Key`,
    "",
    "Connect (share these links):",
    `  Interactive API docs (try in browser): ${partnerApiDocsUiUrl()}`,
    `  OpenAPI (Postman import): ${partnerApiOpenApiUrl()}`,
    `  Connect guide JSON (with API key): GET ${partnerApiConnectUrl(opts.brandSlug)}`,
    "",
    "Quick test (curl):",
    curls.health,
    curls.catalog,
    "",
    "Enrollment handoff:",
    curls.enrollment_start,
    "",
    "Rule: API key on partner server only — never in public JavaScript.",
    "Full spec: docs/PARTNER_API.md (under NDA)",
  ];
  if (opts.apiKey) lines.splice(4, 0, `API key (share once): ${opts.apiKey}`);
  if (opts.portalOrigin) lines.push(`portal_origin: ${opts.portalOrigin}`);
  return lines.join("\n");
}

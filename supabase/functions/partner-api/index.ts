/**
 * partner-api — Private Partner Integration API (v1)
 *
 * Partners with their own marketing site call this API (server-side recommended).
 * Branded enrollment + patient portals remain on Peak Health UI (/care/{slug}/…).
 *
 * Auth: header X-Partner-Api-Key
 *   - partner_api_keys table (issued from Super Admin UI), or
 *   - PARTNER_API_KEY (single demo key), or
 *   - PARTNER_API_KEYS JSON: {"north-star-md":"secret…","another-brand":"secret…"}
 *
 * GET  ?action=health|docs|brand|catalog|portals
 * POST { action: enrollment_start, brand_slug, category?, portal_origin?, return_url? }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsPreflightResponse, htmlResponse, jsonResponse } from "../_shared/cors.ts";
import {
  PARTNER_API_VERSION,
  partnerApiCurlExamples,
  partnerApiDocsHtml,
  partnerApiOpenApiSpec,
  partnerConnectGuide,
} from "../_shared/partnerApiOpenApi.ts";

const API_VERSION = PARTNER_API_VERSION;

type PartnerAuth = { ok: true; boundBrandSlug?: string } | { ok: false };

function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(url, key, { auth: { persistSession: false } });
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function resolvePartnerAuthFromDb(provided: string): Promise<PartnerAuth> {
  if (provided.length < 12) return { ok: false };

  const prefix = provided.slice(0, 12);
  const hash = await sha256Hex(provided);
  const sb = getServiceClient();

  const { data, error } = await sb
    .from("partner_api_keys")
    .select("id, brand_id, brands!inner(slug)")
    .eq("key_prefix", prefix)
    .eq("key_hash", hash)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) return { ok: false };

  const brandSlug = (data as { brands?: { slug?: string } }).brands?.slug;
  void sb
    .from("partner_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", (data as { id: string }).id);

  return { ok: true, boundBrandSlug: brandSlug };
}

async function resolvePartnerAuth(req: Request): Promise<PartnerAuth> {
  const provided =
    req.headers.get("X-Partner-Api-Key")?.trim() ||
    req.headers.get("x-partner-api-key")?.trim() ||
    "";
  if (!provided) return { ok: false };

  const single = (Deno.env.get("PARTNER_API_KEY") ?? "").trim();
  if (single && provided === single) return { ok: true };

  const multiRaw = (Deno.env.get("PARTNER_API_KEYS") ?? "").trim();
  if (multiRaw) {
    try {
      const map = JSON.parse(multiRaw) as Record<string, string>;
      for (const [slug, key] of Object.entries(map)) {
        if (key && provided === key.trim()) {
          return { ok: true, boundBrandSlug: slug === "*" ? undefined : slug };
        }
      }
    } catch {
      /* invalid JSON */
    }
  }

  return await resolvePartnerAuthFromDb(provided);
}

function appOrigin(): string {
  return (
    (Deno.env.get("PEAK_APP_ORIGIN") ?? Deno.env.get("PUBLIC_APP_ORIGIN") ?? "")
      .trim()
      .replace(/\/$/, "") || "https://www.peak-health.io"
  );
}

const STATIC_BRANDS: Record<
  string,
  { id: string; name: string; slug: string; domain: string; status: string }
> = {
  "north-star-md": {
    id: "c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c",
    name: "North Star MD",
    slug: "north-star-md",
    domain: "northstarmd.com",
    status: "active",
  },
  "peak-health": {
    id: "8eba7f8c-70ed-4b06-aa10-c7772b6fa0a8",
    name: "Peak Health",
    slug: "peak-health",
    domain: "peak-health.io",
    status: "active",
  },
};

async function resolveBrand(slug: string) {
  const s = slug.trim().toLowerCase();
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("brands")
    .select("id, name, slug, domain, status, portal_origin")
    .eq("slug", s)
    .maybeSingle();

  if (error) return { error: error.message, brand: null };
  if (data) return { error: null, brand: data };
  if (STATIC_BRANDS[s]) return { error: null, brand: STATIC_BRANDS[s] };
  return { error: "Brand not found", brand: null };
}

async function resolvePortalOrigin(
  brand: { id: string; slug: string; portal_origin?: string | null; domain?: string | null },
  override?: string,
): Promise<string> {
  if (override?.trim()) return override.trim().replace(/\/$/, "");

  if (brand.portal_origin?.trim()) return brand.portal_origin.trim().replace(/\/$/, "");

  const sb = getServiceClient();
  const { data: careHost } = await sb
    .from("brand_hostnames")
    .select("hostname")
    .eq("brand_id", brand.id)
    .eq("host_kind", "care")
    .eq("is_primary", true)
    .maybeSingle();

  if (careHost?.hostname) {
    const host = String(careHost.hostname).replace(/^www\./, "");
    return `https://${host}`;
  }

  const { data: marketingHost } = await sb
    .from("brand_hostnames")
    .select("hostname")
    .eq("brand_id", brand.id)
    .eq("host_kind", "marketing")
    .eq("is_primary", true)
    .maybeSingle();

  if (marketingHost?.hostname) {
    const host = String(marketingHost.hostname).replace(/^www\./, "");
    return `https://${host}`;
  }

  if (brand.domain) return `https://${String(brand.domain).replace(/^www\./, "")}`;
  return appOrigin();
}

async function portalUrls(
  brand: { id: string; slug: string; portal_origin?: string | null; domain?: string | null },
  opts?: { category?: string; portalOrigin?: string; returnUrl?: string; productId?: string },
) {
  const base = await resolvePortalOrigin(brand, opts?.portalOrigin);
  const params = new URLSearchParams({ brand: brand.slug, brandId: brand.id });
  if (opts?.category) params.set("category", opts.category);
  if (opts?.productId) params.set("product", opts.productId);
  if (opts?.returnUrl) params.set("partner_return_url", opts.returnUrl);
  const q = params.toString();
  const careBase = `${base.replace(/\/$/, "")}/care/${brand.slug}`;

  return {
    enrollment_url: `${careBase}/shop?${q}`,
    patient_portal_url: `${careBase}/patient`,
    patient_login_url: `${careBase}/login`,
    brand_admin_url: `${careBase}/admin/login`,
    affiliate_portal_url: `${careBase}/affiliate/login`,
    provider_portal_url: `${base.replace(/\/$/, "")}/providers/login`,
  };
}

function partnerApiBaseUrl(): string {
  return `${(Deno.env.get("SUPABASE_URL") ?? "").replace(/\/$/, "")}/functions/v1/partner-api`;
}

function apiDocsPayload() {
  const base = partnerApiBaseUrl();
  const exampleSlug = "north-star-md";
  return {
    service: "partner-api",
    version: API_VERSION,
    visibility: "private",
    audience:
      "White-label partners with their own website — not a public API. Credentials issued under contract only.",
    partner_model: {
      partner_owns: ["marketing website", "homepage", "store UX", "Get started buttons"],
      peak_owns: [
        "branded portals (shop, patient, admin, affiliate)",
        "PHI checkout intake clinical workflows",
        "Supabase tenant data",
      ],
      connection:
        "Partner backend calls this API (server-side). Browser redirects to enrollment_url on branded care subdomain.",
      documentation_human: "docs/PARTNER_MODEL.md",
      documentation_technical: "docs/PARTNER_API.md",
    },
    documentation: "docs/PARTNER_API.md",
    base_url: base,
    docs_ui_url: `${base}?action=docs_ui`,
    openapi_url: `${base}?action=openapi`,
    postman_import: `Import ${base}?action=openapi into Postman (Import → Link) or Insomnia`,
    authentication: {
      header: "X-Partner-Api-Key",
      note: "Call from partner backend in production; never expose key in public JS.",
    },
    endpoints: [
      { method: "GET", action: "health", auth: false, description: "Uptime check" },
      { method: "GET", action: "docs", auth: false, description: "This machine-readable index" },
      { method: "GET", action: "docs_ui", auth: false, description: "Interactive Swagger UI (try endpoints)" },
      { method: "GET", action: "openapi", auth: false, description: "OpenAPI 3.0 JSON for Postman / codegen" },
      { method: "GET", action: "brand", auth: true, query: ["brand_slug"], description: "Brand metadata + portal URLs" },
      { method: "GET", action: "portals", auth: true, query: ["brand_slug"], description: "Alias for brand (portals only)" },
      { method: "GET", action: "catalog", auth: true, query: ["brand_slug"], description: "Active products + enrollment links (optional if partner uses own catalog)" },
      { method: "GET", action: "connect", auth: true, query: ["brand_slug"], description: "Brand-specific connect guide (steps, curl, env example)" },
      {
        method: "POST",
        action: "enrollment_start",
        auth: true,
        body: ["brand_slug", "category?", "portal_origin?", "return_url?", "product_id?"],
        description: "Hand off patient to branded Peak enrollment shop",
      },
    ],
    curl_examples: partnerApiCurlExamples(base, exampleSlug),
    integration_flow: [
      "Partner site loads catalog via GET catalog",
      "User clicks Get Started → POST enrollment_start",
      "Redirect browser to enrollment_url (Peak branded portal)",
      "Checkout, intake, clinical care complete on Peak portals",
    ],
    quick_start: [
      `Open interactive docs: ${base}?action=docs_ui`,
      `Import OpenAPI: ${base}?action=openapi`,
      `Verify: curl "${base}?action=health"`,
    ],
  };
}

function assertBrandAccess(auth: PartnerAuth, brandSlug: string): Response | null {
  if (!auth.ok) return null;
  if (auth.boundBrandSlug && auth.boundBrandSlug !== brandSlug.trim().toLowerCase()) {
    return jsonResponse(
      {
        error: "Forbidden",
        hint: `This API key is scoped to brand "${auth.boundBrandSlug}" only`,
      },
      403,
    );
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflightResponse();

  const url = new URL(req.url);
  const action = url.searchParams.get("action")?.trim().toLowerCase() || "";

  if (action === "health" && req.method === "GET") {
    return jsonResponse({
      ok: true,
      service: "partner-api",
      version: API_VERSION,
      auth_configured:
        !!(Deno.env.get("PARTNER_API_KEY") ?? "").trim() ||
        !!(Deno.env.get("PARTNER_API_KEYS") ?? "").trim(),
    });
  }

  if (action === "docs" && req.method === "GET") {
    return jsonResponse(apiDocsPayload());
  }

  if (action === "openapi" && req.method === "GET") {
    return jsonResponse(partnerApiOpenApiSpec(partnerApiBaseUrl()));
  }

  if (action === "docs_ui" && req.method === "GET") {
    return htmlResponse(partnerApiDocsHtml(partnerApiBaseUrl()));
  }

  const auth = await resolvePartnerAuth(req);
  if (!auth.ok) {
    return jsonResponse(
      {
        error: "Unauthorized",
        hint: "Send X-Partner-Api-Key (PARTNER_API_KEY or PARTNER_API_KEYS edge secret)",
      },
      401,
    );
  }

  try {
    const handleBrand = async (brandSlug: string, extra?: Parameters<typeof portalUrls>[1]) => {
      const denied = assertBrandAccess(auth, brandSlug);
      if (denied) return denied;

      const { error, brand } = await resolveBrand(brandSlug);
      if (error || !brand) return jsonResponse({ error: error ?? "Brand not found" }, 404);

      return jsonResponse({
        brand: {
          id: brand.id,
          slug: brand.slug,
          name: brand.name,
          domain: brand.domain,
          status: brand.status,
        },
        portals: await portalUrls(brand, extra),
      });
    };

    if (req.method === "GET" && action === "connect") {
      const brandSlug = url.searchParams.get("brand_slug") ?? auth.boundBrandSlug ?? "";
      if (!brandSlug) return jsonResponse({ error: "brand_slug required" }, 400);

      const denied = assertBrandAccess(auth, brandSlug);
      if (denied) return denied;

      const { error, brand } = await resolveBrand(brandSlug);
      if (error || !brand) return jsonResponse({ error: error ?? "Brand not found" }, 404);

      return jsonResponse(
        partnerConnectGuide(partnerApiBaseUrl(), {
          slug: brand.slug,
          id: brand.id,
          name: brand.name,
          portal_origin: brand.portal_origin ?? null,
        }),
      );
    }

    if (req.method === "GET" && (action === "brand" || action === "portals")) {
      const brandSlug = url.searchParams.get("brand_slug") ?? auth.boundBrandSlug ?? "";
      if (!brandSlug) return jsonResponse({ error: "brand_slug required" }, 400);
      return await handleBrand(brandSlug);
    }

    if (req.method === "GET" && action === "catalog") {
      const brandSlug = url.searchParams.get("brand_slug") ?? auth.boundBrandSlug ?? "";
      if (!brandSlug) return jsonResponse({ error: "brand_slug required" }, 400);

      const denied = assertBrandAccess(auth, brandSlug);
      if (denied) return denied;

      const { error, brand } = await resolveBrand(brandSlug);
      if (error || !brand) return jsonResponse({ error: error ?? "Brand not found" }, 404);

      const sb = getServiceClient();
      const { data: products, error: pe } = await sb
        .from("products")
        .select("id, name, category, tagline, price_usd, active")
        .eq("active", true)
        .order("name");

      if (pe) return jsonResponse({ error: pe.message }, 500);

      const urls = await portalUrls(brand);
      const items = await Promise.all(
        (products ?? []).map(async (p) => {
          const withProduct = await portalUrls(brand, {
            category: p.category ? String(p.category) : undefined,
            productId: String(p.id),
          });
          return {
            id: p.id,
            name: p.name,
            category: p.category,
            tagline: p.tagline,
            price_usd: p.price_usd,
            enrollment_url: withProduct.enrollment_url,
          };
        }),
      );

      return jsonResponse({
        brand: { id: brand.id, slug: brand.slug, name: brand.name },
        products: items,
        portals: urls,
      });
    }

    if (req.method === "POST") {
      let body: Record<string, unknown> = {};
      try {
        body = await req.json();
      } catch {
        return jsonResponse({ error: "Invalid JSON body" }, 400);
      }

      const postAction = String(body.action ?? action ?? "").trim().toLowerCase();

      if (postAction === "enrollment_start") {
        const brandSlug = String(body.brand_slug ?? auth.boundBrandSlug ?? "").trim();
        if (!brandSlug) return jsonResponse({ error: "brand_slug required" }, 400);

        const denied = assertBrandAccess(auth, brandSlug);
        if (denied) return denied;

        const { error, brand } = await resolveBrand(brandSlug);
        if (error || !brand) return jsonResponse({ error: error ?? "Brand not found" }, 404);

        const portals = await portalUrls(brand, {
          category: body.category ? String(body.category) : undefined,
          portalOrigin: body.portal_origin ? String(body.portal_origin) : undefined,
          returnUrl: body.return_url ? String(body.return_url) : undefined,
          productId: body.product_id ? String(body.product_id) : undefined,
        });

        return jsonResponse({
          session_id: crypto.randomUUID(),
          brand: { id: brand.id, slug: brand.slug, name: brand.name },
          ...portals,
          next_step: "redirect",
          message:
            "Send the patient to enrollment_url. PHI, payments, and clinical workflows run on Peak branded portals.",
        });
      }
    }

    return jsonResponse(
      {
        error: "Unknown action",
        hint: "GET ?action=docs for endpoint list",
      },
      400,
    );
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "Internal error" }, 500);
  }
});

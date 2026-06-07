import type { PartnerApiDocs, PartnerIntegration, PartnerLoginHandoff } from "./types";
import { getPartnerByHandoffSource, getPartnerBySlug } from "./registry";

const DEFAULT_PARTNER_API =
  "https://vzzmdbdvcofajgrjgajq.supabase.co/functions/v1/partner-api";

export function peakAppOrigin(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/\/$/, "");
  }
  return (
    (import.meta.env.VITE_PUBLIC_APP_ORIGIN as string | undefined)?.trim() ||
    "https://www.peak-health.io"
  ).replace(/\/$/, "");
}

export function partnerApiBase(): string {
  const fromEnv = (import.meta.env.VITE_PARTNER_API_URL as string | undefined)?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const supabase = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  if (supabase) return `${supabase.replace(/\/$/, "")}/functions/v1/partner-api`;
  return DEFAULT_PARTNER_API;
}

/** Swagger, OpenAPI, health, and brand connect guide URLs. */
export function partnerApiDocs(slug?: string): PartnerApiDocs {
  const base = partnerApiBase();
  const normalizedSlug = slug?.trim().toLowerCase();
  return {
    base,
    swagger: `${base}?action=docs_ui`,
    openapi: `${base}?action=openapi`,
    health: `${base}?action=health`,
    connect: normalizedSlug
      ? `${base}?action=connect&brand_slug=${encodeURIComponent(normalizedSlug)}`
      : undefined,
    catalog: normalizedSlug
      ? `${base}?action=catalog&brand_slug=${encodeURIComponent(normalizedSlug)}`
      : undefined,
  };
}

export function partnerHandoffSourceFromSearch(search?: string): string | null {
  const raw = search ?? (typeof window !== "undefined" ? window.location.search : "");
  return new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : raw).get("source");
}

export function safeRedirectFromSearch(search?: string): string | null {
  const raw = search ?? (typeof window !== "undefined" ? window.location.search : "");
  const redirect = new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : raw).get("redirect");
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) return null;
  return redirect;
}

export function resolvePartnerHandoffContext(search?: string): {
  integration: PartnerIntegration | null;
  source: string | null;
} {
  const source = partnerHandoffSourceFromSearch(search);
  const integration = source ? getPartnerByHandoffSource(source) : null;
  return { integration, source };
}

function mapPartnerCategory(integration: PartnerIntegration, raw?: string): string | undefined {
  if (!raw?.trim()) return undefined;
  const key = raw.trim().toLowerCase();
  return integration.categoryMap?.[key] ?? key;
}

/** Branded patient login — use after external shop intake (no Peak product catalog). */
export function buildPartnerPatientLoginUrl(
  slug: string,
  opts: {
    productId?: string;
    category?: string;
    redirectPath?: string;
  } = {},
): PartnerLoginHandoff | null {
  const integration = getPartnerBySlug(slug);
  if (!integration) return null;

  const origin = peakAppOrigin();
  const redirectPath = opts.redirectPath ?? `/care/${integration.slug}/patient`;
  const params = new URLSearchParams({
    brand: integration.slug,
    brandId: integration.brandId,
    source: integration.handoffSource,
    redirect: redirectPath,
  });

  if (opts.productId) params.set("productId", opts.productId);
  const category = mapPartnerCategory(integration, opts.category);
  if (category) params.set("category", category);

  const authMode =
    integration.defaultAuthMode ??
    (integration.catalogMode === "external-catalog" ? "signup" : "login");
  if (authMode === "signup") params.set("mode", "signup");

  const loginUrl = `${origin}/care/${integration.slug}/login?${params.toString()}`;

  return {
    loginUrl,
    patientPortalUrl: `${origin}${redirectPath}`,
    integration,
  };
}

/** Copy/paste packet for partner dev teams. */
export function partnerDevHandoffPacket(slug: string): Record<string, string> | null {
  const integration = getPartnerBySlug(slug);
  if (!integration) return null;
  const docs = partnerApiDocs(slug);
  const login = buildPartnerPatientLoginUrl(slug);

  return {
    brand_slug: integration.slug,
    brand_id: integration.brandId,
    display_name: integration.displayName,
    catalog_mode: integration.catalogMode,
    partner_api_url: docs.base,
    swagger_ui: docs.swagger,
    openapi: docs.openapi,
    connect_guide: docs.connect ?? "",
    catalog_endpoint: docs.catalog ?? "",
    patient_login_url: login?.loginUrl ?? "",
    patient_portal_url: login?.patientPortalUrl ?? "",
    marketing_shop_url: integration.marketingShopUrl,
    handoff_source: integration.handoffSource,
  };
}

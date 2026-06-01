import { DEFAULT_BRAND_ID } from "../../app/components/os/constants";
import { NORTH_STAR_BRAND } from "./northStar";

/** Active tenant brand — `id` is stored on orders.sub_brand and profiles.brand_id for RLS. */
export type ActiveBrand = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  logoAlt: string;
  domain?: string | null;
  /** Extra hostnames that resolve to this brand (e.g. www + apex). */
  domains?: string[];
  tagline?: string;
};

export const BRAND_SESSION_KEY = "peak_active_brand_id";

/** Default Peak Health — unchanged behavior when no other brand is selected. */
export const PEAK_HEALTH_BRAND: ActiveBrand = {
  id: DEFAULT_BRAND_ID,
  slug: "peak-health",
  name: "Peak Health",
  logoUrl: "/PeakHealthLogo.png",
  logoAlt: "Peak Health",
  domain: "peak-health.io",
};

/**
 * Optional static brands (no DB row required). Prefer Supabase `brands` table for production.
 * Add your partner brand frontend here after creating the row in Super Admin → Brands.
 */
export const PARTNER_BRANDS: ActiveBrand[] = [NORTH_STAR_BRAND];

export const ALL_STATIC_BRANDS: ActiveBrand[] = [PEAK_HEALTH_BRAND, ...PARTNER_BRANDS];

export function brandFromDbRow(row: Record<string, unknown>): ActiveBrand | null {
  const id = String(row.id ?? "").trim();
  const name = String(row.name ?? "").trim();
  if (!id || !name) return null;
  const slug = String(row.slug ?? name).trim().toLowerCase().replace(/\s+/g, "-");
  return {
    id,
    slug,
    name,
    logoUrl: String(row.logo_url ?? row.logoUrl ?? PEAK_HEALTH_BRAND.logoUrl),
    logoAlt: name,
    domain: row.domain ? String(row.domain).trim().toLowerCase() : null,
  };
}

export function findStaticBrandById(id: string): ActiveBrand | undefined {
  return ALL_STATIC_BRANDS.find((b) => b.id === id);
}

export function findStaticBrandBySlug(slug: string): ActiveBrand | undefined {
  const s = slug.trim().toLowerCase();
  return ALL_STATIC_BRANDS.find((b) => b.slug === s);
}

function hostMatchesBrand(host: string, brand: ActiveBrand): boolean {
  const hosts = [
    ...(brand.domains ?? []),
    ...(brand.domain ? [brand.domain] : []),
  ]
    .map((d) => d.toLowerCase().replace(/^www\./, ""))
    .filter(Boolean);
  return hosts.some((d) => host === d || host.endsWith(`.${d}`));
}

export function findStaticBrandByHost(hostname: string): ActiveBrand | undefined {
  const host = hostname.trim().toLowerCase().replace(/^www\./, "");
  return ALL_STATIC_BRANDS.find((b) => hostMatchesBrand(host, b));
}

/** Build Peak Health shop URL for a partner marketing site (North Star, etc.). */
export function partnerShopEnrollmentUrl(
  brand: Pick<ActiveBrand, "id" | "slug">,
  opts?: { category?: string; origin?: string },
): string {
  const base =
    opts?.origin?.replace(/\/$/, "") ||
    (import.meta.env.VITE_PUBLIC_APP_ORIGIN as string | undefined)?.replace(/\/$/, "") ||
    "https://www.peak-health.io";
  const params = new URLSearchParams({ brand: brand.slug, brandId: brand.id });
  if (opts?.category) params.set("category", opts.category);
  return `${base}/patient/shop?${params.toString()}`;
}

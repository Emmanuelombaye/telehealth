import { supabase } from "../supabaseClient";
import {
  type ActiveBrand,
  BRAND_SESSION_KEY,
  PEAK_HEALTH_BRAND,
  ALL_STATIC_BRANDS,
  brandFromDbRow,
  findStaticBrandByHost,
  findStaticBrandById,
  findStaticBrandBySlug,
} from "./registry";
import { finalizeBrandFromKit } from "./brandDocument";

export type BrandResolveInput = {
  brandId?: string | null;
  brandSlug?: string | null;
  hostname?: string;
};

export function brandSlugFromPathname(pathname: string): string | null {
  const m = pathname.match(/^\/care\/([^/]+)/);
  return m?.[1] ?? null;
}

let cachedDbBrands: ActiveBrand[] | null = null;
let cachedBrandHostnames: Map<string, string[]> | null = null;

async function loadBrandHostnames(): Promise<Map<string, string[]>> {
  if (cachedBrandHostnames) return cachedBrandHostnames;
  const map = new Map<string, string[]>();
  try {
    const { data, error } = await supabase
      .from("brand_hostnames")
      .select("brand_id, hostname");
    if (error) throw error;
    for (const row of data ?? []) {
      const brandId = String(row.brand_id ?? "");
      const host = String(row.hostname ?? "").trim().toLowerCase().replace(/^www\./, "");
      if (!brandId || !host) continue;
      const list = map.get(brandId) ?? [];
      list.push(host);
      map.set(brandId, list);
    }
  } catch {
    /* anon or table missing — static hosts still work */
  }
  cachedBrandHostnames = map;
  return map;
}

async function loadDbBrands(): Promise<ActiveBrand[]> {
  if (cachedDbBrands) return cachedDbBrands;
  try {
    const { data, error } = await supabase
      .from("brands")
      .select("id, name, slug, domain, status, logo_url, portal_origin, settings")
      .eq("status", "active");
    if (error) throw error;
    cachedDbBrands = (data ?? [])
      .map((row) => brandFromDbRow(row as Record<string, unknown>))
      .filter((b): b is ActiveBrand => Boolean(b));
  } catch {
    cachedDbBrands = [];
  }
  return cachedDbBrands;
}

function findInList(
  list: ActiveBrand[],
  input: BrandResolveInput,
  hostnamesByBrandId?: Map<string, string[]>,
): ActiveBrand | null {
  const id = input.brandId?.trim();
  if (id) {
    const hit = list.find((b) => b.id === id) ?? findStaticBrandById(id);
    if (hit) return hit;
  }
  const slug = input.brandSlug?.trim().toLowerCase();
  if (slug) {
    const hit = list.find((b) => b.slug === slug) ?? findStaticBrandBySlug(slug);
    if (hit) return hit;
  }
  if (input.hostname) {
    const host = input.hostname.toLowerCase();
    const fromStatic = findStaticBrandByHost(host);
    if (fromStatic) return fromStatic;
    const bare = host.replace(/^www\./, "");
    const fromDb = list.find((b) => {
      const hosts = [
        ...(b.domains ?? []),
        ...(b.domain ? [b.domain] : []),
        ...(hostnamesByBrandId?.get(b.id) ?? []),
      ].map((d) => d.toLowerCase().replace(/^www\./, ""));
      return hosts.some((d) => bare === d || bare.endsWith(`.${d}`));
    });
    if (fromDb) return fromDb;
  }
  return null;
}

export function readStoredBrandId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(BRAND_SESSION_KEY);
}

export function persistBrandId(brandId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(BRAND_SESSION_KEY, brandId);
}

export function clearStoredBrandId(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(BRAND_SESSION_KEY);
}

/** Resolve brand: URL params → session → hostname → Peak Health default. */
export async function resolveActiveBrand(input: BrandResolveInput = {}): Promise<ActiveBrand> {
  const hostname =
    input.hostname ??
    (typeof window !== "undefined" ? window.location.hostname : undefined);

  const dbBrands = await loadDbBrands();
  const hostnamesByBrandId = await loadBrandHostnames();
  const merged = [...ALL_STATIC_BRANDS];
  for (const b of dbBrands) {
    if (!merged.some((m) => m.id === b.id)) merged.push(b);
  }

  const fromInput = findInList(merged, input, hostnamesByBrandId);
  if (fromInput) {
    persistBrandId(fromInput.id);
    return finalizeBrandFromKit(fromInput);
  }

  const stored = readStoredBrandId();
  if (stored) {
    const fromStore = findInList(merged, { brandId: stored }, hostnamesByBrandId);
    if (fromStore) return finalizeBrandFromKit(fromStore);
  }

  if (hostname) {
    const fromHost = findInList(merged, { hostname }, hostnamesByBrandId);
    if (fromHost) {
      persistBrandId(fromHost.id);
      return finalizeBrandFromKit(fromHost);
    }
  }

  persistBrandId(PEAK_HEALTH_BRAND.id);
  return PEAK_HEALTH_BRAND;
}

export function parseBrandFromSearch(search: string): BrandResolveInput {
  const params = new URLSearchParams(search);
  return {
    brandId: params.get("brandId") || params.get("brand_id"),
    brandSlug: params.get("brand") || params.get("slug"),
  };
}

import { PEAK_HEALTH_BRAND } from "../lib/brands/registry";
import type { ActiveBrand } from "../lib/brands/registry";
import type { BrandSiteConfig } from "./types";
import { northStarSite } from "./north-star-md/site";
import { summitMdSite } from "./summit-md/site";

export type { BrandSiteConfig, BrandSiteCopy, BrandSiteTheme } from "./types";

const SITES: BrandSiteConfig[] = [northStarSite, summitMdSite];

export const PEAK_SITE: BrandSiteConfig = {
  brand: PEAK_HEALTH_BRAND,
  hosts: ["peak-health.io", "www.peak-health.io", "localhost", "127.0.0.1"],
  copy: {
    welcomeTitle: (firstName) => `Welcome to Peak Health, ${firstName}!`,
    termsLabel: "I agree to Peak Health's",
    termsHref: "/terms",
    privacyHref: "/privacy",
    portalName: "Peak Health",
    supportEmail: "support@peak-health.io",
  },
  theme: {
    primary: "#0A2E1F",
    primaryForeground: "#ffffff",
    accent: "#10b981",
    headerBg: "#ffffff",
  },
};

/** Minimal kit for brands that exist in Supabase but have no static site folder yet. */
export function buildFallbackBrandSite(brand: ActiveBrand): BrandSiteConfig {
  return {
    brand,
    hosts: [
      ...(brand.domains ?? []),
      ...(brand.domain ? [brand.domain] : []),
      `care.${brand.domain ?? brand.slug + ".com"}`,
    ].filter(Boolean),
    copy: {
      welcomeTitle: (firstName) => `Welcome to ${brand.name}, ${firstName}!`,
      termsLabel: `I agree to ${brand.name}'s`,
      termsHref: "/terms",
      privacyHref: "/privacy",
      portalName: brand.name,
      supportEmail: `support@${brand.domain ?? "peak-health.io"}`,
    },
    theme: {
      primary: "#0f2341",
      primaryForeground: "#ffffff",
      accent: "#10b981",
      headerBg: "#ffffff",
    },
  };
}

export function getBrandSiteBySlug(slug: string): BrandSiteConfig | null {
  const hit = SITES.find((s) => s.brand.slug === slug);
  if (hit) return hit;
  return null;
}

/** Resolve site config including DB/static brand metadata (no async). */
export function resolveBrandSiteConfig(
  brand: ActiveBrand,
  opts?: { brandSlug?: string | null; hostname?: string },
): BrandSiteConfig {
  const slug = opts?.brandSlug?.trim().toLowerCase();
  if (slug) {
    const fromSlug = getBrandSiteBySlug(slug);
    if (fromSlug) return fromSlug;
    if (brand.slug === slug && brand.slug !== PEAK_HEALTH_BRAND.slug) {
      return buildFallbackBrandSite(brand);
    }
  }
  if (opts?.hostname) {
    const fromHost = getBrandSiteByHost(opts.hostname);
    if (fromHost) return fromHost;
  }
  if (brand.slug !== PEAK_HEALTH_BRAND.slug) {
    return buildFallbackBrandSite(brand);
  }
  return PEAK_SITE;
}

export function getBrandSiteByHost(hostname: string): BrandSiteConfig | null {
  const host = hostname.trim().toLowerCase().replace(/^www\./, "");
  for (const site of SITES) {
    const hosts = site.hosts.map((h) => h.toLowerCase().replace(/^www\./, ""));
    if (hosts.some((h) => host === h || host.endsWith(`.${h}`))) return site;
  }
  return null;
}

export function isWhiteLabelSite(site: BrandSiteConfig): boolean {
  return site.brand.slug !== PEAK_HEALTH_BRAND.slug;
}

export function enrollBasePath(site: BrandSiteConfig): string {
  return isWhiteLabelSite(site) ? `/care/${site.brand.slug}/shop` : "/patient/shop";
}

export function patientPortalBasePath(site: BrandSiteConfig): string {
  return isWhiteLabelSite(site) ? `/care/${site.brand.slug}/patient` : "/patient";
}

export function patientLoginPath(site: BrandSiteConfig): string {
  return isWhiteLabelSite(site) ? `/care/${site.brand.slug}/login` : "/login";
}

export function adminPortalBasePath(site: BrandSiteConfig): string {
  return isWhiteLabelSite(site) ? `/care/${site.brand.slug}/admin` : "/admin";
}

export function affiliatePortalBasePath(site: BrandSiteConfig): string {
  return isWhiteLabelSite(site) ? `/care/${site.brand.slug}/affiliate` : "/affiliate";
}

export function adminLoginPath(site: BrandSiteConfig): string {
  return `${adminPortalBasePath(site)}/login`;
}

export function affiliateLoginPath(site: BrandSiteConfig): string {
  return `${affiliatePortalBasePath(site)}/login`;
}

/** Slugs with a static frontend kit (north-star-md, …). */
export function listRegisteredCareBrandSlugs(): string[] {
  return SITES.filter((s) => isWhiteLabelSite(s)).map((s) => s.brand.slug);
}

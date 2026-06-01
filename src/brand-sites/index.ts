import { PEAK_HEALTH_BRAND } from "../lib/brands/registry";
import type { BrandSiteConfig } from "./types";
import { northStarSite } from "./north-star-md/site";

export type { BrandSiteConfig, BrandSiteCopy, BrandSiteTheme } from "./types";

const SITES: BrandSiteConfig[] = [northStarSite];

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

export function getBrandSiteBySlug(slug: string): BrandSiteConfig | null {
  return SITES.find((s) => s.brand.slug === slug) ?? null;
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

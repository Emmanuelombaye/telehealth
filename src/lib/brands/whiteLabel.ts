import {
  type BrandSiteConfig,
  PEAK_SITE,
  enrollBasePath,
  getBrandSiteByHost,
  getBrandSiteBySlug,
  isWhiteLabelSite,
  resolveBrandSiteConfig,
  adminLoginPath,
  adminPortalBasePath,
  affiliateLoginPath,
  affiliatePortalBasePath,
  patientLoginPath,
  patientPortalBasePath,
} from "../../brand-sites";
import { type ActiveBrand, PEAK_HEALTH_BRAND } from "./registry";

export type BrandExperience = {
  site: BrandSiteConfig;
  isWhiteLabel: boolean;
  enrollBase: string;
  patientPortalBase: string;
  patientLogin: string;
  adminPortalBase: string;
  affiliatePortalBase: string;
  adminLogin: string;
  affiliateLogin: string;
};

export function resolveBrandExperience(input: {
  brandSlug?: string | null;
  hostname?: string;
  brand?: ActiveBrand | null;
}): BrandExperience {
  const fromHost = input.hostname ? getBrandSiteByHost(input.hostname) : null;
  const fromSlug = input.brandSlug ? getBrandSiteBySlug(input.brandSlug) : null;
  const site =
    fromSlug ??
    fromHost ??
    (input.brand
      ? resolveBrandSiteConfig(input.brand, input)
      : input.brandSlug
        ? resolveBrandSiteConfig(
            {
              id: "",
              slug: input.brandSlug,
              name: input.brandSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              logoUrl: PEAK_HEALTH_BRAND.logoUrl,
              logoAlt: input.brandSlug,
            },
            input,
          )
        : PEAK_SITE);

  return {
    site,
    isWhiteLabel: isWhiteLabelSite(site),
    enrollBase: enrollBasePath(site),
    patientPortalBase: patientPortalBasePath(site),
    patientLogin: patientLoginPath(site),
    adminPortalBase: adminPortalBasePath(site),
    affiliatePortalBase: affiliatePortalBasePath(site),
    adminLogin: adminLoginPath(site),
    affiliateLogin: affiliateLoginPath(site),
  };
}

export function applyBrandSiteTheme(site: BrandSiteConfig): void {
  if (typeof document === "undefined") return;
  const r = document.documentElement;
  r.style.setProperty("--brand-primary", site.theme.primary);
  r.style.setProperty("--brand-primary-fg", site.theme.primaryForeground);
  r.style.setProperty("--brand-accent", site.theme.accent);
  r.dataset.brandSlug = site.brand.slug;
}

export function clearBrandSiteTheme(): void {
  if (typeof document === "undefined") return;
  const r = document.documentElement;
  r.style.removeProperty("--brand-primary");
  r.style.removeProperty("--brand-primary-fg");
  r.style.removeProperty("--brand-accent");
  delete r.dataset.brandSlug;
}

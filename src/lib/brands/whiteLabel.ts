import {
  type BrandSiteConfig,
  PEAK_SITE,
  enrollBasePath,
  getBrandSiteByHost,
  getBrandSiteBySlug,
  isWhiteLabelSite,
  patientLoginPath,
  patientPortalBasePath,
} from "../../brand-sites";

export type BrandExperience = {
  site: BrandSiteConfig;
  isWhiteLabel: boolean;
  enrollBase: string;
  patientPortalBase: string;
  patientLogin: string;
};

export function resolveBrandExperience(input: {
  brandSlug?: string | null;
  hostname?: string;
}): BrandExperience {
  const fromHost = input.hostname ? getBrandSiteByHost(input.hostname) : null;
  const fromSlug = input.brandSlug ? getBrandSiteBySlug(input.brandSlug) : null;
  const site = fromSlug ?? fromHost ?? PEAK_SITE;

  return {
    site,
    isWhiteLabel: isWhiteLabelSite(site),
    enrollBase: enrollBasePath(site),
    patientPortalBase: patientPortalBasePath(site),
    patientLogin: patientLoginPath(site),
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

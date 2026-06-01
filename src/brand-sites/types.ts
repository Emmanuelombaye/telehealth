import type { ActiveBrand } from "../lib/brands/registry";

/** Per-brand site kit — edit one folder per partner (e.g. north-star-md/). */
export type BrandSiteCopy = {
  welcomeTitle: (firstName: string) => string;
  termsLabel: string;
  termsHref: string;
  privacyHref: string;
  portalName: string;
  supportEmail?: string;
};

export type BrandSiteTheme = {
  /** Applied on `document.documentElement` for enrollment + portal shell */
  primary: string;
  primaryForeground: string;
  accent: string;
  headerBg: string;
};

export type BrandSiteConfig = {
  brand: ActiveBrand;
  /** Hostnames that force this brand (marketing + care subdomain). */
  hosts: string[];
  copy: BrandSiteCopy;
  theme: BrandSiteTheme;
};

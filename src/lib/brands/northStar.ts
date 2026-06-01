import type { ActiveBrand } from "./registry";

/** Stable tenant id — keep in sync with Supabase `brands` row and North Star marketing site. */
export const NORTH_STAR_BRAND_ID =
  (import.meta.env.VITE_NORTH_STAR_BRAND_ID as string | undefined)?.trim() ||
  "c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c";

const domainEnv = (import.meta.env.VITE_NORTH_STAR_DOMAIN as string | undefined)?.trim();

/** North Star MD partner brand (marketing site: D:\\northstarhealth → enrolls on Peak platform). */
export const NORTH_STAR_BRAND: ActiveBrand = {
  id: NORTH_STAR_BRAND_ID,
  slug: "north-star-md",
  name: "North Star MD",
  logoUrl: "/brands/north-star-md-logo.svg",
  logoAlt: "North Star MD",
  domain: domainEnv || "northstarmd.com",
  domains: [
    domainEnv || "northstarmd.com",
    "northstarmed.vercel.app",
    "www.northstarmed.vercel.app",
    "care.northstarmed.vercel.app",
    "northstarhealth.com",
    "www.northstarmd.com",
    "www.northstarhealth.com",
  ],
  tagline: "Guided by science. Designed for you.",
};

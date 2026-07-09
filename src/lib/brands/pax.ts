import type { ActiveBrand } from "./registry";

/** Pax Longevity — keep in sync with Supabase `brands` row (pax). */
export const PAX_BRAND_ID =
  (import.meta.env.VITE_PAX_BRAND_ID as string | undefined)?.trim() ||
  "b7e8f9a0-1c2d-4e3f-9a5b-6c7d8e9f0a1b";

export const PAX_BRAND: ActiveBrand = {
  id: PAX_BRAND_ID,
  slug: "pax",
  name: "Pax Longevity",
  logoUrl: "https://www.pax-longevity.com/images/pax-logo.webp",
  logoAlt: "Pax Longevity",
  domain: "pax-longevity.com",
  domains: [
    "pax-longevity.com",
    "www.pax-longevity.com",
    "portal.pax-longevity.com",
    "care.pax-longevity.com",
  ],
  tagline: "Prevent decline years before symptoms.",
};

/** Marketing site — patients return here from Peak login. */
export const PAX_MARKETING_URL =
  (import.meta.env.VITE_PAX_SHOP_URL as string | undefined)?.trim() ||
  "https://www.pax-longevity.com";

import type { ActiveBrand } from "./registry";

/** Summit MD — keep in sync with Supabase `brands` row (summit-md). */
export const SUMMIT_MD_BRAND_ID =
  (import.meta.env.VITE_SUMMIT_MD_BRAND_ID as string | undefined)?.trim() ||
  "7caaa526-185e-4eda-bf0e-832be6ba37a7";

export const SUMMIT_MD_BRAND: ActiveBrand = {
  id: SUMMIT_MD_BRAND_ID,
  slug: "summit-md",
  name: "Summit MD",
  logoUrl: "https://summitmd.vercel.app/logo.png",
  logoAlt: "Summit MD",
  domain: "summitmd.vercel.app",
  domains: [
    "summitmd.vercel.app",
    "summitmd.com",
    "www.summitmd.com",
    "care.summitmd.com",
  ],
  tagline: "Guided care. Designed for you.",
};

/** Marketing site — patients return here from Peak login (not Peak shop). */
export const SUMMIT_MD_MARKETING_SHOP_URL =
  (import.meta.env.VITE_SUMMIT_MD_SHOP_URL as string | undefined)?.trim() ||
  "https://summitmd.vercel.app/shop";

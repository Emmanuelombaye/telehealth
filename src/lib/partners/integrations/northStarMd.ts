import { NORTH_STAR_BRAND, NORTH_STAR_BRAND_ID } from "../../brands/northStar";
import type { PartnerIntegration } from "../types";

const marketingOrigin =
  (import.meta.env.VITE_NORTH_STAR_SHOP_URL as string | undefined)?.trim() ||
  "https://joinnorthstarmd.com";

export const northStarMdIntegration: PartnerIntegration = {
  slug: NORTH_STAR_BRAND.slug,
  brandId: NORTH_STAR_BRAND_ID,
  displayName: NORTH_STAR_BRAND.name,
  handoffSource: "northstar-shop",
  marketingShopUrl: marketingOrigin,
  logoUrl: NORTH_STAR_BRAND.logoUrl,
  catalogMode: "api-catalog",
  handoffMessage:
    "Sign in to your North Star MD patient portal. Products and intake may live on your marketing site or Peak shop.",
  categoryMap: {
    "weight-loss": "weight-loss",
    longevity: "longevity",
  },
};

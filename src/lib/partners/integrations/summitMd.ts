import { SUMMIT_MD_BRAND, SUMMIT_MD_BRAND_ID, SUMMIT_MD_MARKETING_SHOP_URL } from "../../brands/summitMd";
import type { PartnerIntegration } from "../types";

export const summitMdIntegration: PartnerIntegration = {
  slug: SUMMIT_MD_BRAND.slug,
  brandId: SUMMIT_MD_BRAND_ID,
  displayName: SUMMIT_MD_BRAND.name,
  handoffSource: "summitmd-shop",
  marketingShopUrl: SUMMIT_MD_MARKETING_SHOP_URL,
  logoUrl: SUMMIT_MD_BRAND.logoUrl,
  catalogMode: "external-catalog",
  handoffMessage:
    "You completed intake on SummitMD. Sign in to open your patient portal — not the product shop.",
  categoryMap: {
    subscriptions: "weight-loss",
    nutrition: "longevity",
    wellness: "longevity",
    devices: "longevity",
    maternal: "longevity",
  },
};

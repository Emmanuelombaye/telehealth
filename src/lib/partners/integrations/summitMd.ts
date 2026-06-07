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
  defaultAuthMode: "signup",
  signupHandoffMessage:
    "You selected care on SummitMD. Create your account to open your patient portal — not the product shop.",
  handoffMessage: "Sign in to your Summit MD patient portal.",
  categoryMap: {
    subscriptions: "weight-loss",
    nutrition: "longevity",
    wellness: "longevity",
    devices: "longevity",
    maternal: "longevity",
  },
};

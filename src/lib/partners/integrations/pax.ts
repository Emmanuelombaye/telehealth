import { PAX_BRAND, PAX_BRAND_ID, PAX_MARKETING_URL } from "../../brands/pax";
import type { PartnerIntegration } from "../types";

export const paxIntegration: PartnerIntegration = {
  slug: PAX_BRAND.slug,
  brandId: PAX_BRAND_ID,
  displayName: PAX_BRAND.name,
  handoffSource: "pax-longevity",
  marketingShopUrl: PAX_MARKETING_URL,
  logoUrl: PAX_BRAND.logoUrl,
  catalogMode: "external-catalog",
  defaultAuthMode: "signup",
  signupHandoffMessage:
    "You selected care on Pax Longevity. Create your account to open your patient portal.",
  handoffMessage: "Sign in to your Pax Longevity patient portal.",
  categoryMap: {
    "weight-loss": "weight-loss",
    longevity: "longevity",
    energy: "longevity",
    recovery: "longevity",
    wellness: "longevity",
  },
};

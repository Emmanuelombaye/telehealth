import { PAX_BRAND } from "../../lib/brands/pax";
import type { BrandSiteConfig } from "../types";

/** Pax Longevity — white-label care on Peak Health OS. */
export const paxSite: BrandSiteConfig = {
  brand: PAX_BRAND,
  hosts: [
    "pax-longevity.com",
    "www.pax-longevity.com",
    "portal.pax-longevity.com",
    "care.pax-longevity.com",
  ],
  copy: {
    welcomeTitle: (firstName) => `Welcome to Pax Longevity, ${firstName}!`,
    termsLabel: "I agree to Pax Longevity's",
    termsHref: "/terms",
    privacyHref: "/privacy",
    portalName: "Pax Longevity",
    supportEmail: "support@pax-longevity.com",
  },
  theme: {
    primary: "#A0594E",
    primaryForeground: "#FAF6F0",
    accent: "#C17D74",
    headerBg: "#FAF6F0",
  },
};

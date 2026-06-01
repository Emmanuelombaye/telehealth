import { NORTH_STAR_BRAND } from "../../lib/brands/northStar";
import type { BrandSiteConfig } from "../types";

/**
 * North Star MD — white-label site kit
 * Marketing: https://northstarmed.vercel.app/
 * Enrollment (white-label): /care/north-star-md/shop
 * Patient portal: /care/north-star-md/patient
 */
export const northStarSite: BrandSiteConfig = {
  brand: NORTH_STAR_BRAND,
  hosts: [
    "northstarmed.vercel.app",
    "www.northstarmed.vercel.app",
    "care.northstarmed.vercel.app",
    "northstarmd.com",
    "www.northstarmd.com",
    "northstarhealth.com",
    "www.northstarhealth.com",
  ],
  copy: {
    welcomeTitle: (firstName) => `Welcome to North Star MD, ${firstName}!`,
    termsLabel: "I agree to North Star MD's",
    termsHref: "/terms",
    privacyHref: "/privacy",
    portalName: "North Star MD",
    supportEmail: "support@northstarmd.com",
  },
  theme: {
    primary: "#0f2341",
    primaryForeground: "#ffffff",
    accent: "#c4a35a",
    headerBg: "#f8f9fa",
  },
};

import { SUMMIT_MD_BRAND } from "../../lib/brands/summitMd";
import type { BrandSiteConfig } from "../types";

/** Summit MD — white-label patient login + portal on Peak (shop lives on summitmd.vercel.app). */
export const summitMdSite: BrandSiteConfig = {
  brand: SUMMIT_MD_BRAND,
  hosts: [
    "summitmd.vercel.app",
    "www.summitmd.vercel.app",
    "summitmd.com",
    "www.summitmd.com",
    "care.summitmd.com",
  ],
  copy: {
    welcomeTitle: (firstName) => `Welcome to Summit MD, ${firstName}!`,
    termsLabel: "I agree to Summit MD's",
    termsHref: "/terms",
    privacyHref: "/privacy",
    portalName: "Summit MD",
    supportEmail: "support@summitmd.com",
  },
  theme: {
    primary: "#0f2e2f",
    primaryForeground: "#ffffff",
    accent: "#00d2c4",
    headerBg: "#f9f5f0",
  },
};

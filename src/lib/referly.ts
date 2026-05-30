/** Merchant site id — injected into index.html via Vite (`VITE_REFERLY_SITE_ID`). */
export const REFERLY_SITE_ID = import.meta.env.VITE_REFERLY_SITE_ID?.trim() ?? "";

/**
 * White-label Referly partner portal (affiliate login, links, payouts).
 * Configure in Referly dashboard → Custom Domain (e.g. partners.peak-health.io).
 */
export const REFERLY_PARTNER_PORTAL_URL =
  import.meta.env.VITE_REFERLY_PARTNER_PORTAL_URL?.trim() ||
  "https://partners.peak-health.io";

/** Merchant admin console on Referly.so */
export const REFERLY_MERCHANT_CONSOLE_URL = "https://referly.so";

export function isReferlyTrackingConfigured(): boolean {
  return REFERLY_SITE_ID.length > 0;
}

export function referlyPartnerPortalUrl(): string {
  return REFERLY_PARTNER_PORTAL_URL;
}

/** Copy to config.js and fill in after deploying partner-api */
window.PARTNER_API_CONFIG = {
  /** Supabase Edge Function base (no trailing slash) */
  apiBase: "https://kvopgyhcjcniaocjozje.supabase.co/functions/v1/partner-api",
  /** Same value as PARTNER_API_KEY edge secret — demo only; use server proxy in production */
  partnerApiKey: "YOUR_PARTNER_API_KEY",
  brandSlug: "north-star-md",
  /** Optional: branded subdomain origin for portal URLs */
  portalOrigin: "https://www.peak-health.io",
};

/**
 * Peak Health (non–white-label): patient accounts are created during shop checkout.
 * /login and /patient/login are for returning patients only.
 */

export function isPartnerCarePatientPath(pathname?: string): boolean {
  const p = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  return /^\/care\/[^/]+/.test(p);
}

/** True on Peak native patient routes (/login, /patient/*), not /care/:slug/*. */
export function isPeakNativePatientContext(pathname?: string): boolean {
  return !isPartnerCarePatientPath(pathname);
}

export function peakPatientShopEntryPath(enrollBase?: string): string {
  const base = (enrollBase || "/patient/shop").replace(/\/$/, "");
  return base || "/patient/shop";
}

import { getPartnerBySlug } from "./registry";

export type PatientShopDestination = {
  href: string;
  /** True when catalog lives on partner marketing site (SummitMD, etc.). */
  external: boolean;
  label: string;
  helperText?: string;
};

/**
 * Where "Shop / Browse plans" should go for a tenant.
 * - external-catalog → partner marketing site (never Peak product UI)
 * - api-catalog / peak-shop → branded Peak enroll path `/care/{slug}/shop` or `/patient/shop`
 */
export function resolvePatientShopDestination(
  brandSlug: string,
  enrollBase: string,
): PatientShopDestination {
  const integration = getPartnerBySlug(brandSlug);
  if (integration?.catalogMode === "external-catalog") {
    return {
      href: integration.marketingShopUrl,
      external: true,
      label: "Browse plans",
      helperText: `Plans and intake live on ${integration.displayName}. Your portal here is for care, orders, and messaging.`,
    };
  }

  const base = enrollBase.replace(/\/$/, "") || "/patient/shop";
  return {
    href: base,
    external: false,
    label: integration?.catalogMode === "api-catalog" ? "Shop treatments" : "Shop treatments",
  };
}

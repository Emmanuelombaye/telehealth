import type { PartnerAuthMode } from "./authHandoff";

/** How a partner sells products before handoff to Peak. */
export type PartnerCatalogMode =
  /** Partner marketing site owns catalog (SummitMD, etc.). Peak = login + portal only. */
  | "external-catalog"
  /** Partner pulls products from Partner API `GET catalog`. */
  | "api-catalog"
  /** Patient enrolls on Peak `/care/{slug}/shop`. */
  | "peak-shop";

export type PartnerIntegration = {
  slug: string;
  brandId: string;
  displayName: string;
  /** Query param `source=` on login URL — links external site handoff to this partner. */
  handoffSource: string;
  /** External marketing shop URL (Back link on Peak login). */
  marketingShopUrl: string;
  logoUrl: string;
  catalogMode: PartnerCatalogMode;
  /** Default auth screen after external shop handoff */
  defaultAuthMode?: PartnerAuthMode;
  /** Shown on Peak patient login when `source` matches. */
  handoffMessage?: string;
  /** Shown when defaultAuthMode is signup. */
  signupHandoffMessage?: string;
  /** Optional map: partner product key → Peak product UUID */
  productIdMap?: Record<string, string>;
  /** Partner category slug → Peak enrollment category */
  categoryMap?: Record<string, string>;
};

export type PartnerLoginHandoff = {
  loginUrl: string;
  patientPortalUrl: string;
  integration: PartnerIntegration;
};

export type PartnerApiDocs = {
  base: string;
  swagger: string;
  openapi: string;
  health: string;
  connect?: string;
  catalog?: string;
};

export type { PartnerAuthMode };

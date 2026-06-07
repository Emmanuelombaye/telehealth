import { useMemo } from "react";
import { useBrand } from "../../app/context/BrandContext";
import { patientMessagesHref } from "../patientMessaging";
import { resolvePatientShopDestination } from "../partners/catalogRouting";

export type PatientPortalRoutes = {
  home: string;
  orders: string;
  appointments: string;
  intake: string;
  visitForms: string;
  messages: string;
  summaries: string;
  vitals: string;
  prescriptions: string;
  labs: string;
  documents: string;
  profile: string;
  identity: string;
  family: string;
  notifications: string;
  insurance: string;
  consult: string;
};

/** Build tenant-scoped patient portal paths from `/patient` or `/care/{slug}/patient`. */
export function buildPatientPortalRoutes(patientPortalBase: string): PatientPortalRoutes {
  const base = patientPortalBase.replace(/\/$/, "") || "/patient";
  const leaf = (segment: string) => `${base}/${segment}`;
  return {
    home: base,
    orders: leaf("orders"),
    appointments: leaf("appointments"),
    intake: leaf("intake"),
    visitForms: leaf("visit-forms"),
    messages: leaf("messages"),
    summaries: leaf("summaries"),
    vitals: leaf("vitals"),
    prescriptions: leaf("prescriptions"),
    labs: leaf("labs"),
    documents: leaf("documents"),
    profile: leaf("profile"),
    identity: leaf("identity"),
    family: leaf("family"),
    notifications: leaf("notifications"),
    insurance: leaf("insurance"),
    consult: leaf("consult"),
  };
}

/** Brand-aware patient navigation — use everywhere inside the portal (never hardcode `/patient/...`). */
export function usePatientNav() {
  const { brand, patientPortalBase, enrollBase, site, isWhiteLabel } = useBrand();

  return useMemo(() => {
    const routes = buildPatientPortalRoutes(patientPortalBase);
    const shop = resolvePatientShopDestination(brand.slug, enrollBase);
    return {
      routes,
      shop,
      portalName: site.copy.portalName,
      isWhiteLabel,
      brand,
      messagesHref: (doctorId?: string | null) =>
        patientMessagesHref(doctorId, patientPortalBase),
    };
  }, [brand, patientPortalBase, enrollBase, site.copy.portalName, isWhiteLabel]);
}

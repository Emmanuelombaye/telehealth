import type { PhiAccessPayload, PhiResourceType } from "./phiAccessAudit";

const PHI_ROUTE_PREFIXES = [
  "/patient/",
  "/doctor/",
  "/providers/",
  "/admin/patients",
  "/admin/orders",
  "/admin/analytics",
  "/admin/messages",
  "/superadmin/patients",
  "/superadmin/orders",
  "/superadmin/analytics",
  "/superadmin/messages",
  "/pharmacy/",
  "/care/",
];

/** Returns null for routes that do not touch PHI (settings, builders, etc.). */
export function resolvePhiAccessFromLocation(
  pathname: string,
  search: string,
  options: { actorUserId?: string | null; actorRole?: string | null },
): PhiAccessPayload | null {
  const path = pathname.toLowerCase();
  if (!PHI_ROUTE_PREFIXES.some((p) => path.startsWith(p))) return null;

  const sp = new URLSearchParams(search);
  const isPatient = path.startsWith("/patient/");
  const accessType = isPatient ? ("self" as const) : ("staff" as const);
  const subjectFromParam = sp.get("userId") || sp.get("patientId") || null;
  const patientRouteMatch = path.match(/\/(?:doctor|providers)\/patients\/([^/]+)/);
  const subjectUserId = isPatient
    ? options.actorUserId ?? null
    : patientRouteMatch?.[1] || subjectFromParam;

  const resource = (type: PhiResourceType, action: PhiAccessPayload["action"], resourceId?: string | null) =>
    ({
      action,
      resourceType: type,
      resourceId: resourceId ?? undefined,
      subjectUserId: subjectUserId ?? undefined,
      accessType,
    }) satisfies PhiAccessPayload;

  if (path.includes("/messages")) return resource("message", "view_messages");
  if (path.includes("/prescriptions")) return resource("prescription", "view_list");
  if (path.includes("/labs")) return resource("lab_result", "view_list");
  if (path.includes("/summaries") || path.includes("/visit")) return resource("visit_summary", "view_list");
  if (path.includes("/documents")) return resource("document", "view_list");
  if (path.includes("/vitals")) return resource("vitals", "view_list");
  if (path.includes("/rpm")) return resource("rpm", "view_list");
  if (path.includes("/intake") || path.includes("/questionnaire")) return resource("intake", "view_list");
  if (path.includes("/consult")) {
    const orderId = sp.get("orderId") || sp.get("order");
    return resource("consult", orderId ? "view_record" : "view_list", orderId);
  }
  if (path.includes("/queue")) return resource("order", "view_list");
  if (path.includes("/scribe") || path.includes("/erx")) return resource("prescription", "view_list");
  if (path.includes("/patients/") && patientRouteMatch) {
    return resource("patient_chart", "view_record", patientRouteMatch[1]);
  }
  if (path.includes("/patients")) return resource("patient_chart", "view_list");
  if (path.includes("/analytics")) return resource("order", "view_list");
  if (path.includes("/orders")) return resource("order", "view_list");
  if (path.includes("/tracking") || path.includes("/appointments")) {
    return resource("order", "view_list");
  }
  if (path === "/patient" || path.startsWith("/patient/dashboard")) {
    return resource("patient_chart", "view_list");
  }
  if (path.includes("/pharmacy")) return resource("pharmacy_order", "view_list");

  if (isPatient) return resource("patient_chart", "view_list");
  return resource("order", "view_list");
}

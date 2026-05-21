/**
 * Detect SuperAdmin / audit seed rows that must not appear as real patients.
 */

export function isAuditPlaceholderOrder(row: {
  patient_name?: string | null;
  order_number?: string | null;
  medication?: string | null;
}): boolean {
  const name = (row.patient_name ?? "").trim();
  if (/^Patient for /i.test(name)) return true;
  if (/^Audit Revenue Seed \(/i.test(name)) return true;
  const orderNum = (row.order_number ?? "").trim();
  if (/^SA-TEST-/i.test(orderNum)) return true;
  if (name.toLowerCase() === "audit medication" && row.medication === "Audit Medication") return true;
  return false;
}

export function filterClinicalPatientOrders<T extends {
  patient_name?: string | null;
  order_number?: string | null;
  medication?: string | null;
}>(rows: T[]): T[] {
  return rows.filter((r) => !isAuditPlaceholderOrder(r));
}

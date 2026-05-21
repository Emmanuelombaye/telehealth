/**
 * Doctor medical documents — types, styling, patient name resolution, storage URLs.
 */

import { supabase } from "./supabaseClient";

export const DOCUMENT_TYPES = [
  "Lab Report",
  "Diagnostic",
  "Prescription",
  "Insurance",
  "Immunization",
  "Referral",
  "Other",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export type DocSource = "upload" | "lab" | "visit";

export type UnifiedMedicalDoc = {
  id: string;
  source: DocSource;
  patientId: string | null;
  patientName: string;
  title: string;
  subtitle: string;
  typeLabel: string;
  createdAt: string;
  isNew: boolean;
  url: string | null;
  storagePath: string | null;
  status?: string;
  size?: string | null;
  /** Lab tests JSON or visit diagnosis, etc. */
  payload?: Record<string, unknown>;
};

export const DOC_TYPE_STYLES: Record<string, { badge: string; icon: string }> = {
  "Lab Report": { badge: "bg-violet-100 text-violet-800 border-violet-200", icon: "text-violet-600" },
  Diagnostic: { badge: "bg-purple-100 text-purple-800 border-purple-200", icon: "text-purple-600" },
  Prescription: { badge: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: "text-emerald-600" },
  Insurance: { badge: "bg-amber-100 text-amber-800 border-amber-200", icon: "text-amber-600" },
  Immunization: { badge: "bg-rose-100 text-rose-800 border-rose-200", icon: "text-rose-600" },
  Referral: { badge: "bg-slate-100 text-slate-800 border-slate-200", icon: "text-slate-600" },
  Other: { badge: "bg-blue-100 text-blue-800 border-blue-200", icon: "text-blue-600" },
  "Visit summary": { badge: "bg-indigo-100 text-indigo-800 border-indigo-200", icon: "text-indigo-600" },
  "Lab panel": { badge: "bg-teal-100 text-teal-800 border-teal-200", icon: "text-teal-600" },
};

export const LAB_STATUS_STYLES: Record<string, string> = {
  new: "bg-primary/10 text-primary border-primary/30",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  partial: "bg-violet-100 text-violet-800 border-violet-200",
  final: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export function buildPatientNameMap(
  rows: { user_id?: string | null; patient_name?: string | null }[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.user_id && row.patient_name && !map.has(row.user_id)) {
      map.set(row.user_id, row.patient_name);
    }
  }
  return map;
}

export function patientDisplayName(
  patientId: string | null | undefined,
  nameMap: Map<string, string>,
): string {
  if (!patientId) return "Unknown patient";
  return nameMap.get(patientId) ?? `Patient ${patientId.slice(0, 8)}…`;
}

export async function resolveDocumentUrl(
  storagePath: string | null | undefined,
  fallbackUrl: string | null | undefined,
): Promise<string | null> {
  if (storagePath) {
    const { data, error } = await supabase.storage
      .from("patient-documents")
      .createSignedUrl(storagePath, 3600);
    if (!error && data?.signedUrl) return data.signedUrl;
  }
  return fallbackUrl ?? null;
}

export function formatDocDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function mergeAndSortDocs(items: UnifiedMedicalDoc[]): UnifiedMedicalDoc[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

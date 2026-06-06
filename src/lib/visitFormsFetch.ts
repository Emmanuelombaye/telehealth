import { supabase } from "./supabaseClient";
import { isMissingTableError } from "./supabaseTableError";

export type VisitFormRow = {
  id: string;
  patient_id: string;
  title: string;
  visit_name: string | null;
  status: string;
  urgent: boolean;
  form_data: Record<string, unknown>;
  created_at: string;
  /** Which table this row came from — used for updates. */
  _sourceTable?: "intake_forms" | "visit_forms";
};

function normalizeVisitFormRow(
  row: Record<string, unknown>,
  sourceTable: "intake_forms" | "visit_forms",
): VisitFormRow {
  const formData =
    row.form_data && typeof row.form_data === "object"
      ? (row.form_data as Record<string, unknown>)
      : {};
  return {
    id: String(row.id),
    patient_id: String(row.patient_id),
    title: String(row.title ?? "Visit form"),
    visit_name:
      row.visit_name != null
        ? String(row.visit_name)
        : sourceTable === "intake_forms"
          ? String(row.title ?? "")
          : null,
    status: String(row.status ?? "pending"),
    urgent: Boolean(row.urgent),
    form_data: formData,
    created_at: String(row.created_at ?? new Date().toISOString()),
    _sourceTable: sourceTable,
  };
}

/** Load patient visit/intake forms; prefers intake_forms, falls back to visit_forms. */
export async function fetchVisitFormsForPatient(patientId: string) {
  let data: Record<string, unknown>[] | null = null;
  let error: { code?: string; message?: string } | null = null;
  let sourceTable: "intake_forms" | "visit_forms" = "intake_forms";

  ({ data, error } = await supabase
    .from("intake_forms")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false }));

  if (error && isMissingTableError(error)) {
    sourceTable = "visit_forms";
    ({ data, error } = await supabase
      .from("visit_forms")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false }));
  }

  if (error) return { data: [] as VisitFormRow[], error };

  const rows = (data ?? []).map((row) =>
    normalizeVisitFormRow(row as Record<string, unknown>, sourceTable),
  );
  return { data: rows, error: null };
}

/** Update a visit/intake form; tries the source table first, then the alternate. */
export async function updateVisitForm(
  formId: string,
  patch: Record<string, unknown>,
  sourceTable?: "intake_forms" | "visit_forms",
) {
  const tables: ("intake_forms" | "visit_forms")[] = sourceTable
    ? [sourceTable, sourceTable === "intake_forms" ? "visit_forms" : "intake_forms"]
    : ["intake_forms", "visit_forms"];

  let lastError: { code?: string; message?: string } | null = null;

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .update(patch)
      .eq("id", formId)
      .select()
      .single();

    if (!error && data) {
      return {
        data: normalizeVisitFormRow(data as Record<string, unknown>, table),
        error: null,
      };
    }
    lastError = error;
    if (error && !isMissingTableError(error) && error.code !== "PGRST116") break;
  }

  return { data: null, error: lastError };
}

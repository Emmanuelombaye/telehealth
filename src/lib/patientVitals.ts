/**
 * Patient vitals — full enrollment payload, vital_readings sync, completeness checks.
 */

import { supabase } from "./supabaseClient";
import type { IntakeVitals, VitalReading } from "./vitalsClinical";

function isReadingFlagged(metric: string, value: number): boolean {
  switch (metric) {
    case "bp_sys":
      return value >= 140 || value < 90;
    case "bp_dia":
      return value >= 90 || value < 60;
    case "hr":
      return value < 50 || value > 100;
    case "spo2":
      return value < 92;
    case "glucose":
      return value > 125 || value < 70;
    case "temp":
      return value >= 100.4 || value < 97;
    case "resp_rate":
      return value < 12 || value > 20;
    default:
      return false;
  }
}

export type PatientVitalsRecord = {
  dob?: string;
  sex?: string;
  height?: string;
  weight?: string;
  bmi?: string | number;
  allergies?: string;
  currentMeds?: string;
  address?: string;
  phone?: string;
  email?: string;
  /** Systolic mmHg */
  bp_sys?: number | string;
  /** Diastolic mmHg */
  bp_dia?: number | string;
  /** Legacy combined "120/80" */
  bp?: string;
  hr?: number | string;
  spo2?: number | string;
  temp_f?: number | string;
  temperature?: number | string;
  glucose?: number | string;
  resp_rate?: number | string;
  rr?: number | string;
  captured_at?: string;
  source?: string;
};

export type EnrollmentVitalsForm = {
  heightFt: string;
  heightIn: string;
  weight: string;
  dob: string;
  sex: string;
  allergies: string;
  currentMeds: string;
  address: string;
  phone: string;
  email: string;
  bpSys: string;
  bpDia: string;
  restingHr: string;
  spo2: string;
  tempF: string;
  glucose: string;
  respRate: string;
};

export type VitalFieldKey =
  | "bp"
  | "hr"
  | "spo2"
  | "temp"
  | "weight"
  | "glucose"
  | "resp"
  | "height";

export type VitalCompletenessItem = {
  key: VitalFieldKey;
  label: string;
  status: "complete" | "partial" | "missing";
  detail: string;
  hasIntake: boolean;
  hasReadings: boolean;
};

export const VITAL_FIELD_CATALOG: {
  key: VitalFieldKey;
  label: string;
  metrics: string[];
  intakeFields: (keyof PatientVitalsRecord)[];
}[] = [
  { key: "bp", label: "Blood pressure", metrics: ["bp_sys", "bp_dia"], intakeFields: ["bp_sys", "bp_dia", "bp"] },
  { key: "hr", label: "Heart rate", metrics: ["hr"], intakeFields: ["hr"] },
  { key: "spo2", label: "SpO₂", metrics: ["spo2"], intakeFields: ["spo2"] },
  { key: "temp", label: "Temperature", metrics: ["temp", "temperature"], intakeFields: ["temp_f", "temperature"] },
  { key: "weight", label: "Weight / BMI", metrics: ["weight"], intakeFields: ["weight", "bmi"] },
  { key: "glucose", label: "Blood glucose", metrics: ["glucose"], intakeFields: ["glucose"] },
  { key: "resp", label: "Respiratory rate", metrics: ["resp_rate", "rr"], intakeFields: ["resp_rate", "rr"] },
  { key: "height", label: "Height", metrics: [], intakeFields: ["height"] },
];

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function parseBpString(bp?: string | null): { sys: number | null; dia: number | null } {
  if (!bp || typeof bp !== "string") return { sys: null, dia: null };
  const m = bp.trim().match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
  if (!m) return { sys: null, dia: null };
  return { sys: parseInt(m[1], 10), dia: parseInt(m[2], 10) };
}

export function computeBmiFromForm(heightFt: string, heightIn: string, weightLbs: string): string {
  const inches = (parseInt(heightFt || "0", 10) * 12) + parseInt(heightIn || "0", 10);
  const w = parseFloat(weightLbs || "0");
  if (inches <= 0 || w <= 0) return "";
  return (((w / (inches * inches)) * 703)).toFixed(1);
}

/** Build JSON stored on orders.patient_vitals */
export function buildEnrollmentPatientVitals(form: EnrollmentVitalsForm): PatientVitalsRecord {
  const bmi = computeBmiFromForm(form.heightFt, form.heightIn, form.weight);
  const sys = num(form.bpSys);
  const dia = num(form.bpDia);

  return {
    dob: form.dob || undefined,
    sex: form.sex || undefined,
    height: form.heightFt && form.heightIn ? `${form.heightFt}'${form.heightIn}"` : undefined,
    weight: form.weight ? `${form.weight} lbs` : undefined,
    bmi: bmi || undefined,
    allergies: form.allergies || "None",
    currentMeds: form.currentMeds || "None",
    address: form.address || undefined,
    phone: form.phone || undefined,
    email: form.email || undefined,
    bp_sys: sys ?? undefined,
    bp_dia: dia ?? undefined,
    bp: sys != null && dia != null ? `${sys}/${dia}` : undefined,
    hr: num(form.restingHr) ?? undefined,
    spo2: num(form.spo2) ?? undefined,
    temp_f: num(form.tempF) ?? undefined,
    glucose: num(form.glucose) ?? undefined,
    resp_rate: num(form.respRate) ?? undefined,
    captured_at: new Date().toISOString(),
    source: "enrollment_intake",
  };
}

/** Parse orders.patient_vitals → extended intake for doctor UI */
export function parsePatientVitals(raw: unknown): IntakeVitals | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as PatientVitalsRecord;
  const bp = parseBpString(o.bp);
  const sys = num(o.bp_sys) ?? bp.sys;
  const dia = num(o.bp_dia) ?? bp.dia;

  return {
    height: o.height != null ? String(o.height) : undefined,
    weight: o.weight != null ? String(o.weight) : undefined,
    bmi: o.bmi != null ? (typeof o.bmi === "number" ? o.bmi : String(o.bmi)) : undefined,
    sex: o.sex != null ? String(o.sex) : undefined,
    dob: o.dob != null ? String(o.dob) : undefined,
    allergies: o.allergies != null ? String(o.allergies) : undefined,
    currentMeds: o.currentMeds != null ? String(o.currentMeds) : undefined,
    bp_sys: sys ?? undefined,
    bp_dia: dia ?? undefined,
    hr: num(o.hr) ?? undefined,
    spo2: num(o.spo2) ?? undefined,
    temp_f: num(o.temp_f ?? o.temperature) ?? undefined,
    glucose: num(o.glucose) ?? undefined,
    resp_rate: num(o.resp_rate ?? o.rr) ?? undefined,
    captured_at: o.captured_at,
  };
}

type ReadingInsert = {
  patient_id: string;
  patient_name: string;
  metric: string;
  value: number;
  unit: string | null;
  source: string;
  flagged: boolean;
  recorded_at: string;
};

function pushReading(
  rows: ReadingInsert[],
  patientId: string,
  patientName: string,
  metric: string,
  value: number | null,
  unit: string,
  recordedAt: string,
) {
  if (value == null) return;
  const flagged = isReadingFlagged(metric, value);
  rows.push({
    patient_id: patientId,
    patient_name: patientName,
    metric,
    value,
    unit,
    source: "enrollment_intake",
    flagged,
    recorded_at: recordedAt,
  });
}

/** Convert enrollment vitals → vital_readings rows (one row per metric). */
export function vitalsToReadingInserts(
  patientId: string,
  patientName: string,
  vitals: PatientVitalsRecord,
): ReadingInsert[] {
  const at = vitals.captured_at || new Date().toISOString();
  const rows: ReadingInsert[] = [];
  const bp = parseBpString(vitals.bp);
  const sys = num(vitals.bp_sys) ?? bp.sys;
  const dia = num(vitals.bp_dia) ?? bp.dia;

  pushReading(rows, patientId, patientName, "bp_sys", sys, "mmHg", at);
  pushReading(rows, patientId, patientName, "bp_dia", dia, "mmHg", at);
  pushReading(rows, patientId, patientName, "hr", num(vitals.hr), "bpm", at);
  pushReading(rows, patientId, patientName, "spo2", num(vitals.spo2), "%", at);
  pushReading(rows, patientId, patientName, "temp", num(vitals.temp_f ?? vitals.temperature), "°F", at);
  pushReading(rows, patientId, patientName, "glucose", num(vitals.glucose), "mg/dL", at);
  pushReading(rows, patientId, patientName, "resp_rate", num(vitals.resp_rate ?? vitals.rr), "/min", at);

  const weightLb = num(String(vitals.weight || "").replace(/[^0-9.]/g, ""));
  pushReading(rows, patientId, patientName, "weight", weightLb, "lbs", at);

  return rows;
}

export async function syncEnrollmentVitalsToReadings(
  patientId: string,
  patientName: string,
  vitals: PatientVitalsRecord,
): Promise<{ ok: boolean; inserted: number; error?: string }> {
  const rows = vitalsToReadingInserts(patientId, patientName, vitals);
  if (!rows.length) return { ok: true, inserted: 0 };

  try {
    const { error } = await supabase.from("vital_readings").insert(rows);
    if (error) {
      if (error.message?.includes("does not exist") || error.code === "PGRST205") {
        return { ok: false, inserted: 0, error: "vital_readings table missing" };
      }
      return { ok: false, inserted: 0, error: error.message };
    }
    return { ok: true, inserted: rows.length };
  } catch (e) {
    return { ok: false, inserted: 0, error: e instanceof Error ? e.message : "sync failed" };
  }
}

function hasIntakeField(vitals: PatientVitalsRecord | IntakeVitals | null, fields: (keyof PatientVitalsRecord)[]): boolean {
  if (!vitals) return false;
  const v = vitals as PatientVitalsRecord & IntakeVitals;
  for (const f of fields) {
    const val = v[f as keyof typeof v];
    if (val != null && String(val).trim() !== "") return true;
  }
  if (fields.includes("bp_sys") || fields.includes("bp_dia") || fields.includes("bp")) {
    if (v.bp_sys != null || v.bp_dia != null || (v as PatientVitalsRecord).bp) return true;
  }
  return false;
}

function hasReadingMetrics(readings: VitalReading[], metrics: string[]): boolean {
  return readings.some((r) => metrics.includes(r.metric));
}

/** Doctor hub: which vitals are missing for this patient */
export function assessVitalCompleteness(
  intake: IntakeVitals | null,
  readings: VitalReading[],
): VitalCompletenessItem[] {
  const raw = intake as IntakeVitals | null;
  return VITAL_FIELD_CATALOG.map((cat) => {
    const hasIntake = hasIntakeField(raw as PatientVitalsRecord | null, cat.intakeFields);
    const hasReadings = cat.metrics.length > 0 && hasReadingMetrics(readings, cat.metrics);

    let status: VitalCompletenessItem["status"] = "missing";
    if (cat.key === "bp") {
      const hasSys = hasReadingMetrics(readings, ["bp_sys"]) || (raw?.bp_sys != null);
      const hasDia = hasReadingMetrics(readings, ["bp_dia"]) || (raw?.bp_dia != null);
      if (hasSys && hasDia) status = "complete";
      else if (hasSys || hasDia || hasIntake) status = "partial";
    } else if (hasReadings && hasIntake) status = "complete";
    else if (hasReadings || hasIntake) status = "partial";
    else status = "missing";

    const detail =
      status === "complete"
        ? "Intake + readings on chart"
        : status === "partial"
          ? hasIntake
            ? "Intake only — no device trend yet"
            : "Readings only — not in enrollment snapshot"
          : "Not captured — ask patient or sync device";

    return {
      key: cat.key,
      label: cat.label,
      status,
      detail,
      hasIntake,
      hasReadings,
    };
  });
}

export function formatIntakeNotesLine(vitals: PatientVitalsRecord): string {
  const parts = [
    vitals.height ? `H: ${vitals.height}` : null,
    vitals.weight ? `W: ${vitals.weight}` : null,
    vitals.bmi ? `BMI: ${vitals.bmi}` : null,
    vitals.bp ? `BP: ${vitals.bp}` : vitals.bp_sys && vitals.bp_dia ? `BP: ${vitals.bp_sys}/${vitals.bp_dia}` : null,
    vitals.hr != null ? `HR: ${vitals.hr}` : null,
    vitals.spo2 != null ? `SpO2: ${vitals.spo2}%` : null,
    vitals.temp_f != null ? `Temp: ${vitals.temp_f}°F` : null,
    vitals.glucose != null ? `Glucose: ${vitals.glucose}` : null,
    vitals.resp_rate != null ? `RR: ${vitals.resp_rate}` : null,
    vitals.sex ? `Sex: ${vitals.sex}` : null,
    `Allergies: ${vitals.allergies || "None"}`,
    `Meds: ${vitals.currentMeds || "None"}`,
  ].filter(Boolean);
  return parts.join(" | ");
}

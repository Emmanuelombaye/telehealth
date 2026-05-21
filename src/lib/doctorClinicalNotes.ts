/**
 * SOAP / clinical notes — serialization for visit_summaries.diagnosis field.
 * Schema has no separate notes columns; full SOAP is stored as tagged JSON in diagnosis.
 */

export type SoapNote = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
};

export type SavedClinicalNote = {
  id: string;
  patient_id: string | null;
  patientName: string;
  doctor_id: string | null;
  doctor_name: string | null;
  specialty: string | null;
  date: string;
  type: string | null;
  diagnosis: string | null;
  follow_up_date: string | null;
  created_at: string | null;
  soap: SoapNote;
  assessmentPreview: string;
};

export const SOAP_SECTIONS = [
  {
    key: "subjective" as const,
    label: "Subjective",
    short: "S",
    hint: "History, symptoms, patient-reported concerns",
    color: "border-blue-200 bg-blue-50/60",
    accent: "text-blue-700",
  },
  {
    key: "objective" as const,
    label: "Objective",
    short: "O",
    hint: "Exam findings, vitals, observable data",
    color: "border-amber-200 bg-amber-50/60",
    accent: "text-amber-800",
  },
  {
    key: "assessment" as const,
    label: "Assessment",
    short: "A",
    hint: "Diagnosis, clinical impression, severity",
    color: "border-violet-200 bg-violet-50/60",
    accent: "text-violet-800",
  },
  {
    key: "plan" as const,
    label: "Plan",
    short: "P",
    hint: "Treatment, prescriptions, follow-up",
    color: "border-emerald-200 bg-emerald-50/60",
    accent: "text-emerald-800",
  },
];

export const NOTE_TEMPLATES: { id: string; label: string; soap: SoapNote }[] = [
  {
    id: "telehealth",
    label: "Telehealth follow-up",
    soap: {
      subjective: "Patient presents via secure telehealth for follow-up. Reports adherence to prior plan; no new red-flag symptoms at time of visit.",
      objective: "Reviewed enrollment vitals and intake data. Patient appears well on video; speech clear, no acute distress observed.",
      assessment: "Stable on current treatment plan. Condition appropriate for continued async/telehealth management.",
      plan: "Continue current medication regimen. Counsel on when to seek urgent care. Follow up in 4–6 weeks or sooner if symptoms worsen.",
    },
  },
  {
    id: "new-eval",
    label: "New patient evaluation",
    soap: {
      subjective: "New telehealth enrollment. Patient completed medical intake questionnaire prior to visit.",
      objective: "Intake vitals and history reviewed. No contraindications identified from structured screening at this time.",
      assessment: "Medically appropriate candidate for requested treatment pathway pending final physician attestation.",
      plan: "Proceed per clinical protocol after verification of identity and intake completeness. Document consent and routing decision.",
    },
  },
  {
    id: "med-mgmt",
    label: "Medication management",
    soap: {
      subjective: "Visit focused on medication tolerance, side effects, and treatment goals.",
      objective: "Prior prescription and pharmacy status reviewed. No reported serious adverse events.",
      assessment: "Medication management visit — dosing and monitoring per protocol.",
      plan: "Adjust or renew prescription as indicated. Reinforce administration instructions and monitoring labs if applicable.",
    },
  },
];

const SOAP_TAG = "__PEAK_SOAP_V1__";

export function emptySoapNote(): SoapNote {
  return { subjective: "", objective: "", assessment: "", plan: "" };
}

export function serializeSoapToDiagnosis(soap: SoapNote): string {
  const payload = {
    v: 1,
    soap,
    preview: soap.assessment.trim().slice(0, 500) || soap.subjective.trim().slice(0, 200) || "Clinical note",
  };
  return `${SOAP_TAG}${JSON.stringify(payload)}`;
}

export function parseDiagnosisField(diagnosis: string | null | undefined): {
  soap: SoapNote;
  assessmentPreview: string;
} {
  if (!diagnosis) return { soap: emptySoapNote(), assessmentPreview: "" };
  if (diagnosis.startsWith(SOAP_TAG)) {
    try {
      const raw = JSON.parse(diagnosis.slice(SOAP_TAG.length)) as {
        soap?: SoapNote;
        preview?: string;
      };
      return {
        soap: {
          subjective: raw.soap?.subjective ?? "",
          objective: raw.soap?.objective ?? "",
          assessment: raw.soap?.assessment ?? "",
          plan: raw.soap?.plan ?? "",
        },
        assessmentPreview: raw.preview ?? raw.soap?.assessment ?? "",
      };
    } catch {
      return { soap: emptySoapNote(), assessmentPreview: diagnosis };
    }
  }
  return {
    soap: { ...emptySoapNote(), assessment: diagnosis },
    assessmentPreview: diagnosis,
  };
}

export function formatFullSoapText(soap: SoapNote): string {
  return [
    "SUBJECTIVE",
    soap.subjective || "—",
    "",
    "OBJECTIVE",
    soap.objective || "—",
    "",
    "ASSESSMENT",
    soap.assessment || "—",
    "",
    "PLAN",
    soap.plan || "—",
  ].join("\n");
}

export function soapWordCount(soap: SoapNote): number {
  const text = Object.values(soap).join(" ");
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function buildIntakePrefill(order: {
  patient_name?: string | null;
  patient_age?: number | null;
  category?: string | null;
  medication?: string | null;
  intake_notes?: string | null;
  patient_vitals?: unknown;
  intake_answers?: Record<string, unknown> | null;
}): SoapNote {
  const vitals =
    order.patient_vitals && typeof order.patient_vitals === "object"
      ? JSON.stringify(order.patient_vitals)
      : "Not documented";
  const subjective =
    order.intake_notes ||
    `Patient ${order.patient_name || "unknown"} presents for ${order.category || "telehealth"} evaluation regarding ${order.medication || "treatment"}.`;
  const objective = `Age ${order.patient_age ?? "N/A"}. Enrollment vitals/intake: ${vitals}.`;
  return {
    subjective,
    objective,
    assessment: `Clinical evaluation for ${order.medication || order.category || "requested care"}.`,
    plan: `Document clinical decision after review. Route per enrollment protocol.`,
  };
}

export function mapSavedNotes(
  rows: Record<string, unknown>[],
  patientNames: Map<string, string>,
): SavedClinicalNote[] {
  return rows.map((row) => {
    const parsed = parseDiagnosisField(row.diagnosis as string | null);
    const pid = row.patient_id as string | null;
    return {
      id: row.id as string,
      patient_id: pid,
      patientName: (pid && patientNames.get(pid)) || "Unknown patient",
      doctor_id: row.doctor_id as string | null,
      doctor_name: row.doctor_name as string | null,
      specialty: row.specialty as string | null,
      date: (row.date as string) || (row.created_at as string) || new Date().toISOString(),
      type: row.type as string | null,
      diagnosis: row.diagnosis as string | null,
      follow_up_date: row.follow_up_date as string | null,
      created_at: row.created_at as string | null,
      soap: parsed.soap,
      assessmentPreview: parsed.assessmentPreview,
    };
  });
}

export function formatNoteDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

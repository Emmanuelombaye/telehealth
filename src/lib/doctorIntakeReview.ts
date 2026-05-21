/**
 * Doctor-facing intake review — labels, risk flags, conditional logic from order intake data.
 * Read-only; does not change enrollment routing.
 */

import { matchClinicalIntakeTemplate, type ClinicalIntakeTemplate } from "./clinicalIntakeTemplates";

export type IntakeRiskLevel = "critical" | "high" | "warning" | "info";

export type IntakeRiskFlag = {
  id: string;
  level: IntakeRiskLevel;
  title: string;
  detail: string;
};

export type IntakeAnswerRow = {
  questionId: string;
  label: string;
  answer: string;
  highlight: boolean;
};

export type DoctorIntakeReview = {
  patientName: string;
  orderId: string;
  category: string;
  medication: string;
  intakeComplete: boolean;
  intakeNotes: string | null;
  questionnaireName: string;
  symptomsSummary: string;
  riskFlags: IntakeRiskFlag[];
  overallRisk: "critical" | "elevated" | "standard";
  requiresVideo: boolean;
  flagManualReview: boolean;
  conditionalWarnings: string[];
  matchedTriggerIds: string[];
  answers: IntakeAnswerRow[];
  consentStatus: string;
  submittedAt: string | null;
};

export type OrderIntakeSource = {
  id?: string;
  order_number?: string;
  patient_name?: string;
  category?: string;
  medication?: string;
  intake_complete?: boolean;
  intake_notes?: string | null;
  intake_answers?: Record<string, unknown> | null;
  intakeAnswers?: Record<string, unknown> | null;
  enrollment_video_required?: boolean;
  urgent?: boolean;
  created_at?: string;
  orderedDate?: string;
};

const INTERNAL_KEYS = new Set(["_scheduling", "_intake_conditional"]);

const KEYWORD_RULES: { level: IntakeRiskLevel; title: string; patterns: RegExp[] }[] = [
  {
    level: "critical",
    title: "Cardiac symptom reported",
    patterns: [/chest\s*pain/i, /chest\s*pressure/i, /angina/i, /heart\s*attack/i],
  },
  {
    level: "critical",
    title: "Respiratory distress reported",
    patterns: [
      /difficulty\s*breathing/i,
      /shortness\s*of\s*breath/i,
      /can'?t\s*breathe/i,
      /severe\s*asthma\s*attack/i,
      /wheez/i,
    ],
  },
  {
    level: "critical",
    title: "Acute psychiatric concern",
    patterns: [/suicidal/i, /self[\s-]*harm/i, /want\s*to\s*die/i],
  },
  {
    level: "high",
    title: "Elevated blood pressure concern",
    patterns: [/high\s*blood\s*pressure/i, /hypertension\s*crisis/i, /bp\s*1[4-9]\d/i, /bp\s*over/i],
  },
  {
    level: "high",
    title: "Severe allergic history",
    patterns: [/anaphylaxis/i, /severe\s*allerg/i, /epinephrine\s*pen/i],
  },
];

function formatAnswer(val: unknown): string {
  if (val == null || val === "") return "—";
  if (Array.isArray(val)) return val.map(String).join(", ");
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildLabelMap(template: ClinicalIntakeTemplate | null): Map<string, string> {
  const map = new Map<string, string>();
  if (!template) return map;
  for (const q of template.questionnaire) {
    map.set(q.id, q.label || humanizeKey(q.id));
  }
  return map;
}

function scanKeywordRisks(text: string, questionId: string): IntakeRiskFlag[] {
  const flags: IntakeRiskFlag[] = [];
  for (const rule of KEYWORD_RULES) {
    if (rule.patterns.some((p) => p.test(text))) {
      flags.push({
        id: `${rule.level}-${rule.title}-${questionId}`,
        level: rule.level,
        title: rule.title,
        detail: `Detected in response to “${humanizeKey(questionId)}”.`,
      });
    }
  }
  return flags;
}

function yesAnswer(val: unknown): boolean {
  const s = formatAnswer(val).trim().toLowerCase();
  return s === "yes" || s === "true" || s === "y";
}

function parseConditionalMeta(raw: Record<string, unknown>) {
  const meta = raw._intake_conditional;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
    return {
      requiresVideo: false,
      flagManualReview: false,
      warnings: [] as string[],
      matchedTriggerIds: [] as string[],
    };
  }
  const m = meta as Record<string, unknown>;
  return {
    requiresVideo: m.requires_video === true,
    flagManualReview: m.flag_manual_review === true,
    warnings: Array.isArray(m.warnings) ? m.warnings.map(String) : [],
    matchedTriggerIds: Array.isArray(m.matched_triggers) ? m.matched_triggers.map(String) : [],
  };
}

function buildSymptomsSummary(answers: Record<string, unknown>, template: ClinicalIntakeTemplate | null): string {
  const parts: string[] = [];
  const symptomKeys = [
    "symptoms",
    "wl_symptoms",
    "skin_photo",
    "skin_concern",
    "primary_symptom",
    "chief_complaint",
  ];
  for (const key of symptomKeys) {
    if (answers[key] != null && answers[key] !== "") {
      const label = template ? buildLabelMap(template).get(key) ?? humanizeKey(key) : humanizeKey(key);
      parts.push(`${label}: ${formatAnswer(answers[key])}`);
    }
  }
  if (parts.length) return parts.join(" · ");
  const textarea = Object.entries(answers).find(
    ([k, v]) => !INTERNAL_KEYS.has(k) && typeof v === "string" && String(v).length > 40,
  );
  if (textarea) return `${humanizeKey(textarea[0])}: ${textarea[1]}`;
  return "No free-text symptom narrative; review structured answers below.";
}

export function buildDoctorIntakeReview(order: OrderIntakeSource): DoctorIntakeReview {
  const rawAnswers = (order.intakeAnswers ?? order.intake_answers ?? {}) as Record<string, unknown>;
  const displayAnswers = { ...rawAnswers };
  const conditional = parseConditionalMeta(rawAnswers);
  const template = matchClinicalIntakeTemplate(order.category);
  const labelMap = buildLabelMap(template);

  const riskFlags: IntakeRiskFlag[] = [];
  const highlightIds = new Set<string>();

  if (conditional.flagManualReview) {
    riskFlags.push({
      id: "manual-review",
      level: "high",
      title: "Manual clinical review flagged",
      detail: "Enrollment logic marked this chart for physician review before prescribing.",
    });
  }

  if (conditional.requiresVideo || order.enrollment_video_required) {
    riskFlags.push({
      id: "video-required",
      level: "warning",
      title: "Video consultation required",
      detail: "Intake or clinical routing requires a synchronous video visit.",
    });
  }

  for (const w of conditional.warnings) {
    riskFlags.push({
      id: `warn-${w.slice(0, 24)}`,
      level: "warning",
      title: "Conditional intake warning",
      detail: w,
    });
  }

  for (const triggerId of conditional.matchedTriggerIds) {
    highlightIds.add(triggerId);
    riskFlags.push({
      id: `trigger-${triggerId}`,
      level: "high",
      title: "Answer trigger activated",
      detail: `Question “${labelMap.get(triggerId) ?? humanizeKey(triggerId)}” matched a clinical routing rule.`,
    });
  }

  const allergies = formatAnswer(displayAnswers.allergies ?? displayAnswers.wl_allergies);
  if (allergies && !/^(none|n\/a|none reported)$/i.test(allergies)) {
    riskFlags.push({
      id: "allergies",
      level: "warning",
      title: "Allergies documented",
      detail: allergies,
    });
  }

  const answerRows: IntakeAnswerRow[] = [];

  for (const [key, val] of Object.entries(displayAnswers)) {
    if (INTERNAL_KEYS.has(key)) continue;
    const answer = formatAnswer(val);
    const label = labelMap.get(key) ?? humanizeKey(key);

    const keywordHits = scanKeywordRisks(`${label} ${answer}`, key);
    for (const hit of keywordHits) {
      if (!riskFlags.some((f) => f.id === hit.id)) riskFlags.push(hit);
    }

    const sensitiveYes =
      yesAnswer(val) &&
      /pregnant|breastfeeding|heart|diabetes|suicid|breathing|chest|failure|mtc|men2|swelling|fever/i.test(
        label,
      );

    if (sensitiveYes) {
      highlightIds.add(key);
      if (!riskFlags.some((f) => f.id === `yes-${key}`)) {
        riskFlags.push({
          id: `yes-${key}`,
          level: /chest|breath|suicid|swelling|fever/i.test(label) ? "critical" : "high",
          title: `Positive screen: ${label}`,
          detail: `Patient answered “${answer}”.`,
        });
      }
    }

    answerRows.push({
      questionId: key,
      label,
      answer,
      highlight: highlightIds.has(key) || keywordHits.length > 0,
    });
  }

  const hasCritical = riskFlags.some((f) => f.level === "critical");
  const hasElevated = riskFlags.some((f) => f.level === "high" || f.level === "warning");

  return {
    patientName: order.patient_name || "Unknown patient",
    orderId: order.order_number || order.id || "",
    category: order.category || "General",
    medication: order.medication || "—",
    intakeComplete: order.intake_complete === true,
    intakeNotes: order.intake_notes ?? null,
    questionnaireName: template?.questionnaireName ?? "Enrollment medical intake",
    symptomsSummary: buildSymptomsSummary(displayAnswers, template),
    riskFlags,
    overallRisk: hasCritical ? "critical" : hasElevated ? "elevated" : "standard",
    requiresVideo: conditional.requiresVideo || order.enrollment_video_required === true,
    flagManualReview: conditional.flagManualReview || order.urgent === true,
    conditionalWarnings: conditional.warnings,
    matchedTriggerIds: conditional.matchedTriggerIds,
    answers: answerRows,
    consentStatus: order.intake_complete
      ? "Telehealth & HIPAA consent acknowledged at enrollment"
      : "Intake incomplete — consent may be pending",
    submittedAt: order.created_at ?? order.orderedDate ?? null,
  };
}

export function riskLevelStyles(level: IntakeRiskLevel): {
  badge: string;
  border: string;
  icon: string;
} {
  switch (level) {
    case "critical":
      return {
        badge: "bg-red-100 text-red-900 border-red-200",
        border: "border-red-300 bg-red-50",
        icon: "text-red-600",
      };
    case "high":
      return {
        badge: "bg-orange-100 text-orange-900 border-orange-200",
        border: "border-orange-200 bg-orange-50",
        icon: "text-orange-600",
      };
    case "warning":
      return {
        badge: "bg-amber-100 text-amber-900 border-amber-200",
        border: "border-amber-200 bg-amber-50",
        icon: "text-amber-600",
      };
    default:
      return {
        badge: "bg-slate-100 text-slate-700 border-slate-200",
        border: "border-slate-200 bg-slate-50",
        icon: "text-slate-500",
      };
  }
}

export function overallRiskStyles(risk: DoctorIntakeReview["overallRisk"]) {
  if (risk === "critical") return "bg-red-600 text-white border-red-700";
  if (risk === "elevated") return "bg-amber-500 text-white border-amber-600";
  return "bg-emerald-600 text-white border-emerald-700";
}

/** Map patient-store `Order` to intake review source (read-only). */
export function orderToIntakeSource(order: {
  id: string;
  patientName?: string;
  category?: string;
  medication?: string;
  intakeComplete?: boolean;
  intakeNotes?: string | null;
  intakeAnswers?: Record<string, unknown> | null;
  enrollmentVideoRequired?: boolean;
  urgent?: boolean;
  created_at?: string;
  orderedDate?: string;
}): OrderIntakeSource {
  return {
    id: order.id,
    order_number: order.id,
    patient_name: order.patientName,
    category: order.category,
    medication: order.medication,
    intake_complete: order.intakeComplete,
    intake_notes: order.intakeNotes ?? null,
    intakeAnswers: order.intakeAnswers ?? null,
    enrollment_video_required: order.enrollmentVideoRequired,
    urgent: order.urgent,
    created_at: order.created_at,
    orderedDate: order.orderedDate,
  };
}

/** Map Supabase `orders` row (snake_case) to intake review source. */
export function supabaseOrderToIntakeSource(row: Record<string, unknown>): OrderIntakeSource {
  return {
    id: row.id as string | undefined,
    order_number: (row.order_number ?? row.id) as string | undefined,
    patient_name: row.patient_name as string | undefined,
    category: row.category as string | undefined,
    medication: row.medication as string | undefined,
    intake_complete: row.intake_complete as boolean | undefined,
    intake_notes: (row.intake_notes as string | null) ?? null,
    intake_answers: (row.intake_answers as Record<string, unknown> | null) ?? null,
    enrollment_video_required: row.enrollment_video_required as boolean | undefined,
    urgent: row.urgent as boolean | undefined,
    created_at: row.created_at as string | undefined,
  };
}

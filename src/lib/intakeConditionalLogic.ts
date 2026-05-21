/**
 * Intake questionnaire conditional logic (Brandon architecture).
 * Tied to each product's questionnaire + features.video_clinical_rules.answerTriggers.
 * Does not add enrollment steps — only visibility, warnings, and submit guards within medical-intake.
 */

import type { EnrollmentVideoRouting } from "./enrollVideoRouting";
import { evaluateEnrollmentVideoRouting } from "./enrollVideoRouting";
import {
  answerMatchesValues,
  getMatchedProductAnswerTriggers,
  requiresSyncVideoVisit,
  type ClinicalContext,
  type ConsultRoutingRuleRow,
  type IntakeAnswerTrigger,
  type ProductVideoRules,
} from "./videoConsultRules";

export type IntakeQuestion = {
  id: string;
  label?: string;
  type?: string;
  options?: string[];
  required?: boolean;
  /** Show this question only when another answer matches */
  showIf?: { questionId: string; values: string[] };
  /** When this question's answer is in the list → require sync video */
  requireVideoWhen?: string[];
  /** answer value → warning message */
  warningWhen?: Record<string, string>;
  /** answer values that block final submit */
  blockSubmitWhen?: string[];
};

export type IntakeConditionalEffects = {
  requiresSyncVideo: boolean;
  routing: EnrollmentVideoRouting;
  warnings: string[];
  blockSubmit: boolean;
  blockSubmitMessage: string | null;
  flagManualReview: boolean;
  matchedAnswerTriggers: IntakeAnswerTrigger[];
};

function parseQuestion(raw: unknown): IntakeQuestion | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const id = o.id;
  if (typeof id !== "string" || !id.trim()) return null;

  const showIfRaw = o.showIf ?? o.show_if;
  let showIf: IntakeQuestion["showIf"];
  if (showIfRaw && typeof showIfRaw === "object" && !Array.isArray(showIfRaw)) {
    const s = showIfRaw as Record<string, unknown>;
    const qid = (s.questionId ?? s.question_id) as string | undefined;
    const vals = s.values;
    if (qid && Array.isArray(vals)) {
      showIf = { questionId: String(qid), values: vals.map((v) => String(v)) };
    }
  }

  const requireVideoWhen = Array.isArray(o.requireVideoWhen)
    ? o.requireVideoWhen.map(String)
    : Array.isArray(o.require_video_when)
      ? o.require_video_when.map(String)
      : undefined;

  const warningWhen =
    o.warningWhen && typeof o.warningWhen === "object" && !Array.isArray(o.warningWhen)
      ? (o.warningWhen as Record<string, string>)
      : o.warning_when && typeof o.warning_when === "object" && !Array.isArray(o.warning_when)
        ? (o.warning_when as Record<string, string>)
        : undefined;

  const blockSubmitWhen = Array.isArray(o.blockSubmitWhen)
    ? o.blockSubmitWhen.map(String)
    : Array.isArray(o.block_submit_when)
      ? o.block_submit_when.map(String)
      : undefined;

  return {
    id: id.trim(),
    label: typeof o.label === "string" ? o.label : undefined,
    type: typeof o.type === "string" ? o.type : undefined,
    options: Array.isArray(o.options) ? o.options.map(String) : undefined,
    required: o.required === true,
    showIf,
    requireVideoWhen,
    warningWhen,
    blockSubmitWhen,
  };
}

export function normalizeIntakeQuestions(rows: unknown): IntakeQuestion[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(parseQuestion).filter((q): q is IntakeQuestion => q != null);
}

/** Questions visible given current answers (conditional show/hide). */
export function getVisibleIntakeQuestions(
  questions: IntakeQuestion[],
  answers: Record<string, string | string[]>
): IntakeQuestion[] {
  return questions.filter((q) => {
    if (!q.showIf) return true;
    return answerMatchesValues(answers, q.showIf.questionId, q.showIf.values);
  });
}

function questionLevelRequiresVideo(q: IntakeQuestion, answers: Record<string, string | string[]>): boolean {
  if (!q.requireVideoWhen?.length) return false;
  return answerMatchesValues(answers, q.id, q.requireVideoWhen);
}

function questionLevelWarnings(q: IntakeQuestion, answers: Record<string, string | string[]>): string[] {
  if (!q.warningWhen) return [];
  const raw = answers[q.id];
  const selected = Array.isArray(raw) ? raw.map(String) : raw != null && raw !== "" ? [String(raw)] : [];
  const out: string[] = [];
  for (const ans of selected) {
    const msg = q.warningWhen[ans] ?? q.warningWhen[ans.trim()];
    if (msg) out.push(msg);
  }
  return out;
}

function questionLevelBlocksSubmit(q: IntakeQuestion, answers: Record<string, string | string[]>): string | null {
  if (!q.blockSubmitWhen?.length) return null;
  if (!answerMatchesValues(answers, q.id, q.blockSubmitWhen)) return null;
  return (
    q.warningWhen?.[String(answers[q.id])] ||
    "Based on your intake answers, we cannot complete enrollment online. Please contact support."
  );
}

/**
 * Full intake effects: video path, warnings, block submit, manual review flag.
 * Video requirement includes product/state/BMI/age/answerTriggers + per-question requireVideoWhen.
 */
export function evaluateIntakeConditionalEffects(
  productRules: ProductVideoRules | null,
  globalVideoStates: string[],
  dbRules: ConsultRoutingRuleRow[],
  ctx: ClinicalContext,
  questions: IntakeQuestion[]
): IntakeConditionalEffects {
  const matchedAnswerTriggers = productRules
    ? getMatchedProductAnswerTriggers(productRules.clinical, ctx.answers)
    : [];

  let requiresSyncVideo =
    requiresSyncVideoVisit(productRules, globalVideoStates, dbRules, ctx) ||
    questions.some((q) => questionLevelRequiresVideo(q, ctx.answers));

  const warnings: string[] = [];
  let blockSubmit = false;
  let blockSubmitMessage: string | null = null;
  let flagManualReview = false;

  for (const t of matchedAnswerTriggers) {
    if (t.blockSubmit) {
      blockSubmit = true;
      blockSubmitMessage =
        t.message ||
        "Based on your intake answers, we cannot complete enrollment online. Please contact support.";
    }
    if (t.flagManualReview) flagManualReview = true;
  }

  for (const q of questions) {
    warnings.push(...questionLevelWarnings(q, ctx.answers));
    if (questionLevelRequiresVideo(q, ctx.answers)) requiresSyncVideo = true;
    const blockMsg = questionLevelBlocksSubmit(q, ctx.answers);
    if (blockMsg) {
      blockSubmit = true;
      blockSubmitMessage = blockMsg;
    }
  }

  const routing = evaluateEnrollmentVideoRouting(productRules, globalVideoStates, dbRules, ctx);
  for (const q of questions) {
    if (questionLevelRequiresVideo(q, ctx.answers)) {
      requiresSyncVideo = true;
      routing.reasons.push(
        `Your answer to "${q.label || q.id}" requires a scheduled video visit with a clinician.`,
      );
    }
  }
  if (requiresSyncVideo && !routing.requiresSyncVideo) {
    routing.requiresSyncVideo = true;
    routing.pathLabel = "video";
    routing.headline = "A video visit is required — book a time with your clinician below.";
    if (!routing.reasons.length) {
      routing.reasons.push("Your intake answers require a live video visit with a clinician.");
    }
  }
  routing.reasons = [...new Set(routing.reasons)];

  return {
    requiresSyncVideo,
    routing,
    warnings: [...new Set(warnings)],
    blockSubmit,
    blockSubmitMessage,
    flagManualReview,
    matchedAnswerTriggers,
  };
}

/**
 * Patient shop enrollment — sync video routing (Brandon architecture).
 * Source of truth: product (drug/protocol) + shipping state + admin DB rules + vitals (BMI/age).
 * Questionnaire answers must NOT decide whether video is required.
 */

import type { ConsultRoutingRuleRow, ClinicalContext, ProductVideoRules } from "./videoConsultRules";
import {
  computeAgeYears,
  computeNumericBmi,
  normalizeUsState,
  patientRequiresScheduledVideo,
} from "./videoConsultRules";

export type EnrollmentVideoRouting = {
  requiresSyncVideo: boolean;
  /** Patient-facing explanation bullets */
  reasons: string[];
  /** Short label for stepper / headers */
  pathLabel: "video" | "async";
  headline: string;
};

function productClinicalVitalsOnly(
  clinical: ProductVideoRules["clinical"],
  ctx: Pick<ClinicalContext, "bmi" | "age">,
): boolean {
  if (!clinical) return false;
  if (clinical.bmiMin != null && ctx.bmi != null && ctx.bmi >= clinical.bmiMin) return true;
  if (clinical.ageMin != null && ctx.age != null && ctx.age >= clinical.ageMin) return true;
  return false;
}

function dbRuleRequiresVideoWithoutAnswers(
  rule: ConsultRoutingRuleRow,
  ctx: Pick<ClinicalContext, "patientState" | "productCategory" | "productId" | "bmi" | "age">,
): boolean {
  if (!rule.active || !rule.requires_sync_video) return false;
  if (rule.match_states?.length) {
    const st = normalizeUsState(ctx.patientState);
    if (!st || !rule.match_states.map((s) => normalizeUsState(s)).filter(Boolean).includes(st)) {
      return false;
    }
  }
  if (rule.match_categories?.length) {
    const ok = rule.match_categories.some(
      (c) => c.trim().toLowerCase() === ctx.productCategory.trim().toLowerCase(),
    );
    if (!ok) return false;
  }
  if (rule.match_product_ids?.length && !rule.match_product_ids.includes(ctx.productId)) {
    return false;
  }
  const cj = rule.clinical_json;
  if (!cj || Object.keys(cj).length === 0) return true;
  const hasAnswerTriggers = (cj.answer_triggers?.length ?? 0) > 0;
  const hasVitals =
    cj.bmi_min != null || cj.age_min != null;
  if (hasAnswerTriggers && !hasVitals) return false;
  if (cj.bmi_min != null && ctx.bmi != null && ctx.bmi >= cj.bmi_min) return true;
  if (cj.age_min != null && ctx.age != null && ctx.age >= cj.age_min) return true;
  return !hasAnswerTriggers && !hasVitals;
}

/**
 * Evaluate whether step 8 must include Calendly / Cal.com scheduling.
 * Never reads questionnaire `answers`.
 */
export function evaluateEnrollmentVideoRouting(
  productRules: ProductVideoRules | null,
  globalVideoStates: string[],
  dbRules: ConsultRoutingRuleRow[],
  ctx: {
    patientState: string;
    productCategory: string;
    productId: string;
    heightFt: string;
    heightIn: string;
    weight: string;
    dob: string;
  },
): EnrollmentVideoRouting {
  const reasons: string[] = [];
  const bmi = computeNumericBmi(ctx.heightFt, ctx.heightIn, ctx.weight);
  const age = computeAgeYears(ctx.dob);
  const st = normalizeUsState(ctx.patientState);

  const routingCtx: ClinicalContext = {
    patientState: ctx.patientState,
    productCategory: ctx.productCategory,
    productId: ctx.productId,
    bmi,
    age,
    answers: {},
  };

  if (!productRules) {
    return {
      requiresSyncVideo: false,
      reasons: [],
      pathLabel: "async",
      headline: "Your clinician will review your intake asynchronously — no video call required.",
    };
  }

  if (productRules.requiresVideoConsult) {
    reasons.push("This treatment program requires a brief live video visit with a licensed clinician.");
  }
  if (st && globalVideoStates.includes(st)) {
    reasons.push(`Regulations for patients in ${st} require a synchronous video consultation.`);
  }
  if (st && productRules.videoRequiredStates.length > 0 && productRules.videoRequiredStates.includes(st)) {
    reasons.push(`This medication requires a video visit for patients in ${st}.`);
  }
  if (productClinicalVitalsOnly(productRules.clinical, { bmi, age })) {
    if (productRules.clinical?.bmiMin != null && bmi != null && bmi >= productRules.clinical.bmiMin) {
      reasons.push("Your BMI qualifies this program for a live clinical video visit.");
    } else if (productRules.clinical?.ageMin != null && age != null && age >= productRules.clinical.ageMin) {
      reasons.push("Your age requires a live clinical video visit for this program.");
    }
  }

  const sorted = [...dbRules].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  for (const rule of sorted) {
    if (dbRuleRequiresVideoWithoutAnswers(rule, routingCtx)) {
      reasons.push("Your care program routing requires a scheduled video visit.");
      break;
    }
  }

  const dbMatch = sorted.some((r) => dbRuleRequiresVideoWithoutAnswers(r, routingCtx));

  const requiresSyncVideo =
    patientRequiresScheduledVideo(productRules, ctx.patientState, globalVideoStates) ||
    productClinicalVitalsOnly(productRules.clinical, { bmi, age }) ||
    dbMatch ||
    reasons.length > 0;

  const uniqueReasons = [...new Set(reasons)];

  if (requiresSyncVideo) {
    return {
      requiresSyncVideo: true,
      reasons: uniqueReasons.length
        ? uniqueReasons
        : ["A live video visit is required for your medication and state."],
      pathLabel: "video",
      headline: "A video visit is required — book a time with your clinician below.",
    };
  }

  return {
    requiresSyncVideo: false,
    reasons: [],
    pathLabel: "async",
    headline:
      "No live video call is required. Your assigned clinician will review your intake and follow up asynchronously.",
  };
}

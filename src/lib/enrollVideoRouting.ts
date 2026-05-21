/**
 * Patient shop enrollment — sync video routing tied to intake + product rules.
 * Uses full clinical context (including questionnaire answers) via videoConsultRules.
 */

import type { ConsultRoutingRuleRow, ClinicalContext, ProductVideoRules } from "./videoConsultRules";
import {
  buildEnrollmentVideoReasons,
  requiresSyncVideoVisit,
} from "./videoConsultRules";

export type EnrollmentVideoRouting = {
  requiresSyncVideo: boolean;
  /** Patient-facing explanation bullets */
  reasons: string[];
  /** Short label for stepper / headers */
  pathLabel: "video" | "async";
  headline: string;
};

/**
 * Evaluate Path A (video) vs Path B (async) for enrollment medical-intake.
 * Intake questionnaire answers can require video via answerTriggers and per-question rules.
 */
export function evaluateEnrollmentVideoRouting(
  productRules: ProductVideoRules | null,
  globalVideoStates: string[],
  dbRules: ConsultRoutingRuleRow[],
  ctx: ClinicalContext
): EnrollmentVideoRouting {
  const requiresSyncVideo = requiresSyncVideoVisit(productRules, globalVideoStates, dbRules, ctx);
  const reasons = buildEnrollmentVideoReasons(productRules, globalVideoStates, dbRules, ctx);
  const uniqueReasons = [...new Set(reasons)];

  if (requiresSyncVideo) {
    return {
      requiresSyncVideo: true,
      reasons: uniqueReasons.length
        ? uniqueReasons
        : ["A live video visit is required based on your intake and program rules."],
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

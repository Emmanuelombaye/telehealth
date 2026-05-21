/**
 * Admin catalog — how a product is configured for enrollment Path A (video) vs Path B (async).
 * Mirrors signals used by evaluateEnrollmentVideoRouting (product features only).
 */

import { parseProductVideoRules, type ProductVideoRules } from "./videoConsultRules";

export type ProductRoutingMode =
  | "path_a_always"
  | "path_a_conditional"
  | "path_b"
  | "calendar_only";

export type ProductRoutingProfile = {
  mode: ProductRoutingMode;
  /** Table badge, e.g. "Path A · Always" */
  badgeLabel: string;
  /** Step 8 path label alignment */
  pathLabel: "video" | "async";
  summary: string;
  /** Bullet list for admin modal */
  triggers: string[];
  hasCalendarUrl: boolean;
  rules: ProductVideoRules;
};

function clinicalVitalsConfigured(rules: ProductVideoRules): boolean {
  const c = rules.clinical;
  if (!c) return false;
  return c.bmiMin != null || c.ageMin != null;
}

function answerTriggersConfigured(rules: ProductVideoRules): boolean {
  return (rules.clinical?.answerTriggers?.length ?? 0) > 0;
}

/** Describe routing from `products.features` JSON (no patient context). */
export function getProductRoutingProfile(features: unknown): ProductRoutingProfile {
  const rules = parseProductVideoRules(features);

  const hasCalendarUrl = Boolean(rules.schedulingEmbedUrl);
  const hasStates = rules.videoRequiredStates.length > 0;
  const hasVitals = clinicalVitalsConfigured(rules);
  const hasAnswerTriggers = answerTriggersConfigured(rules);

  if (rules.requiresVideoConsult) {
    return {
      mode: "path_a_always",
      badgeLabel: "Path A · Always",
      pathLabel: "video",
      summary: "Every patient on this protocol enters the video path at medical intake (step 8).",
      triggers: [
        "Always require sync video is enabled for this protocol.",
        ...(hasStates ? [`Also limited to states: ${rules.videoRequiredStates.join(", ")}`] : []),
        ...(hasVitals
          ? [
              rules.clinical?.bmiMin != null ? `BMI ≥ ${rules.clinical.bmiMin}` : "",
              rules.clinical?.ageMin != null ? `Age ≥ ${rules.clinical.ageMin}` : "",
            ].filter(Boolean)
          : []),
        ...(hasAnswerTriggers
          ? [`${rules.clinical!.answerTriggers!.length} intake answer trigger(s) on linked questionnaire`]
          : []),
      ],
      hasCalendarUrl,
      rules,
    };
  }

  if (hasStates || hasVitals || hasAnswerTriggers) {
    const triggers: string[] = [];
    if (hasStates) triggers.push(`Video when ship-to state is: ${rules.videoRequiredStates.join(", ")}`);
    if (rules.clinical?.bmiMin != null) triggers.push(`Video when BMI ≥ ${rules.clinical.bmiMin}`);
    if (rules.clinical?.ageMin != null) triggers.push(`Video when age ≥ ${rules.clinical.ageMin}`);
    if (hasAnswerTriggers) {
      for (const t of rules.clinical!.answerTriggers!) {
        triggers.push(
          `Video when "${t.questionId}" is ${t.values.join(" or ")}${t.message ? ` — ${t.message}` : ""}`,
        );
      }
    }
    return {
      mode: "path_a_conditional",
      badgeLabel: "Path A · Conditional",
      pathLabel: "video",
      summary: "Patients hit Path A only when state or vitals match the rules below; otherwise Path B (async).",
      triggers,
      hasCalendarUrl,
      rules,
    };
  }

  if (hasCalendarUrl) {
    return {
      mode: "calendar_only",
      badgeLabel: "Path B · Calendar only",
      pathLabel: "async",
      summary:
        "A scheduling URL is saved but no video routing flags are set — enrollment stays async unless global env or DB rules apply.",
      triggers: ["Scheduling embed URL is set without requires_video_consult or state/vital rules."],
      hasCalendarUrl,
      rules,
    };
  }

  return {
    mode: "path_b",
    badgeLabel: "Path B · Async",
    pathLabel: "async",
    summary: "No live video at intake — clinicians review the questionnaire asynchronously.",
    triggers: ["No product-level video routing flags configured."],
    hasCalendarUrl: false,
    rules,
  };
}

export function countProductsByRoutingMode(
  products: { features?: unknown }[],
): Record<ProductRoutingMode, number> {
  const counts: Record<ProductRoutingMode, number> = {
    path_a_always: 0,
    path_a_conditional: 0,
    path_b: 0,
    calendar_only: 0,
  };
  for (const p of products) {
    counts[getProductRoutingProfile(p.features).mode]++;
  }
  return counts;
}

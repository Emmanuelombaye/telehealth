/**
 * Conditional sync-video (Cal.com / Calendly) routing — drug, state, intake, and admin DB rules.
 *
 * Product `features` JSON (Supabase):
 *   requires_video_consult?: boolean
 *   video_required_states?: string[]   // 2-letter states; video if patient ships to one of these
 *   scheduling_embed_url?: string     // https embed for this protocol (aliases: scheduling_url, cal_booking_url)
 *   video_clinical_rules?: {
 *     bmiMin?: number;
 *     ageMin?: number;
 *     answerTriggers?: { questionId: string; values: string[] }[];
 *   }
 *
 * Env: VITE_VIDEO_REQUIRED_STATES=CA,FL  (any product → video if shipping to these states)
 *
 * Table `consult_routing_rules` (optional): global/admin-configurable rows — run SQL in
 * `supabase_consult_routing_rules.sql` if the table is missing.
 */

import { defaultCalendlySchedulingUrl, toSchedulingIframeSrc } from "./calendlyEmbed";

export type VideoClinicalRules = {
  bmiMin?: number;
  ageMin?: number;
  answerTriggers?: { questionId: string; values: string[] }[];
};

export type ProductVideoRules = {
  requiresVideoConsult: boolean;
  videoRequiredStates: string[];
  schedulingEmbedUrl?: string;
  clinical?: VideoClinicalRules;
};

export type ClinicalContext = {
  patientState: string;
  productCategory: string;
  productId: string;
  bmi: number | null;
  age: number | null;
  answers: Record<string, string | string[]>;
};

export type ConsultRoutingRuleRow = {
  id: string;
  /** Display label when present (UI / admin tooling). */
  label?: string | null;
  priority: number;
  active: boolean;
  match_states: string[] | null;
  match_categories: string[] | null;
  match_product_ids: string[] | null;
  requires_sync_video: boolean;
  clinical_json: {
    bmi_min?: number;
    age_min?: number;
    answer_triggers?: { question_id: string; values: string[] }[];
  } | null;
};

const STATE_RE = /^[A-Z]{2}$/;

export function normalizeUsState(raw: string | undefined | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (t.length === 2 && STATE_RE.test(t)) return t;
  if (t.length > 2) {
    const last2 = t.slice(-2);
    if (STATE_RE.test(last2)) return last2;
  }
  return null;
}

export function parseGlobalVideoStatesFromEnv(envValue: string | undefined): string[] {
  return (envValue || "")
    .split(/[,;\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => STATE_RE.test(s));
}

function parseVideoClinicalRules(raw: unknown): VideoClinicalRules | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const bmiMin = typeof o.bmiMin === "number" ? o.bmiMin : typeof o.bmi_min === "number" ? o.bmi_min : undefined;
  const ageMin = typeof o.ageMin === "number" ? o.ageMin : typeof o.age_min === "number" ? o.age_min : undefined;
  const triggersRaw = o.answerTriggers ?? o.answer_triggers;
  const answerTriggers = Array.isArray(triggersRaw)
    ? triggersRaw
        .map((t) => {
          if (!t || typeof t !== "object") return null;
          const tr = t as Record<string, unknown>;
          const qid = (tr.questionId ?? tr.question_id) as string | undefined;
          const vals = tr.values;
          if (!qid || !Array.isArray(vals)) return null;
          return { questionId: String(qid), values: vals.map((v) => String(v)) };
        })
        .filter((x): x is { questionId: string; values: string[] } => x != null)
    : undefined;
  if (bmiMin == null && ageMin == null && (!answerTriggers || answerTriggers.length === 0)) return undefined;
  return { bmiMin, ageMin, answerTriggers };
}

export function parseProductVideoRules(features: unknown): ProductVideoRules {
  if (!features || typeof features !== "object" || Array.isArray(features)) {
    return { requiresVideoConsult: false, videoRequiredStates: [] };
  }
  const f = features as Record<string, unknown>;
  const arr = f.video_required_states;
  const videoRequiredStates = Array.isArray(arr)
    ? arr
        .map((x) => String(x).trim().toUpperCase().replace(/[^A-Z]/g, ""))
        .map((s) => (s.length >= 2 ? s.slice(-2) : s))
        .filter((s): s is string => STATE_RE.test(s))
    : [];
  const rawUrl = f.scheduling_embed_url ?? f.scheduling_url ?? f.cal_booking_url;
  const url =
    typeof rawUrl === "string" && rawUrl.trim().startsWith("http://")
      ? `https://${rawUrl.trim().slice(7)}`
      : typeof rawUrl === "string"
        ? rawUrl.trim()
        : "";
  return {
    requiresVideoConsult: f.requires_video_consult === true || f.requires_sync_visit === true,
    videoRequiredStates,
    schedulingEmbedUrl: url.startsWith("https://") ? url : undefined,
    clinical: parseVideoClinicalRules(f.video_clinical_rules),
  };
}

/** Legacy drug/state-only check (included in full engine). */
export function patientRequiresScheduledVideo(
  rules: ProductVideoRules,
  patientStateRaw: string | undefined | null,
  globalVideoStates: string[]
): boolean {
  const st = normalizeUsState(patientStateRaw || "");
  if (rules.requiresVideoConsult) return true;
  if (st && globalVideoStates.includes(st)) return true;
  if (st && rules.videoRequiredStates.length > 0 && rules.videoRequiredStates.includes(st)) return true;
  return false;
}

export function computeNumericBmi(heightFt: string, heightIn: string, weightLb: string): number | null {
  const hi = (parseInt(heightFt || "0", 10) || 0) * 12 + (parseInt(heightIn || "0", 10) || 0);
  const w = parseFloat(weightLb || "0");
  if (hi <= 0 || !(w > 0)) return null;
  return Math.round(((w / (hi * hi)) * 703) * 10) / 10;
}

export function computeAgeYears(dob: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const y = new Date().getFullYear() - d.getFullYear();
  return y >= 0 && y < 130 ? y : null;
}

function answerMatchesValues(
  answers: Record<string, string | string[]>,
  questionId: string,
  values: string[]
): boolean {
  const raw = answers[questionId];
  const arr = Array.isArray(raw) ? raw.map(String) : raw != null && raw !== "" ? [String(raw)] : [];
  return values.some((v) => arr.some((a) => a.trim().toLowerCase() === v.trim().toLowerCase()));
}

function productClinicalRequiresVideo(clinical: VideoClinicalRules | undefined, ctx: ClinicalContext): boolean {
  if (!clinical) return false;
  if (clinical.bmiMin != null && ctx.bmi != null && ctx.bmi >= clinical.bmiMin) return true;
  if (clinical.ageMin != null && ctx.age != null && ctx.age >= clinical.ageMin) return true;
  for (const t of clinical.answerTriggers || []) {
    if (answerMatchesValues(ctx.answers, t.questionId, t.values)) return true;
  }
  return false;
}

function clinicalJsonMatches(
  cj: NonNullable<ConsultRoutingRuleRow["clinical_json"]>,
  ctx: ClinicalContext
): boolean {
  if (cj.bmi_min != null && ctx.bmi != null && ctx.bmi >= cj.bmi_min) return true;
  if (cj.age_min != null && ctx.age != null && ctx.age >= cj.age_min) return true;
  for (const tr of cj.answer_triggers || []) {
    if (answerMatchesValues(ctx.answers, tr.question_id, tr.values || [])) return true;
  }
  return false;
}

function routingRuleApplies(rule: ConsultRoutingRuleRow, ctx: ClinicalContext): boolean {
  if (!rule.active) return false;
  if (rule.match_states && rule.match_states.length > 0) {
    const st = normalizeUsState(ctx.patientState);
    if (!st || !rule.match_states.map((s) => normalizeUsState(s)).filter(Boolean).includes(st)) return false;
  }
  if (rule.match_categories && rule.match_categories.length > 0) {
    const ok = rule.match_categories.some(
      (c) => c.trim().toLowerCase() === ctx.productCategory.trim().toLowerCase()
    );
    if (!ok) return false;
  }
  if (rule.match_product_ids && rule.match_product_ids.length > 0) {
    if (!rule.match_product_ids.includes(ctx.productId)) return false;
  }
  const cj = rule.clinical_json;
  if (!cj || Object.keys(cj).length === 0) return true;
  const hasClinical =
    cj.bmi_min != null ||
    cj.age_min != null ||
    (cj.answer_triggers && cj.answer_triggers.length > 0);
  if (!hasClinical) return true;
  return clinicalJsonMatches(cj, ctx);
}

/**
 * Full routing: product/env/state OR product clinical OR matching DB rule with requires_sync_video.
 */
export function requiresSyncVideoVisit(
  productRules: ProductVideoRules | null,
  globalVideoStates: string[],
  dbRules: ConsultRoutingRuleRow[],
  ctx: ClinicalContext
): boolean {
  if (!productRules) return false;
  if (patientRequiresScheduledVideo(productRules, ctx.patientState, globalVideoStates)) return true;
  if (productClinicalRequiresVideo(productRules.clinical, ctx)) return true;
  const sorted = [...dbRules].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  for (const rule of sorted) {
    if (routingRuleApplies(rule, ctx) && rule.requires_sync_video) return true;
  }
  return false;
}

export function defaultSchedulingEmbedUrl(): string {
  const v = import.meta.env.VITE_SCHEDULING_EMBED_URL as string | undefined;
  if (v && v.startsWith("https://")) {
    return toSchedulingIframeSrc(v, {}) || v;
  }
  return defaultCalendlySchedulingUrl();
}

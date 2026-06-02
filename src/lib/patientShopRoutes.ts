/**
 * URL segments for the patient enrollment shop (/patient/shop/...).
 * Maps the infographic journey to shareable, bookmarkable routes.
 */

export type ShopFlowStage =
  | "catalog"
  | "payment"
  | "payment_confirmation"
  | "account_setup"
  | "2fa"
  | "identity"
  | "questionnaire"
  | "scheduling"
  | "confirmed";

/** Path segment after /patient/shop/ — empty means catalog. */
const STAGE_TO_SEGMENT: Record<ShopFlowStage, string> = {
  catalog: "",
  payment: "checkout",
  payment_confirmation: "order-confirmation",
  account_setup: "create-account",
  "2fa": "two-factor",
  identity: "verify-identity",
  questionnaire: "medical-intake",
  /** Merged into medical-intake UI — kept for draft compatibility only */
  scheduling: "medical-intake",
  confirmed: "enrollment-complete",
};

const SEGMENT_TO_STAGE: Record<string, ShopFlowStage> = Object.fromEntries(
  (Object.entries(STAGE_TO_SEGMENT) as [ShopFlowStage, string][])
    .filter(([, seg]) => seg !== "")
    .map(([st, seg]) => [seg, st])
) as Record<string, ShopFlowStage>;
// If duplicate segment keys existed, last wins — both questionnaire & scheduling use "medical-intake".
// Force questionnaire for that segment (scheduling is never navigated via its own URL).
SEGMENT_TO_STAGE["medical-intake"] = "questionnaire";


/** Enrollment shop base path — Peak or white-label `/care/:slug/shop`. */
export function shopEnrollBaseFromPath(pathname: string): string {
  const care = pathname.match(/^(\/care\/[^/]+\/shop)/);
  if (care) return care[1];
  return "/patient/shop";
}

export function shopStepSegmentFromPath(pathname: string): string | undefined {
  const care = pathname.match(/^\/care\/[^/]+\/shop\/(.+)$/);
  if (care) return care[1];
  const peak = pathname.match(/^\/patient\/shop\/(.+)$/);
  if (peak) return peak[1];
  return undefined;
}

/** Full path for router.navigate — catalog is base shop URL. */
export function shopPathForStage(stage: ShopFlowStage, enrollBase = "/patient/shop"): string {
  const seg = STAGE_TO_SEGMENT[stage];
  const base = enrollBase.replace(/\/$/, "");
  return seg ? `${base}/${seg}` : base;
}

/** Resolve stage from URL path (Peak or /care/:brand/shop). */
export function shopStageFromPathname(pathname: string): ShopFlowStage | null {
  const seg = shopStepSegmentFromPath(pathname);
  return shopStageFromStepParam(seg);
}


/** Resolve stage from :step param (undefined → catalog). Invalid segment → null. */
export function shopStageFromStepParam(step: string | undefined): ShopFlowStage | null {
  if (step === undefined || step === "" || step === "products") return "catalog";
  /** Legacy deep link */
  if (step === "schedule-visit") return "questionnaire";
  return SEGMENT_TO_STAGE[step] ?? null;
}

/** Infographic-aligned labels (steps 2–9 of client journey; step 1 is public landing). */
export const ENROLLMENT_JOURNEY_STEPS: {
  stage: ShopFlowStage;
  infographicStep: number;
  title: string;
  subtitle: string;
}[] = [
  { stage: "catalog", infographicStep: 2, title: "Choose your program", subtitle: "Explore GLP-1 and other treatments" },
  { stage: "payment", infographicStep: 3, title: "Checkout", subtitle: "Payer info, shipping & eligibility (incl. BMI)" },
  { stage: "payment_confirmation", infographicStep: 4, title: "Order confirmation", subtitle: "Payment received — next: your account" },
  { stage: "account_setup", infographicStep: 5, title: "Patient registration", subtitle: "Secure portal — create your credentials" },
  { stage: "2fa", infographicStep: 6, title: "Two-factor authentication", subtitle: "Verify your phone (SMS code)" },
  { stage: "identity", infographicStep: 7, title: "Identity verification", subtitle: "Government ID — Stripe Identity / compliant providers" },
  {
    stage: "questionnaire",
    infographicStep: 8,
    title: "Medical intake & scheduling",
    subtitle: "Clinical questionnaire — when required, book your video visit on the same step",
  },
  { stage: "confirmed", infographicStep: 9, title: "Patient portal", subtitle: "Track progress — dashboard & orders" },
];

export function journeyIndexForStage(stage: ShopFlowStage): number {
  const normalized = stage === "scheduling" ? "questionnaire" : stage;
  const i = ENROLLMENT_JOURNEY_STEPS.findIndex((s) => s.stage === normalized);
  return i >= 0 ? i : 0;
}

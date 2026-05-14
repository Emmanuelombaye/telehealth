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
  scheduling: "schedule-visit",
  confirmed: "enrollment-complete",
};

const SEGMENT_TO_STAGE: Record<string, ShopFlowStage> = Object.fromEntries(
  (Object.entries(STAGE_TO_SEGMENT) as [ShopFlowStage, string][])
    .filter(([, seg]) => seg !== "")
    .map(([st, seg]) => [seg, st])
) as Record<string, ShopFlowStage>;

/** Full path for router.navigate — catalog is base shop URL. */
export function shopPathForStage(stage: ShopFlowStage): string {
  const seg = STAGE_TO_SEGMENT[stage];
  return seg ? `/patient/shop/${seg}` : "/patient/shop";
}

/** Resolve stage from :step param (undefined → catalog). Invalid segment → null. */
export function shopStageFromStepParam(step: string | undefined): ShopFlowStage | null {
  if (step === undefined || step === "" || step === "products") return "catalog";
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
  { stage: "questionnaire", infographicStep: 8, title: "Medical intake", subtitle: "Questionnaire for your clinician" },
  { stage: "scheduling", infographicStep: 8, title: "Schedule visit", subtitle: "When a video visit is required for your state/protocol" },
  { stage: "confirmed", infographicStep: 9, title: "Patient portal", subtitle: "Track progress — dashboard & orders" },
];

export function journeyIndexForStage(stage: ShopFlowStage): number {
  const i = ENROLLMENT_JOURNEY_STEPS.findIndex((s) => s.stage === stage);
  return i >= 0 ? i : 0;
}

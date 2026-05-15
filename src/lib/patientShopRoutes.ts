/**
 * URL segments for the patient enrollment shop (/patient/shop/...).
 * Canonical mapping: **Client / Patient Flow Architecture — 9 steps** (journey diagram).
 * Step 1 is the marketing site; steps 2–9 are implemented under /patient/shop (shareable segments).
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
    .map(([st, seg]) => [seg, st]),
) as Record<string, ShopFlowStage>;
// If duplicate segment keys existed, last wins — both questionnaire & scheduling use "medical-intake".
// Force questionnaire for that segment (scheduling is never navigated via its own URL).
SEGMENT_TO_STAGE["medical-intake"] = "questionnaire";

/** Full path for router.navigate — catalog is base shop URL. */
export function shopPathForStage(stage: ShopFlowStage): string {
  const seg = STAGE_TO_SEGMENT[stage];
  return seg ? `/patient/shop/${seg}` : "/patient/shop";
}

/** Resolve stage from :step param (undefined → catalog). Invalid segment → null. */
export function shopStageFromStepParam(step: string | undefined): ShopFlowStage | null {
  if (step === undefined || step === "" || step === "products") return "catalog";
  /** Legacy deep link */
  if (step === "schedule-visit") return "questionnaire";
  return SEGMENT_TO_STAGE[step] ?? null;
}

/** Total steps in the published client journey diagram (1 = website, 9 = portal). */
export const CLIENT_FLOW_DIAGRAM_STEP_COUNT = 9;

/** Key notes from the client / patient flow architecture diagram (footer strip). */
export const CLIENT_FLOW_KEY_NOTES_FOOTER =
  "Secure & compliant · Save & resume · Auto-progress between steps · Privacy first · Feedback loop";

export type ClientFlowNineJourneyRow = {
  /** 1-based index as printed on the architecture diagram */
  diagramStep: number;
  /** Exact diagram step title (sentence case for UI readability) */
  title: string;
  /** Phase summary / goal aligned with the diagram */
  subtitle: string;
  /**
   * Which shop stage highlights this step in the progress UI.
   * `null` = step 1 (website / brand — outside deep-linked shop URLs; always “complete” once the user is in /patient/shop).
   */
  shopStage: ShopFlowStage | null;
};

/**
 * **Client / patient flow architecture — 9 steps** (end-to-end journey map).
 * Technical routes (e.g. split registration vs 2FA) still map to the same diagram intent.
 */
export const CLIENT_PATIENT_FLOW_NINE_STEPS: ClientFlowNineJourneyRow[] = [
  {
    diagramStep: 1,
    title: "Website / brand landing page",
    subtitle:
      "Patient lands on the medication homepage from search, ads, or direct links. Goal: educate and drive interest in treatment programs.",
    shopStage: null,
  },
  {
    diagramStep: 2,
    title: "Product page (GLP-1)",
    subtitle:
      "Patient explores product details, benefits, pricing, and program information. Goal: build trust and convert interest into action.",
    shopStage: "catalog",
  },
  {
    diagramStep: 3,
    title: "Checkout page",
    subtitle:
      "Patient information, shipping address, and health qualifier (including BMI and eligibility) with conditional logic before order submission.",
    shopStage: "payment",
  },
  {
    diagramStep: 4,
    title: "Confirmation page",
    subtitle:
      "Order submission — acknowledge the order and move into secure patient registration. Goal: transition to the locked portal.",
    shopStage: "payment_confirmation",
  },
  {
    diagramStep: 5,
    title: "Redirect to patient registration portal",
    subtitle:
      "Patient is redirected to a secure portal to create an account or sign in. Goal: establish a secure patient account.",
    shopStage: "account_setup",
  },
  {
    diagramStep: 6,
    title: "Account creation + 2FA",
    subtitle:
      "First-time registration with SMS or email authentication (two-factor). Goal: protect patient data and keep the account secure.",
    shopStage: "2fa",
  },
  {
    diagramStep: 7,
    title: "Identity verification (3rd party)",
    subtitle:
      "Government ID and KYC through an integrated provider (e.g. Stripe Identity — same compliance role as Vouched, ID.me, or Persona). Goal: verify identity and stay compliant.",
    shopStage: "identity",
  },
  {
    diagramStep: 8,
    title: "Intake form (questionnaire)",
    subtitle:
      "Medication-specific medical and health information for provider review. When a live visit is required, Cal.com / Calendly scheduling and Zoom / Google Meet join links are completed in this same step — not as a separate journey.",
    shopStage: "questionnaire",
  },
  {
    diagramStep: 9,
    title: "Patient portal (dashboard)",
    subtitle:
      "Progress tracking in one place — order status, messages, appointments, and refills in real time (same nine-step model after enrollment).",
    shopStage: "confirmed",
  },
];

export function getClientFlowRowByDiagramStep(diagramStep: number): ClientFlowNineJourneyRow | undefined {
  return CLIENT_PATIENT_FLOW_NINE_STEPS.find((r) => r.diagramStep === diagramStep);
}

/**
 * 0-based index into `CLIENT_PATIENT_FLOW_NINE_STEPS` for the active diagram step
 * (0 = website, 1 = product page, …, 8 = portal handoff).
 */
export function journeyIndexForStage(stage: ShopFlowStage): number {
  const normalized = stage === "scheduling" ? "questionnaire" : stage;
  const idx = CLIENT_PATIENT_FLOW_NINE_STEPS.findIndex((row) => row.shopStage === normalized);
  if (idx >= 0) return idx;
  return 1;
}

/**
 * @deprecated Prefer `CLIENT_PATIENT_FLOW_NINE_STEPS` — shop-backed rows only (steps 2–9), shaped for legacy callers.
 */
export const ENROLLMENT_JOURNEY_STEPS = CLIENT_PATIENT_FLOW_NINE_STEPS.filter(
  (r): r is ClientFlowNineJourneyRow & { shopStage: ShopFlowStage } => r.shopStage !== null,
).map((r) => ({
  stage: r.shopStage,
  infographicStep: r.diagramStep,
  title: r.title,
  subtitle: r.subtitle,
}));

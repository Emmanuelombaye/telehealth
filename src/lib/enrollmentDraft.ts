/** Browser draft for patient shop enrollment (save & resume). Max age 7 days. */

export const ENROLLMENT_DRAFT_KEY = "peak_health_enrollment_draft_v1";
export const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type EnrollmentDraftV1 = {
  v: 1;
  savedAt: number;
  stage: string;
  selectedProductId: string | null;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
  dob: string;
  sex: string;
  heightFt: string;
  heightIn: string;
  weight: string;
  hairColor: string;
  eyeColor: string;
  bloodType: string;
  allergies: string;
  currentMeds: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  agreedToTerms: boolean;
  otp: string;
  qStep: number;
  answers: Record<string, string | string[]>;
  gateway: string;
  consultationTime: string;
  bookingAttestation: boolean;
  paymentQualifiersPassed: boolean;
  qualifierAge18_75: boolean;
  qualifierNotPregnant: boolean;
  qualifierNoMtcMen2: boolean;
  qualifierUsResident: boolean;
  identityStripeCompleted: boolean;
  idDocumentType?: string;
  activeCat: string;
  /** Correlates Calendly/Cal booking webhooks with this enrollment (utm_content). */
  scheduling_ref?: string | null;
  /** Present after successful Stripe pay; used to resume post-checkout steps. */
  stripePaymentIntentId?: string | null;
};

export function loadEnrollmentDraft(): EnrollmentDraftV1 | null {
  try {
    const raw = localStorage.getItem(ENROLLMENT_DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as EnrollmentDraftV1;
    if (d.v !== 1 || !d.savedAt) return null;
    if (Date.now() - d.savedAt > DRAFT_MAX_AGE_MS) {
      localStorage.removeItem(ENROLLMENT_DRAFT_KEY);
      return null;
    }
    if (d.stage === "confirmed") return null;
    return d;
  } catch {
    return null;
  }
}

export function saveEnrollmentDraft(d: EnrollmentDraftV1): void {
  try {
    localStorage.setItem(ENROLLMENT_DRAFT_KEY, JSON.stringify(d));
  } catch {
    /* quota */
  }
}

export function clearEnrollmentDraft(): void {
  localStorage.removeItem(ENROLLMENT_DRAFT_KEY);
}

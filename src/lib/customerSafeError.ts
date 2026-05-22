/**
 * Map errors to short, patient-safe copy. Log technical details separately (console).
 */

const TECHNICAL_PATTERNS = [
  /schema cache/i,
  /could not find the/i,
  /column of ['"]orders['"]/i,
  /PGRST\d+/i,
  /postgres/i,
  /row-level security/i,
  /JWT/i,
  /duplicate key value/i,
  /violates foreign key/i,
  /unexpected_failure/i,
  /NetworkError/i,
  /Failed to fetch/i,
  /insert or update on table/i,
];

/** Messages we intentionally throw for form validation — safe to show as-is. */
const USER_FACING_PREFIXES = [
  "Please ",
  "Enter ",
  "A valid ",
  "Valid ",
  "Password ",
  "First and last",
  "This email",
  "Account ",
  "Booking ",
  "Could not determine user",
  "Payment incomplete",
  "Your card",
  "Card ",
];

export type CustomerErrorContext = "enrollment" | "payment" | "generic";

const CONTEXT_FALLBACK: Record<CustomerErrorContext, string> = {
  enrollment:
    "We couldn't complete your enrollment right now. Please check your details and try again, or contact support if this continues.",
  payment:
    "We couldn't process your payment. Please check your card details or try another payment method.",
  generic: "Something went wrong. Please try again.",
};

function rawMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "";
}

function looksTechnical(message: string): boolean {
  if (!message) return false;
  if (message.length > 280) return true;
  return TECHNICAL_PATTERNS.some((re) => re.test(message));
}

function looksUserFacing(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed || looksTechnical(trimmed)) return false;
  if (/^Order submission failed:/i.test(trimmed)) return false;
  return USER_FACING_PREFIXES.some((p) => trimmed.startsWith(p));
}

/** Patient-safe message for UI toasts and banners. */
export function toCustomerMessage(
  error: unknown,
  context: CustomerErrorContext = "generic",
): string {
  const raw = rawMessage(error).trim();
  if (!raw) return CONTEXT_FALLBACK[context];
  if (looksUserFacing(raw)) return raw;
  if (looksTechnical(raw) || /^Order submission failed:/i.test(raw)) {
    return CONTEXT_FALLBACK[context];
  }
  // Short unknown errors: still avoid dumping long server text
  if (raw.length > 120) return CONTEXT_FALLBACK[context];
  return raw;
}

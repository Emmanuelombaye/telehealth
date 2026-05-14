/**
 * Per-product payment methods (`products.features.gateways` string[]).
 * Shop checkout and Admin Products editor stay in sync via this module.
 */

export const DEFAULT_PRODUCT_GATEWAYS = [
  "stripe",
  "paypal",
  "apple_pay",
  "google_pay",
  "klarna",
] as const;

export type ProductPaymentGatewayId = (typeof DEFAULT_PRODUCT_GATEWAYS)[number];

const ALLOWED = new Set<string>(DEFAULT_PRODUCT_GATEWAYS);

/** UI for payment picker (Shop + Admin). */
export const GATEWAY_DISPLAY: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  stripe: {
    label: "Credit / Debit Card",
    icon: "💳",
    color: "border-violet-400 bg-violet-50 dark:bg-violet-950/30",
  },
  paypal: {
    label: "PayPal",
    icon: "🅿️",
    color: "border-violet-400 bg-violet-50 dark:bg-violet-950/30",
  },
  apple_pay: {
    label: "Apple Pay",
    icon: "🍎",
    color: "border-gray-400 bg-gray-50 dark:bg-gray-950/30",
  },
  google_pay: {
    label: "Google Pay",
    icon: "🔵",
    color: "border-green-400 bg-green-50 dark:bg-green-950/30",
  },
  klarna: {
    label: "Klarna · Pay in 4",
    icon: "🛍️",
    color: "border-pink-300 bg-pink-50 dark:bg-pink-950/30",
  },
};

const ORDER = new Map(DEFAULT_PRODUCT_GATEWAYS.map((g, i) => [g, i]));

/**
 * Parses `features.gateways` from DB: only known ids, de-duplicated, stable order.
 */
export function normalizeProductGateways(raw: unknown): string[] {
  const list: string[] = [];
  if (Array.isArray(raw)) {
    for (const x of raw) {
      const g = String(x).trim().toLowerCase();
      if (ALLOWED.has(g) && !list.includes(g)) list.push(g);
    }
  } else if (typeof raw === "string" && raw.trim()) {
    for (const part of raw.split(/[,;\s]+/)) {
      const g = part.trim().toLowerCase();
      if (ALLOWED.has(g) && !list.includes(g)) list.push(g);
    }
  }
  list.sort((a, b) => (ORDER.get(a as ProductPaymentGatewayId) ?? 99) - (ORDER.get(b as ProductPaymentGatewayId) ?? 99));
  return list;
}

/**
 * Gateways shown at checkout for this product.
 * - Uses DB list when non-empty; otherwise full catalog default.
 * - Production + Stripe key: only `stripe` survives (real card rails).
 */
export function effectiveProductGateways(
  raw: unknown,
  opts: { requireStripeOnly: boolean },
): string[] {
  let list = normalizeProductGateways(raw);
  if (list.length === 0) {
    list = [...DEFAULT_PRODUCT_GATEWAYS];
  }
  if (opts.requireStripeOnly) {
    list = list.filter((g) => g === "stripe");
  }
  if (list.length === 0) {
    list = ["stripe"];
  }
  return list;
}

/** Canonical ordering for persisting `features.gateways`. */
export function sortGateways(list: string[]): string[] {
  return [...list].sort(
    (a, b) =>
      (ORDER.get(a as ProductPaymentGatewayId) ?? 99) -
      (ORDER.get(b as ProductPaymentGatewayId) ?? 99),
  );
}

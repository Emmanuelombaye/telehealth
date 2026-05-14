/**
 * Per-product payment methods (`products.features.gateways` string[]).
 * Shop checkout and Admin Products editor stay in sync via this module.
 */

/** Primary quartet shown by default; wire each to your PSP / Edge functions. */
export const DEFAULT_PRODUCT_GATEWAYS = [
  "stripe",
  "paypal",
  "apple_pay",
  "google_pay",
] as const;

/** Optional extra ids still accepted if present on legacy products. */
export const LEGACY_GATEWAY_IDS = ["klarna"] as const;

export type ProductPaymentGatewayId =
  | (typeof DEFAULT_PRODUCT_GATEWAYS)[number]
  | (typeof LEGACY_GATEWAY_IDS)[number];

const ALLOWED = new Set<string>([...DEFAULT_PRODUCT_GATEWAYS, ...LEGACY_GATEWAY_IDS]);

/** UI for payment picker (Shop + Admin). */
export const GATEWAY_DISPLAY: Record<
  string,
  {
    label: string;
    icon: string;
    color: string;
    tagline: string;
    /** Tile surface (gradient + border) */
    tileClass: string;
    selectedRing: string;
  }
> = {
  stripe: {
    label: "Credit / debit card",
    icon: "💳",
    color: "border-violet-400 bg-violet-50 dark:bg-violet-950/30",
    tagline: "Visa · Mastercard · Amex",
    tileClass:
      "bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/80 border-violet-200/90 shadow-sm shadow-violet-500/5",
    selectedRing: "ring-2 ring-violet-500/50 ring-offset-2 ring-offset-white",
  },
  paypal: {
    label: "PayPal",
    icon: "🅿️",
    color: "border-sky-400 bg-sky-50 dark:bg-sky-950/30",
    tagline: "Balance or linked bank",
    tileClass:
      "bg-gradient-to-br from-sky-50 via-white to-indigo-50/70 border-sky-200/90 shadow-sm shadow-sky-500/10",
    selectedRing: "ring-2 ring-sky-500/45 ring-offset-2 ring-offset-white",
  },
  apple_pay: {
    label: "Apple Pay",
    icon: "🍎",
    color: "border-zinc-400 bg-zinc-50 dark:bg-zinc-950/30",
    tagline: "Face ID · Touch ID",
    tileClass:
      "bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 border-zinc-700/80 text-white shadow-lg shadow-zinc-900/25",
    selectedRing: "ring-2 ring-zinc-300/80 ring-offset-2 ring-offset-white",
  },
  google_pay: {
    label: "Google Pay",
    icon: "🔷",
    color: "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
    tagline: "Saved cards in Google",
    tileClass:
      "bg-gradient-to-br from-blue-50 via-white to-emerald-50/90 border-slate-200/90 shadow-sm shadow-blue-500/10",
    selectedRing: "ring-2 ring-blue-500/40 ring-offset-2 ring-offset-white",
  },
  klarna: {
    label: "Klarna · Pay in 4",
    icon: "🛍️",
    color: "border-pink-300 bg-pink-50 dark:bg-pink-950/30",
    tagline: "Split payments where eligible",
    tileClass:
      "bg-gradient-to-br from-pink-50 via-white to-rose-50/80 border-pink-200/90 shadow-sm shadow-pink-400/10",
    selectedRing: "ring-2 ring-pink-400/45 ring-offset-2 ring-offset-white",
  },
};

const ORDER = new Map<string, number>([
  ...DEFAULT_PRODUCT_GATEWAYS.map((g, i) => [g, i] as const),
  ...LEGACY_GATEWAY_IDS.map((g, i) => [g, DEFAULT_PRODUCT_GATEWAYS.length + i] as const),
]);

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
  list.sort((a, b) => (ORDER.get(a) ?? 99) - (ORDER.get(b) ?? 99));
  return list;
}

/**
 * Gateways shown at checkout for this product.
 * - Uses DB list when non-empty; otherwise the default quartet.
 * - Set `VITE_CHECKOUT_STRIPE_ONLY=true` to show card (Stripe) only at runtime.
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
  return [...list].sort((a, b) => (ORDER.get(a) ?? 99) - (ORDER.get(b) ?? 99));
}

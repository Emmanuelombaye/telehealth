/** Minimal product shape for catalog deep-link resolution. */
export type CatalogProductLike = {
  id: string;
  name: string;
  category: string;
};

/** Marketing-site category slugs → Peak product.category labels. */
export const CATEGORY_SLUG_MAP: Record<string, string> = {
  "weight-loss": "Weight Loss",
  weight_loss: "Weight Loss",
  "anti-aging": "Longevity",
  antiaging: "Longevity",
  longevity: "Longevity",
  "muscle-recovery": "Muscle Recovery",
  muscle_recovery: "Muscle Recovery",
  metabolic: "Weight Loss",
  executive: "Longevity",
  "sexual-wellness": "Sexual Wellness",
};

/** Treatment keys from North Star → substrings matched against product.name. */
export const PRODUCT_SLUG_MATCHERS: Record<string, string[]> = {
  semaglutide: ["semaglutide"],
  tirzepatide: ["tirzepatide"],
  nad: ["nad+", "nad"],
  sermorelin: ["sermorelin"],
};

export type EnrollmentLinkParams = {
  productId: string | null;
  productSlug: string | null;
  categorySlug: string | null;
  categoryDisplay: string | null;
  autoStart: boolean;
  brandSlug: string | null;
  brandId: string | null;
};

export function normalizeCategorySlug(slug: string): string {
  const key = slug.trim().toLowerCase();
  return CATEGORY_SLUG_MAP[key] ?? slug;
}

export function parseEnrollmentSearchParams(search: string): EnrollmentLinkParams {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const categoryRaw = params.get("category");
  const productSlug = params.get("product") || params.get("condition");
  const productId = params.get("productId");
  const autoFlag =
    params.get("auto") === "1" ||
    params.get("skipCatalog") === "1" ||
    Boolean(productId || productSlug);

  return {
    productId,
    productSlug,
    categorySlug: categoryRaw,
    categoryDisplay: categoryRaw ? normalizeCategorySlug(categoryRaw) : null,
    autoStart: autoFlag,
    brandSlug: params.get("brand"),
    brandId: params.get("brandId"),
  };
}

export function resolveProductFromSlug(
  products: CatalogProductLike[],
  slug: string,
): CatalogProductLike | null {
  const key = slug.trim().toLowerCase();
  const needles = PRODUCT_SLUG_MATCHERS[key] ?? [key];
  const matches = products.filter((p) => {
    const name = p.name.toLowerCase();
    return needles.some((n) => name.includes(n));
  });
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];
  return [...matches].sort((a, b) => a.name.length - b.name.length)[0];
}

export function resolveDeepLinkProduct(
  products: CatalogProductLike[],
  link: EnrollmentLinkParams,
): CatalogProductLike | null {
  if (link.productId) {
    const byId = products.find((p) => p.id === link.productId);
    if (byId) return byId;
  }
  if (link.productSlug) {
    const bySlug = resolveProductFromSlug(products, link.productSlug);
    if (bySlug) return bySlug;
  }
  if (link.categoryDisplay) {
    const inCategory = products.filter((p) => p.category === link.categoryDisplay);
    if (inCategory.length === 1) return inCategory[0];
  }
  return null;
}

export function brandLabelFromEnrollmentLink(link: EnrollmentLinkParams): string | null {
  if (link.brandSlug === "north-star-md") return "North Star MD";
  if (link.brandSlug) {
    return link.brandSlug
      .split("-")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return null;
}

import {
  getBrandSiteByHost,
  getBrandSiteBySlug,
  isWhiteLabelSite,
  type BrandSiteConfig,
} from "../brand-sites";

/** First DNS label on a partner domain → branded /care/:slug path suffix. */
const PARTNER_SUBDOMAIN_PORTAL: Record<string, string> = {
  admin: "/admin",
  affiliate: "/affiliate",
  care: "/shop",
};

function normalizeHost(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^www\./, "");
}

/** Resolve white-label site from hostname (marketing apex or care.* subdomain). */
export function resolvePartnerSiteFromHost(hostname: string): BrandSiteConfig | null {
  const host = normalizeHost(hostname);
  const direct = getBrandSiteByHost(host);
  if (direct && isWhiteLabelSite(direct)) return direct;

  const sub = host.split(".")[0] ?? "";
  const portalSuffix = PARTNER_SUBDOMAIN_PORTAL[sub];
  if (!portalSuffix) return null;

  const baseHost = host.slice(sub.length + 1);
  const fromBase = getBrandSiteByHost(baseHost);
  if (fromBase && isWhiteLabelSite(fromBase)) return fromBase;

  return getBrandSiteByHost(`care.${baseHost}`);
}

/**
 * Rewrite browser path before React Router mounts.
 * care.northstarmd.com/ → /care/north-star-md/shop
 * admin.northstarmd.com/orders → /care/north-star-md/admin/orders
 */
export function resolvePartnerCarePathRewrite(hostname: string, pathname: string): string | null {
  const site = resolvePartnerSiteFromHost(hostname);
  if (!site) return null;

  const slug = site.brand.slug;
  const careRoot = `/care/${slug}`;
  if (pathname.startsWith(`${careRoot}/`) || pathname === careRoot) return null;

  const host = normalizeHost(hostname);
  const sub = host.split(".")[0] ?? "";
  const mapped = PARTNER_SUBDOMAIN_PORTAL[sub];

  if (mapped) {
    const portalBase = `${careRoot}${mapped}`;
    if (pathname === "/" || pathname === "") {
      return mapped === "/shop" ? `${careRoot}/shop` : portalBase;
    }
    if (pathname.startsWith(mapped)) return `${careRoot}${pathname}`;
    if (pathname.startsWith(`${mapped}/`)) return `${careRoot}${pathname}`;
    return `${portalBase}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  }

  if (pathname === "/" || pathname === "") return `${careRoot}/shop`;

  const passthrough: Record<string, string> = {
    "/login": `${careRoot}/login`,
    "/shop": `${careRoot}/shop`,
    "/patient": `${careRoot}/patient`,
    "/admin": `${careRoot}/admin`,
    "/affiliate": `${careRoot}/affiliate`,
  };
  for (const [prefix, target] of Object.entries(passthrough)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return target + pathname.slice(prefix.length);
    }
  }

  return `${careRoot}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function isRegisteredCareBrandSlug(slug: string): boolean {
  const site = getBrandSiteBySlug(slug);
  return Boolean(site && isWhiteLabelSite(site));
}

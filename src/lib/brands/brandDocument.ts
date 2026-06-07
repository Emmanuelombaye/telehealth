import type { BrandSiteConfig } from "../../brand-sites";
import { PEAK_SITE } from "../../brand-sites";
import { type ActiveBrand, PEAK_HEALTH_BRAND, findStaticBrandBySlug } from "./registry";

const PEAK_DEFAULT_TITLE = "Peak Health OS | Telehealth Infrastructure for Modern Medical Brands";
const PEAK_FAVICON = "/logo/portal-logo.png";

/** Overlay static partner kit when DB row lacks logo (scalable — no hardcoded Auth logos). */
export function finalizeBrandFromKit(brand: ActiveBrand): ActiveBrand {
  const kit = findStaticBrandBySlug(brand.slug);
  if (!kit || kit.slug === PEAK_HEALTH_BRAND.slug) return brand;

  const usesPeakLogo =
    !brand.logoUrl ||
    brand.logoUrl === PEAK_HEALTH_BRAND.logoUrl ||
    brand.logoUrl.includes("PeakHealthLogo");

  return {
    ...brand,
    name: brand.name || kit.name,
    logoUrl: usesPeakLogo ? kit.logoUrl : brand.logoUrl,
    logoAlt: brand.logoAlt || kit.logoAlt,
    domains: brand.domains?.length ? brand.domains : kit.domains,
    tagline: brand.tagline ?? kit.tagline,
  };
}

export function applyBrandDocumentMeta(
  brand: ActiveBrand,
  site: BrandSiteConfig,
  isWhiteLabel: boolean,
): void {
  if (typeof document === "undefined") return;

  if (!isWhiteLabel || brand.slug === PEAK_HEALTH_BRAND.slug) {
    document.title = PEAK_DEFAULT_TITLE;
    setFavicon(PEAK_FAVICON);
    setThemeColor("#064e3b");
    return;
  }

  document.title = `${site.copy.portalName} | Patient Portal`;
  setFavicon(brand.logoUrl);
  setThemeColor(site.theme.primary);
}

export function clearBrandDocumentMeta(): void {
  if (typeof document === "undefined") return;
  document.title = PEAK_DEFAULT_TITLE;
  setFavicon(PEAK_FAVICON);
  setThemeColor("#064e3b");
}

function setFavicon(href: string) {
  if (!href) return;
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = href;
  link.type = href.endsWith(".svg") ? "image/svg+xml" : "image/png";

  let apple = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
  if (!apple) {
    apple = document.createElement("link");
    apple.rel = "apple-touch-icon";
    document.head.appendChild(apple);
  }
  apple.href = href;
}

function setThemeColor(color: string) {
  let meta = document.querySelector<HTMLMetaElement>("meta[name='theme-color']");
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = color;
}

export function defaultSiteForBrand(brand: ActiveBrand): BrandSiteConfig {
  const kit = findStaticBrandBySlug(brand.slug);
  if (kit) {
    return {
      brand,
      hosts: kit.domains ?? [],
      copy: {
        welcomeTitle: (firstName) => `Welcome to ${brand.name}, ${firstName}!`,
        termsLabel: `I agree to ${brand.name}'s`,
        termsHref: "/terms",
        privacyHref: "/privacy",
        portalName: brand.name,
        supportEmail: `support@${brand.domain ?? "peak-health.io"}`,
      },
      theme: {
        primary: "#0f2341",
        primaryForeground: "#ffffff",
        accent: "#10b981",
        headerBg: "#ffffff",
      },
    };
  }
  return PEAK_SITE;
}

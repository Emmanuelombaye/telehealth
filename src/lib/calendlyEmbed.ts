/**
 * Normalize Calendly + Cal.com (and other https schedulers) for inline iframes and share links.
 * @see https://help.calendly.com/hc/en-us/articles/223147027-Embed-options-overview
 * @see https://cal.com/help/embedding
 */

export type SchedulingProvider = "calendly" | "calcom" | "generic_https";

export type CalendlyEmbedOptions = {
  /** Prefill guest email (Calendly query: email) */
  email?: string;
  /** Prefill guest name (Calendly query: name) */
  name?: string;
  /** Host domain for embed (Calendly: embed_domain). Defaults to window.location.host in browser. */
  embedDomain?: string;
  /** Peak brand green in hex without # */
  primaryColor?: string;
  /** Passed through as utm_content — appears in Calendly webhooks (e.g. scheduling correlation ref). */
  utmContent?: string;
  /** Optional utm_campaign for analytics */
  utmCampaign?: string;
};

function safeHost(): string {
  if (typeof window !== "undefined" && window.location?.host) return window.location.host;
  return "localhost";
}

function isCalendlyHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "calendly.com" || h === "www.calendly.com";
}

/** Cal.com public booking hosts (team subdomains included). */
function isCalDotComHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "cal.com" || h === "www.cal.com" || h.endsWith(".cal.com");
}

/**
 * Detect which scheduler family a URL belongs to (for UI + embed behavior).
 */
export function detectSchedulingProvider(raw: string | null | undefined): SchedulingProvider {
  if (!raw || typeof raw !== "string") return "generic_https";
  let t = raw.trim();
  if (!t) return "generic_https";
  if (!/^https?:\/\//i.test(t)) t = `https://${t}`;
  try {
    const u = new URL(t);
    if (isCalendlyHost(u.hostname)) return "calendly";
    if (isCalDotComHost(u.hostname)) return "calcom";
  } catch {
    /* ignore */
  }
  return "generic_https";
}

/**
 * Returns a full https URL for Calendly inline embed, or null if input is not a Calendly URL.
 */
export function toCalendlyInlineEmbedUrl(
  raw: string | null | undefined,
  opts: CalendlyEmbedOptions = {}
): string | null {
  if (!raw || typeof raw !== "string") return null;
  let trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) trimmed = `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (!isCalendlyHost(url.hostname)) {
    return null;
  }

  const primary = (opts.primaryColor || "0a2e1f").replace(/^#/, "");

  url.searchParams.set("embed_type", "Inline");
  url.searchParams.set("hide_gdpr_banner", "1");
  url.searchParams.set("hide_event_type_details", "1");
  url.searchParams.set("hide_landing_page_details", "1");
  url.searchParams.set("primary_color", primary);
  url.searchParams.set("embed_domain", opts.embedDomain || safeHost());

  if (opts.email?.trim()) url.searchParams.set("email", opts.email.trim());
  if (opts.name?.trim()) url.searchParams.set("name", opts.name.trim());
  if (opts.utmContent?.trim()) url.searchParams.set("utm_content", opts.utmContent.trim());
  if (opts.utmCampaign?.trim()) url.searchParams.set("utm_campaign", opts.utmCampaign.trim());

  return url.toString();
}

/**
 * Cal.com / Cal — inline iframe URL (adds embed + guest prefill query params).
 */
export function toCalDotComInlineEmbedUrl(
  raw: string | null | undefined,
  opts: CalendlyEmbedOptions = {}
): string | null {
  if (!raw || typeof raw !== "string") return null;
  let trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) trimmed = `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.hostname.toLowerCase() === "app.cal.com") {
    url.hostname = "cal.com";
  }
  if (!isCalDotComHost(url.hostname)) return null;

  url.searchParams.set("embed", "true");
  if (opts.email?.trim()) url.searchParams.set("email", opts.email.trim());
  if (opts.name?.trim()) url.searchParams.set("name", opts.name.trim());
  if (opts.utmContent?.trim()) url.searchParams.set("utm_content", opts.utmContent.trim());
  if (opts.utmCampaign?.trim()) url.searchParams.set("utm_campaign", opts.utmCampaign.trim());

  return url.toString();
}

/**
 * If `raw` is Calendly or Cal.com, return inline embed URL; otherwise return trimmed https URL for generic schedulers.
 */
export function toSchedulingIframeSrc(
  raw: string | null | undefined,
  opts: CalendlyEmbedOptions = {}
): string | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  const calendly = toCalendlyInlineEmbedUrl(t, opts);
  if (calendly) return calendly;
  const calcom = toCalDotComInlineEmbedUrl(t, opts);
  if (calcom) return calcom;
  if (t.startsWith("https://")) {
    try {
      const u = new URL(t);
      if (opts.utmContent?.trim()) u.searchParams.set("utm_content", opts.utmContent.trim());
      if (opts.utmCampaign?.trim()) u.searchParams.set("utm_campaign", opts.utmCampaign.trim());
      return u.toString();
    } catch {
      return t;
    }
  }
  return null;
}

/** Default team/event Calendly used when nothing else is configured. */
export function defaultCalendlySchedulingUrl(): string {
  const env = import.meta.env.VITE_CALENDLY_DEFAULT_URL as string | undefined;
  if (env && env.includes("calendly.com")) {
    return toCalendlyInlineEmbedUrl(env, {}) || env;
  }
  return (
    toCalendlyInlineEmbedUrl("https://calendly.com/peakhealth-medical/consultation", {}) ||
    "https://calendly.com/peakhealth-medical/consultation?embed_type=Inline&hide_gdpr_banner=1&hide_event_type_details=1&hide_landing_page_details=1&primary_color=0a2e1f"
  );
}

/** Remove iframe-only query params so the URL works in a new browser tab. */
export function stripCalendlyEmbedParams(urlStr: string): string {
  try {
    const u = new URL(/^https?:\/\//i.test(urlStr) ? urlStr : `https://${urlStr}`);
    if (!isCalendlyHost(u.hostname)) return urlStr;
    const strip = [
      "embed_type",
      "embed_domain",
      "hide_gdpr_banner",
      "hide_event_type_details",
      "hide_landing_page_details",
      "primary_color",
      "background_color",
      "text_color",
    ];
    for (const k of strip) u.searchParams.delete(k);
    return u.toString();
  } catch {
    return urlStr;
  }
}

/**
 * URL safe to open in a new tab (strips iframe-only params; keeps guest prefill where present).
 * Works for Calendly, Cal.com, and passes through other https URLs unchanged.
 */
export function toSchedulingOpenTabUrl(urlStr: string | null | undefined): string {
  if (!urlStr || typeof urlStr !== "string" || !urlStr.trim()) return "";
  const t = urlStr.trim();
  const strippedCalendly = stripCalendlyEmbedParams(t);
  if (strippedCalendly !== t) return strippedCalendly;

  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    if (u.hostname.toLowerCase() === "app.cal.com") u.hostname = "cal.com";
    if (!isCalDotComHost(u.hostname)) return t;
    const strip = ["embed", "embedType", "layout", "embed_type", "embed_domain"];
    for (const k of strip) u.searchParams.delete(k);
    return u.toString();
  } catch {
    return t;
  }
}

/** Default public booking link (new tab), not iframe. */
export function defaultCalendlyBookingPageUrl(): string {
  const env = import.meta.env.VITE_CALENDLY_DEFAULT_URL as string | undefined;
  if (env && env.includes("calendly.com")) return stripCalendlyEmbedParams(env);
  return "https://calendly.com/peakhealth-medical/consultation";
}

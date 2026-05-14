/**
 * Normalize any Calendly scheduling URL into one suitable for an <iframe> inline embed.
 * @see https://help.calendly.com/hc/en-us/articles/223147027-Embed-options-overview
 */

export type CalendlyEmbedOptions = {
  /** Prefill guest email (Calendly query: email) */
  email?: string;
  /** Prefill guest name (Calendly query: name) */
  name?: string;
  /** Host domain for embed (Calendly: embed_domain). Defaults to window.location.host in browser. */
  embedDomain?: string;
  /** Peak brand green in hex without # */
  primaryColor?: string;
};

function safeHost(): string {
  if (typeof window !== "undefined" && window.location?.host) return window.location.host;
  return "localhost";
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
  if (!/calendly\.com$/i.test(url.hostname) && !/www\.calendly\.com$/i.test(url.hostname)) {
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

  return url.toString();
}

/**
 * If `raw` is Calendly, return inline embed URL; otherwise return trimmed https URL (e.g. Cal.com).
 */
export function toSchedulingIframeSrc(
  raw: string | null | undefined,
  opts: CalendlyEmbedOptions = {}
): string | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  const cal = toCalendlyInlineEmbedUrl(t, opts);
  if (cal) return cal;
  if (t.startsWith("https://")) return t;
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
    if (!/calendly\.com$/i.test(u.hostname) && !/www\.calendly\.com$/i.test(u.hostname)) return urlStr;
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

/** Default public booking link (new tab), not iframe. */
export function defaultCalendlyBookingPageUrl(): string {
  const env = import.meta.env.VITE_CALENDLY_DEFAULT_URL as string | undefined;
  if (env && env.includes("calendly.com")) return stripCalendlyEmbedParams(env);
  return "https://calendly.com/peakhealth-medical/consultation";
}

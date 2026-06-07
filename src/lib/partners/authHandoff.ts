import type { PartnerIntegration } from "./types";
import { getPartnerByHandoffSource } from "./registry";
import { partnerHandoffSourceFromSearch } from "./connect";

export type PartnerAuthMode = "login" | "signup";

export function authModeFromSearch(search?: string): PartnerAuthMode {
  const raw = search ?? (typeof window !== "undefined" ? window.location.search : "");
  const params = new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : raw);
  const mode = params.get("mode")?.trim().toLowerCase();
  if (mode === "signup" || mode === "register" || mode === "create") return "signup";
  if (mode === "login" || mode === "signin") return "login";

  const source = partnerHandoffSourceFromSearch(raw);
  const integration = source ? getPartnerByHandoffSource(source) : null;
  if (integration?.defaultAuthMode) return integration.defaultAuthMode;
  if (integration?.catalogMode === "external-catalog") return "signup";

  return "login";
}

export function partnerSignupHandoffMessage(integration: PartnerIntegration | null): string | null {
  if (!integration) return null;
  if (integration.signupHandoffMessage) return integration.signupHandoffMessage;
  if (integration.catalogMode === "external-catalog") {
    return `Complete your ${integration.displayName} account to access your patient portal.`;
  }
  return integration.handoffMessage ?? null;
}

export function partnerLoginHandoffMessage(integration: PartnerIntegration | null): string | null {
  if (!integration) return null;
  return integration.handoffMessage ?? null;
}

export function partnerHandoffMessageForMode(
  integration: PartnerIntegration | null,
  mode: PartnerAuthMode,
): string | null {
  if (!integration) return null;
  return mode === "signup"
    ? partnerSignupHandoffMessage(integration)
    : partnerLoginHandoffMessage(integration);
}

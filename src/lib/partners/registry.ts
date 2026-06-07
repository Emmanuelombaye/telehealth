import type { PartnerIntegration } from "./types";

const bySlug = new Map<string, PartnerIntegration>();
const byHandoffSource = new Map<string, PartnerIntegration>();

export function registerPartner(integration: PartnerIntegration): void {
  bySlug.set(integration.slug.trim().toLowerCase(), integration);
  byHandoffSource.set(integration.handoffSource.trim(), integration);
}

export function getPartnerBySlug(slug: string | null | undefined): PartnerIntegration | null {
  if (!slug?.trim()) return null;
  return bySlug.get(slug.trim().toLowerCase()) ?? null;
}

export function getPartnerByHandoffSource(source: string | null | undefined): PartnerIntegration | null {
  if (!source?.trim()) return null;
  return byHandoffSource.get(source.trim()) ?? null;
}

export function listPartnerIntegrations(): PartnerIntegration[] {
  return [...bySlug.values()];
}

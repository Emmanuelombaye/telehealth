import { registerPartner } from "./registry";
import { northStarMdIntegration } from "./integrations/northStarMd";
import { summitMdIntegration } from "./integrations/summitMd";
import { paxIntegration } from "./integrations/pax";

registerPartner(summitMdIntegration);
registerPartner(northStarMdIntegration);
registerPartner(paxIntegration);

export type {
  PartnerApiDocs,
  PartnerCatalogMode,
  PartnerIntegration,
  PartnerLoginHandoff,
} from "./types";
export {
  registerPartner,
  getPartnerBySlug,
  getPartnerByHandoffSource,
  listPartnerIntegrations,
} from "./registry";
export {
  peakAppOrigin,
  partnerApiBase,
  partnerApiDocs,
  partnerHandoffSourceFromSearch,
  safeRedirectFromSearch,
  resolvePartnerHandoffContext,
  buildPartnerPatientLoginUrl,
  partnerDevHandoffPacket,
} from "./connect";
export { summitMdIntegration } from "./integrations/summitMd";
export { northStarMdIntegration } from "./integrations/northStarMd";
export { paxIntegration } from "./integrations/pax";
export {
  authModeFromSearch,
  partnerHandoffMessageForMode,
  partnerSignupHandoffMessage,
  partnerLoginHandoffMessage,
} from "./authHandoff";
export type { PartnerAuthMode } from "./authHandoff";
export { resolvePatientShopDestination } from "./catalogRouting";
export type { PatientShopDestination } from "./catalogRouting";

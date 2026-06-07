import { registerPartner } from "./registry";
import { northStarMdIntegration } from "./integrations/northStarMd";
import { summitMdIntegration } from "./integrations/summitMd";

registerPartner(summitMdIntegration);
registerPartner(northStarMdIntegration);

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

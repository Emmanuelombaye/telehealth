import { LegalDocumentPage } from "../../components/legal/LegalDocumentPage";
import { LEGAL_LAST_UPDATED, shippingSections } from "./legalContent";

export function ShippingPolicyPage() {
  return (
    <LegalDocumentPage
      title="Shipping Policy"
      subtitle="Fulfillment, delivery timelines, and support for medication shipments."
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={shippingSections}
    />
  );
}

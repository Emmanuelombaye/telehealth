import { LegalDocumentPage } from "../../components/legal/LegalDocumentPage";
import { LEGAL_LAST_UPDATED, refundSections } from "./legalContent";

export function RefundPolicyPage() {
  return (
    <LegalDocumentPage
      title="Refund Policy"
      subtitle="Refunds and credits for consultations, subscriptions, and pharmacy orders."
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={refundSections}
    />
  );
}

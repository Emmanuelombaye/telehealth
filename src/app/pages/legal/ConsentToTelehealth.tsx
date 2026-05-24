import { LegalDocumentPage } from "../../components/legal/LegalDocumentPage";
import { LEGAL_LAST_UPDATED, consentSections } from "./legalContent";

export function ConsentToTelehealthPage() {
  return (
    <LegalDocumentPage
      title="Consent to Telehealth"
      subtitle="How virtual care works on Peak Health and what you agree to when enrolling."
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={consentSections}
    />
  );
}

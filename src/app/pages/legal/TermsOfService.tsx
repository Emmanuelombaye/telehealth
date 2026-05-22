import { LegalDocumentPage } from "../../components/legal/LegalDocumentPage";
import { LEGAL_LAST_UPDATED, termsSections } from "./legalContent";

export function TermsOfServicePage() {
  return (
    <LegalDocumentPage
      title="Terms of Service"
      subtitle="Rules for using Peak Health telehealth, billing, and patient portal services."
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={termsSections}
    />
  );
}

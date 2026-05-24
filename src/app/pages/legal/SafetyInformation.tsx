import { LegalDocumentPage } from "../../components/legal/LegalDocumentPage";
import { LEGAL_LAST_UPDATED, safetySections } from "./legalContent";

export function SafetyInformationPage() {
  return (
    <LegalDocumentPage
      title="Safety Information"
      subtitle="Important medication risks, side effects, and when to seek emergency care."
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={safetySections}
    />
  );
}

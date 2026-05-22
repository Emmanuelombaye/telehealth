import { LegalDocumentPage } from "../../components/legal/LegalDocumentPage";
import { LEGAL_LAST_UPDATED, privacySections } from "./legalContent";

export function PrivacyPolicyPage() {
  return (
    <LegalDocumentPage
      title="Privacy Policy"
      subtitle="How Peak Health collects, uses, and protects your personal and health information."
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={privacySections}
    />
  );
}

import { LegalDocumentPage } from "../../components/legal/LegalDocumentPage";
import { LEGAL_LAST_UPDATED, codeOfConductSections } from "./legalContent";

export function PhysicianCodeOfConductPage() {
  return (
    <LegalDocumentPage
      title="Physician Code of Conduct"
      subtitle="Clinical and ethical standards for licensed providers on the Peak Health platform."
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={codeOfConductSections}
    />
  );
}

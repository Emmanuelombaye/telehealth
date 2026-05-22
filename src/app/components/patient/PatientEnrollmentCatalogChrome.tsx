import { PatientShopTopChrome } from "./PatientShopTopChrome";
import { cn } from "../ui/utils";
import type { ShopFlowStage } from "../../../lib/patientShopRoutes";

type PatientEnrollmentCatalogChromeProps = {
  stage: ShopFlowStage;
  onBack: () => void;
  className?: string;
};

/** Catalog (step 1) — same header as all other enrollment steps. */
export function PatientEnrollmentCatalogChrome({
  stage,
  onBack,
  className,
}: PatientEnrollmentCatalogChromeProps) {
  return (
    <PatientShopTopChrome
      stage={stage}
      onBack={onBack}
      backLabel="Back to portal"
      className={cn(className)}
    />
  );
}

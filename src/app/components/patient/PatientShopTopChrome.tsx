import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/shared.tsx";
import { cn } from "../ui/utils";
import { PatientEnrollmentHeader } from "./PatientEnrollmentHeader";
import type { ShopFlowStage } from "../../../lib/patientShopRoutes";

type PatientShopTopChromeProps = {
  stage: ShopFlowStage;
  onBack: () => void;
  backLabel?: string;
  className?: string;
  showTrust?: boolean;
};

/**
 * Back link + shared enrollment header (big centered logo, stepper) for steps 2–9.
 */
export function PatientShopTopChrome({
  stage,
  onBack,
  backLabel = "Back",
  className,
  showTrust = true,
}: PatientShopTopChromeProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="-ml-2 h-8 rounded-lg px-2 text-xs font-semibold text-slate-600 hover:text-[#0A2E1F]"
      >
        <ArrowLeft className="mr-1 h-3.5 w-3.5" />
        {backLabel}
      </Button>
      <PatientEnrollmentHeader stage={stage} showTrust={showTrust} />
    </div>
  );
}

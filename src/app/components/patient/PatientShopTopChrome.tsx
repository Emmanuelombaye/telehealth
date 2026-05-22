import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/shared.tsx";
import { cn } from "../ui/utils";
import { PatientBrandMark } from "./PatientBrandMark";
import { PatientEnrollmentStepper } from "./PatientEnrollmentStepper";
import type { ShopFlowStage } from "../../../lib/patientShopRoutes";

type PatientShopTopChromeProps = {
  stage: ShopFlowStage;
  brandSize?: "sm" | "md" | "lg" | "hero" | "xl";
  onBack: () => void;
  backLabel?: string;
  className?: string;
};

/**
 * In-flow enrollment header (steps 2–9): logo, progress, back — single professional card.
 */
export function PatientShopTopChrome({
  stage,
  brandSize = "md",
  onBack,
  backLabel = "Back",
  className,
}: PatientShopTopChromeProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white shadow-[0_10px_40px_-22px_rgba(10,46,31,0.15)]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 sm:px-5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 shrink-0 rounded-lg px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          {backLabel}
        </Button>
        <PatientBrandMark size="sm" className="max-w-[7.5rem] opacity-90" />
      </div>

      <div className="px-4 py-3 sm:px-5 sm:py-4">
        <PatientEnrollmentStepper stage={stage} align="left" />
      </div>
    </div>
  );
}

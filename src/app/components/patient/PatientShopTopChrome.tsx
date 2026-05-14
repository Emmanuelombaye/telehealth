import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/shared.tsx";
import { cn } from "../ui/utils";
import { PatientEnrollmentStepper } from "../PatientEnrollmentStepper.tsx";
import { PatientBrandMark } from "./PatientBrandMark.tsx";
import type { ShopFlowStage } from "../../../lib/patientShopRoutes";

type PatientShopTopChromeProps = {
  stage: ShopFlowStage;
  brandSize?: "sm" | "md";
  onBack: () => void;
  backLabel?: string;
  badgeLabel?: string;
  className?: string;
  stepperClassName?: string;
};

/**
 * Shared shop “chrome”: progress + brand + back affordances in one card so the
 * logo does not float in empty space away from navigation.
 */
export function PatientShopTopChrome({
  stage,
  brandSize = "sm",
  onBack,
  backLabel = "Back to portal",
  badgeLabel = "Licensed dispensary",
  className,
  stepperClassName,
}: PatientShopTopChromeProps) {
  const showBadge = badgeLabel.trim().length > 0;
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-emerald-200/40 bg-white/95 shadow-[0_10px_40px_-22px_rgba(15,23,42,0.18)] ring-1 ring-emerald-900/[0.04]",
        className,
      )}
    >
      <div className="border-b border-slate-100/90 bg-gradient-to-br from-slate-50/95 via-white to-emerald-50/25 px-4 py-3.5 sm:px-5 sm:py-4">
        <PatientEnrollmentStepper stage={stage} className={stepperClassName} />
      </div>
      <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4">
        <div className="flex justify-center sm:justify-start">
          <PatientBrandMark size={brandSize} />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-100/90 pt-3 sm:border-t-0 sm:pt-0 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            className="h-9 shrink-0 rounded-xl border-slate-200/90 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5 opacity-70" />
            {backLabel}
          </Button>
          {showBadge ? (
            <span className="max-w-[52%] truncate rounded-full border border-emerald-200/70 bg-emerald-50/95 px-3 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-900 sm:max-w-none">
              {badgeLabel}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

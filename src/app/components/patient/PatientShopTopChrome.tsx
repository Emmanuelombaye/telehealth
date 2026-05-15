import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/shared.tsx";
import { cn } from "../ui/utils";
import { PatientEnrollmentStepper } from "../PatientEnrollmentStepper.tsx";
import { PatientBrandMark } from "./PatientBrandMark.tsx";
import type { ShopFlowStage } from "../../../lib/patientShopRoutes";

type PatientShopTopChromeProps = {
  stage: ShopFlowStage;
  brandSize?: "sm" | "md" | "lg" | "hero" | "xl";
  onBack: () => void;
  backLabel?: string;
  badgeLabel?: string;
  className?: string;
  stepperClassName?: string;
};

/**
 * Shared shop chrome: centered logo on top, step progress, then navigation actions.
 */
export function PatientShopTopChrome({
  stage,
  brandSize = "xl",
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
      <div className="flex justify-center border-b border-slate-100/90 bg-gradient-to-b from-white via-emerald-50/20 to-white px-4 pt-6 pb-5 sm:pt-8 sm:pb-6">
        <PatientBrandMark size={brandSize} className="w-full max-w-[min(100%,22rem)] sm:max-w-[26rem]" />
      </div>

      <div className="border-b border-slate-100/90 bg-gradient-to-br from-slate-50/95 via-white to-emerald-50/25 px-4 py-3.5 sm:px-5 sm:py-4">
        <PatientEnrollmentStepper stage={stage} className={stepperClassName} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4">
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
          <span className="rounded-full border border-emerald-200/70 bg-emerald-50/95 px-3 py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-900">
            {badgeLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}

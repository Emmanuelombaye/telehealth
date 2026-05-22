import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/shared.tsx";
import { cn } from "../ui/utils";
import { PatientBrandMark } from "./PatientBrandMark";
import {
  ENROLLMENT_JOURNEY_STEPS,
  journeyIndexForStage,
  type ShopFlowStage,
} from "../../../lib/patientShopRoutes";

type PatientEnrollmentCatalogChromeProps = {
  stage: ShopFlowStage;
  onBack: () => void;
  className?: string;
};

/**
 * Catalog header — white surface, centered logo, emerald typography.
 */
export function PatientEnrollmentCatalogChrome({
  stage,
  onBack,
  className,
}: PatientEnrollmentCatalogChromeProps) {
  const activeIdx = journeyIndexForStage(stage);
  const active = ENROLLMENT_JOURNEY_STEPS[activeIdx];
  const total = ENROLLMENT_JOURNEY_STEPS.length;

  return (
    <header className={cn("space-y-2", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="-ml-2 h-8 rounded-lg px-2 text-xs font-semibold text-slate-600 hover:text-[#0A2E1F]"
      >
        <ArrowLeft className="mr-1 h-3.5 w-3.5" />
        Back to portal
      </Button>

      <div className="overflow-hidden rounded-[1.25rem] border border-emerald-100/90 bg-white px-5 py-6 sm:px-8 sm:py-7 shadow-[0_8px_32px_-20px_rgba(10,46,31,0.12)]">
        <div className="flex flex-col items-center text-center space-y-5">
          <PatientBrandMark
            size="hero"
            className="w-full max-w-[min(100%,14rem)] sm:max-w-[18rem] md:max-w-[20rem]"
          />

          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-900">
            Step {activeIdx + 1} of {total}
          </span>

          <div
            className="flex w-full max-w-md gap-1.5"
            role="progressbar"
            aria-valuenow={activeIdx + 1}
            aria-valuemin={1}
            aria-valuemax={total}
          >
            {ENROLLMENT_JOURNEY_STEPS.map((s, i) => (
              <div
                key={s.stage}
                className={cn(
                  "h-2 flex-1 rounded-full transition-colors",
                  i <= activeIdx ? "bg-emerald-600" : "bg-emerald-100",
                )}
                title={s.title}
              />
            ))}
          </div>

          <div className="w-full max-w-lg space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">
              {active.title}
            </p>
            <h1 className="text-xl font-extrabold leading-snug tracking-tight text-[#0A2E1F] sm:text-2xl">
              Care that works.
              <span className="text-emerald-700"> Shipped to your door.</span>
            </h1>
            <p className="text-xs leading-relaxed text-emerald-900/70 sm:text-sm">
              {active.subtitle} · Physician-reviewed · Licensed pharmacies · HIPAA-aligned
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

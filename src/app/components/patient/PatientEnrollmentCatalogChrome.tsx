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
 * Catalog header — compact: back link + single hero (logo, step, progress, copy).
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

      <div className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-[#0A2E1F] via-[#0d3d2a] to-[#059669] px-5 py-6 sm:px-7 sm:py-8 text-white shadow-lg shadow-emerald-950/20">
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <PatientBrandMark size="sm" className="max-w-[9.5rem] brightness-0 invert opacity-95" />
            <span className="inline-flex w-fit items-center rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-100">
              Step {activeIdx + 1} of {total}
            </span>
          </div>

          <div className="flex gap-1" role="progressbar" aria-valuenow={activeIdx + 1} aria-valuemin={1} aria-valuemax={total}>
            {ENROLLMENT_JOURNEY_STEPS.map((s, i) => (
              <div
                key={s.stage}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  i <= activeIdx ? "bg-white/90" : "bg-white/20",
                )}
                title={s.title}
              />
            ))}
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/90">
              {active.title}
            </p>
            <h1 className="mt-1.5 text-xl font-extrabold leading-snug tracking-tight sm:text-2xl">
              Care that works.
              <span className="text-emerald-200"> Shipped to your door.</span>
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-white/80 sm:text-sm">
              {active.subtitle} · Physician-reviewed · Licensed pharmacies · HIPAA-aligned
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

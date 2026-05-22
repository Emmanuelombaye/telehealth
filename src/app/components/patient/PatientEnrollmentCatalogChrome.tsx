import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/shared.tsx";
import { cn } from "../ui/utils";
import { PatientBrandMark } from "./PatientBrandMark";
import { PatientEnrollmentStepper } from "./PatientEnrollmentStepper";
import type { ShopFlowStage } from "../../../lib/patientShopRoutes";

type PatientEnrollmentCatalogChromeProps = {
  stage: ShopFlowStage;
  onBack: () => void;
  className?: string;
};

/**
 * Catalog (step 1) top chrome: logo, navigation, progress, and program hero in one cohesive layout.
 */
export function PatientEnrollmentCatalogChrome({
  stage,
  onBack,
  className,
}: PatientEnrollmentCatalogChromeProps) {
  return (
    <header className={cn("space-y-4 sm:space-y-5", className)}>
      <div className="overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white shadow-[0_12px_48px_-24px_rgba(10,46,31,0.18)]">
        <div className="relative border-b border-slate-100 bg-gradient-to-b from-white via-emerald-50/30 to-white px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-9 shrink-0 rounded-xl px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-[#0A2E1F]"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Portal
            </Button>
            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800/70">
              Licensed telehealth
            </span>
            <div className="w-[72px] sm:w-[88px]" aria-hidden />
          </div>

          <div className="flex justify-center -mt-2 sm:-mt-4 pb-1">
            <PatientBrandMark size="lg" className="max-w-[min(100%,16rem)] sm:max-w-[18rem]" />
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6 sm:py-6">
          <PatientEnrollmentStepper stage={stage} align="center" showTrust />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-[#0A2E1F] via-[#0d3d2a] to-[#059669] px-6 py-8 sm:px-8 sm:py-10 text-white shadow-lg shadow-emerald-950/25">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/4 h-40 w-40 rounded-full bg-teal-300/15 blur-2xl"
          aria-hidden
        />
        <div className="relative z-10 max-w-xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-200/90">
            Treatment programs
          </p>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            Care that works.
            <span className="block text-emerald-200 sm:inline sm:ml-2">Delivered to your door.</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-[15px]">
            Physician-reviewed plans · Compounded by licensed pharmacies · Fully online from intake through refill.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold backdrop-blur-sm">
              USA patients
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold backdrop-blur-sm">
              HIPAA-aligned
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold backdrop-blur-sm">
              Discreet shipping
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

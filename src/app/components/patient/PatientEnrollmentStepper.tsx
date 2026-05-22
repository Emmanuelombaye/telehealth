import { Shield, Save, Smartphone } from "lucide-react";
import { cn } from "../ui/utils";
import {
  ENROLLMENT_JOURNEY_STEPS,
  journeyIndexForStage,
  type ShopFlowStage,
} from "../../../lib/patientShopRoutes";

type PatientEnrollmentStepperProps = {
  stage: ShopFlowStage;
  className?: string;
  /** Hide trust chips when parent already shows them */
  showTrust?: boolean;
  /** Center titles (catalog header) vs left-aligned (in-flow steps) */
  align?: "left" | "center";
};

/**
 * Compact enrollment progress — consumer-friendly labels, no internal jargon.
 */
export function PatientEnrollmentStepper({
  stage,
  className,
  showTrust = true,
  align = "left",
}: PatientEnrollmentStepperProps) {
  const activeIdx = journeyIndexForStage(stage);
  const active = ENROLLMENT_JOURNEY_STEPS[activeIdx];
  const total = ENROLLMENT_JOURNEY_STEPS.length;
  const pct = Math.round(((activeIdx + 1) / total) * 100);

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div
        className={cn(
          "flex flex-col gap-1",
          align === "center" ? "items-center text-center" : "items-start text-left",
        )}
      >
        <span className="inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-900">
          Step {activeIdx + 1} of {total}
        </span>
        <h2 className="text-lg font-bold tracking-tight text-[#0A2E1F] sm:text-xl">{active.title}</h2>
        <p className="text-sm text-slate-600 max-w-md">{active.subtitle}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          <span>Your progress</span>
          <span className="text-emerald-800">{pct}%</span>
        </div>
        <div className="flex gap-1.5" role="progressbar" aria-valuenow={activeIdx + 1} aria-valuemin={1} aria-valuemax={total}>
          {ENROLLMENT_JOURNEY_STEPS.map((s, i) => {
            const done = i < activeIdx;
            const current = i === activeIdx;
            return (
              <div
                key={s.stage}
                className={cn(
                  "h-2 flex-1 rounded-full transition-all duration-300",
                  done && "bg-emerald-500",
                  current && "bg-[#0A2E1F] shadow-sm shadow-emerald-900/20",
                  !done && !current && "bg-slate-200/90",
                )}
                title={s.title}
              />
            );
          })}
        </div>
      </div>

      {showTrust ? (
        <div
          className={cn(
            "flex flex-wrap gap-2 pt-1",
            align === "center" ? "justify-center" : "justify-start",
          )}
        >
          {[
            { icon: Shield, label: "HIPAA-aligned" },
            { icon: Save, label: "Save & resume" },
            { icon: Smartphone, label: "Mobile ready" },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600"
            >
              <Icon className="h-3 w-3 text-emerald-600" />
              {label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

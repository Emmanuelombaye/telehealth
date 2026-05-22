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
    <div className={cn("w-full space-y-2.5", className)}>
      <div
        className={cn(
          "flex flex-col gap-0.5",
          align === "center" ? "items-center text-center" : "items-start text-left",
        )}
      >
        <span className="inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-900">
          Step {activeIdx + 1} of {total}
        </span>
        <h2 className="text-base font-bold tracking-tight text-[#0A2E1F] sm:text-lg leading-tight">{active.title}</h2>
        <p className="text-xs text-slate-600 max-w-md leading-snug">{active.subtitle}</p>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
          <span>Progress</span>
          <span className="text-emerald-800">{pct}%</span>
        </div>
        <div className="flex gap-1" role="progressbar" aria-valuenow={activeIdx + 1} aria-valuemin={1} aria-valuemax={total}>
          {ENROLLMENT_JOURNEY_STEPS.map((s, i) => {
            const done = i < activeIdx;
            const current = i === activeIdx;
            return (
              <div
                key={s.stage}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-300",
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
            "flex flex-wrap gap-1.5",
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
              className="inline-flex items-center gap-1 rounded-full border border-slate-200/90 bg-slate-50/80 px-2 py-0.5 text-[9px] font-semibold text-slate-600"
            >
              <Icon className="h-2.5 w-2.5 text-emerald-600" />
              {label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

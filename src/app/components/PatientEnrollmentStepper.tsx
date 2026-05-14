import { cn } from "./ui/utils";
import {
  ENROLLMENT_JOURNEY_STEPS,
  journeyIndexForStage,
  type ShopFlowStage,
} from "../../lib/patientShopRoutes";

export function PatientEnrollmentStepper({
  stage,
  className,
}: {
  stage: ShopFlowStage;
  className?: string;
}) {
  const activeIdx = journeyIndexForStage(stage);
  const active = ENROLLMENT_JOURNEY_STEPS[activeIdx];
  const n = ENROLLMENT_JOURNEY_STEPS.length;

  return (
    <div className={cn("w-full space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700/90">
            Patient journey · Step {activeIdx + 1} of {n} (maps steps 2–9 after landing)
          </p>
          <p className="text-sm font-bold text-foreground mt-0.5">{active.title}</p>
          <p className="text-xs text-muted-foreground">{active.subtitle}</p>
        </div>
      </div>

      {/* Progress dots — mobile-friendly */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {ENROLLMENT_JOURNEY_STEPS.map((s, i) => {
          const done = i < activeIdx;
          const current = i === activeIdx;
          return (
            <div
              key={s.stage}
              className={cn(
                "h-1.5 min-w-[28px] flex-1 rounded-full transition-colors shrink-0",
                done && "bg-emerald-500",
                current && "bg-emerald-600 ring-2 ring-emerald-500/30",
                !done && !current && "bg-muted"
              )}
              title={`${s.title} (#${s.infographicStep})`}
            />
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground leading-relaxed border-t border-border/60 pt-2">
        Secure & HIPAA-aligned · Save & resume (this device, up to 7 days) · Clear guidance at each step · Mobile
        optimized
      </p>
    </div>
  );
}

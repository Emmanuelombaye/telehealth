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
    <div className={cn("w-full space-y-3.5", className)}>
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800/85">
          Enrollment · Step {activeIdx + 1} of {n}
        </p>
        <p className="text-base font-semibold leading-snug tracking-tight text-slate-900 sm:text-lg">
          {active.title}
        </p>
        <p className="text-sm leading-relaxed text-slate-600">{active.subtitle}</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5" role="list" aria-label="Enrollment progress">
        {ENROLLMENT_JOURNEY_STEPS.map((s, i) => {
          const done = i < activeIdx;
          const current = i === activeIdx;
          return (
            <div
              key={s.stage}
              role="listitem"
              className={cn(
                "h-2 min-w-[32px] flex-1 rounded-full transition-colors duration-300 shrink-0",
                done && "bg-emerald-500",
                current && "bg-emerald-600 ring-2 ring-emerald-400/35",
                !done && !current && "bg-slate-200/90",
              )}
              title={s.title}
            />
          );
        })}
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500 border-t border-slate-200/70 pt-2.5">
        HIPAA-aligned · Your progress can save on this device for up to 7 days
      </p>
    </div>
  );
}

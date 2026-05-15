import { cn } from "./ui/utils";
import {
  CLIENT_FLOW_DIAGRAM_STEP_COUNT,
  CLIENT_FLOW_KEY_NOTES_FOOTER,
  CLIENT_PATIENT_FLOW_NINE_STEPS,
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
  const active = CLIENT_PATIENT_FLOW_NINE_STEPS[activeIdx];
  const n = CLIENT_FLOW_DIAGRAM_STEP_COUNT;

  return (
    <div className={cn("w-full space-y-3.5", className)}>
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800/85">
          Client / patient flow · Step {active.diagramStep} of {n}
        </p>
        <p className="text-base font-semibold leading-snug tracking-tight text-slate-900 sm:text-lg">{active.title}</p>
        <p className="text-sm leading-relaxed text-slate-600">{active.subtitle}</p>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-0.5" role="list" aria-label="Nine-step enrollment progress">
        {CLIENT_PATIENT_FLOW_NINE_STEPS.map((s, i) => {
          const done = i === 0 ? activeIdx >= 1 : i < activeIdx;
          const current = i === activeIdx;
          return (
            <div
              key={`flow-${s.diagramStep}`}
              role="listitem"
              className={cn(
                "h-2 min-w-[22px] flex-1 rounded-full transition-colors duration-300 shrink-0 sm:min-w-[26px]",
                done && "bg-emerald-500",
                current && "bg-emerald-600 ring-2 ring-emerald-400/35",
                !done && !current && "bg-slate-200/90",
              )}
              title={`${s.diagramStep}. ${s.title}`}
            />
          );
        })}
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500 border-t border-slate-200/70 pt-2.5">
        {CLIENT_FLOW_KEY_NOTES_FOOTER}
      </p>
    </div>
  );
}

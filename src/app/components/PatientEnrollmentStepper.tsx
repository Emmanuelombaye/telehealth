import { cn } from "./ui/utils";
import {
  CLIENT_FLOW_DIAGRAM_STEP_COUNT,
  CLIENT_PATIENT_FLOW_NINE_STEPS,
  journeyIndexForStage,
  type ShopFlowStage,
} from "../../lib/patientShopRoutes";

export function PatientEnrollmentStepper({
  stage,
  className,
  intakePath,
}: {
  stage: ShopFlowStage;
  className?: string;
  intakePath?: "video" | "async";
}) {
  const activeIdx = journeyIndexForStage(stage);
  const active = CLIENT_PATIENT_FLOW_NINE_STEPS[activeIdx];
  const n = CLIENT_FLOW_DIAGRAM_STEP_COUNT;
  const intakeSuffix =
    stage === "questionnaire" && intakePath === "video"
      ? " · Video visit"
      : stage === "questionnaire" && intakePath === "async"
        ? " · Review only"
        : "";

  return (
    <div className={cn("w-full space-y-2.5", className)} role="navigation" aria-label="Enrollment progress">
      <p className="text-sm font-semibold text-slate-900 leading-snug">
        <span className="tabular-nums text-emerald-700">Step {active.diagramStep}</span>
        <span className="font-normal text-slate-400"> / {n}</span>
        <span className="font-normal text-slate-400"> · </span>
        <span>{active.title}{intakeSuffix}</span>
      </p>

      <div
        className="flex gap-1"
        role="list"
        aria-label={`Progress: step ${active.diagramStep} of ${n}, ${active.title}`}
      >
        {CLIENT_PATIENT_FLOW_NINE_STEPS.map((s, i) => {
          const done = i === 0 ? activeIdx >= 1 : i < activeIdx;
          const current = i === activeIdx;
          return (
            <div
              key={`flow-${s.diagramStep}`}
              role="listitem"
              aria-current={current ? "step" : undefined}
              aria-label={`Step ${s.diagramStep}: ${s.title}${current ? " (current)" : done ? " (complete)" : ""}`}
              className={cn(
                "h-1.5 min-w-[18px] flex-1 rounded-full transition-colors duration-300 shrink-0 sm:h-2 sm:min-w-[22px]",
                done && "bg-emerald-500",
                current && "bg-emerald-600 ring-2 ring-emerald-400/30",
                !done && !current && "bg-slate-200",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

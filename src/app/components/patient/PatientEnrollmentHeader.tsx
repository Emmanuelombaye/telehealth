import { cn } from "../ui/utils";
import { PatientBrandMark } from "./PatientBrandMark";
import { PatientEnrollmentStepper } from "./PatientEnrollmentStepper";
import type { ShopFlowStage } from "../../../lib/patientShopRoutes";

type PatientEnrollmentHeaderProps = {
  stage: ShopFlowStage;
  className?: string;
  showTrust?: boolean;
};

/**
 * Shared enrollment top: large centered logo + centered step progress (all shop steps).
 */
export function PatientEnrollmentHeader({
  stage,
  className,
  showTrust = true,
}: PatientEnrollmentHeaderProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-emerald-100/90 bg-white px-4 py-3.5 sm:px-5 sm:py-4 shadow-[0_4px_20px_-14px_rgba(10,46,31,0.1)]",
        className,
      )}
    >
      <div className="flex flex-col items-center text-center gap-2.5">
        <PatientBrandMark
          size="lg"
          className="w-full max-w-[11rem] sm:max-w-[13rem]"
        />
        <div className="w-full">
          <PatientEnrollmentStepper stage={stage} align="center" showTrust={showTrust} />
        </div>
      </div>
    </div>
  );
}

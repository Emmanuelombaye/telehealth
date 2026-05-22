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
        "overflow-hidden rounded-[1.25rem] border border-emerald-100/90 bg-white px-5 py-6 sm:px-8 sm:py-7 shadow-[0_8px_32px_-20px_rgba(10,46,31,0.12)]",
        className,
      )}
    >
      <div className="flex flex-col items-center text-center">
        <PatientBrandMark
          size="hero"
          className="w-full max-w-[min(100%,14rem)] sm:max-w-[18rem] md:max-w-[20rem]"
        />
        <div className="mt-5 w-full">
          <PatientEnrollmentStepper stage={stage} align="center" showTrust={showTrust} />
        </div>
      </div>
    </div>
  );
}

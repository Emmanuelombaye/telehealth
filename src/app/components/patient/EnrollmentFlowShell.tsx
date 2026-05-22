import type { ReactNode } from "react";
import { cn } from "../ui/utils";

type EnrollmentFlowShellProps = {
  children: ReactNode;
  className?: string;
  /** Wide column for intake questions + embedded scheduler on desktop. */
  wide?: boolean;
  centered?: boolean;
};

/**
 * Patient shop enrollment — always light, readable, and wider on desktop
 * (immune to global dark theme).
 */
export function EnrollmentFlowShell({
  children,
  className,
  wide = false,
  centered = false,
}: EnrollmentFlowShellProps) {
  return (
    <div className="patient-enrollment-surface min-h-[100dvh] bg-[#F8FAFC] text-[#0A0D14]">
      <div
        className={cn(
          "mx-auto w-full px-4 sm:px-6 lg:px-10 py-8 sm:py-10",
          wide ? "max-w-5xl" : "max-w-xl sm:max-w-2xl lg:max-w-3xl",
          centered && "text-center",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

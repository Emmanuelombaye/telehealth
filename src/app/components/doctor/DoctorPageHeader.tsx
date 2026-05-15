import type { ReactNode } from "react";
import { cn } from "../ui/shared.tsx";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  variant?: "hero" | "soft";
  className?: string;
  children?: ReactNode;
};

/**
 * Unified doctor portal page header — dark hero or light “soft” bar.
 */
export function DoctorPageHeader({
  eyebrow,
  title,
  description,
  variant = "soft",
  className,
  children,
}: Props) {
  const isHero = variant === "hero";

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        isHero
          ? "rounded-[1.75rem] border border-emerald-400/20 bg-gradient-to-br from-[#0A2E1F] via-[#114a36] to-[#0c3224] px-6 py-7 md:px-8 md:py-8 text-white shadow-xl shadow-emerald-950/25"
          : cn(
              "rounded-[1.5rem] border border-emerald-100/90",
              "bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/40",
              "px-5 py-6 md:px-7 md:py-7 shadow-[0_4px_28px_-10px_rgba(10,46,31,0.14)]",
            ),
        className,
      )}
    >
      {isHero && (
        <>
          <div className="pointer-events-none absolute -right-[25%] -top-[80%] h-[160%] w-[85%] rounded-full bg-teal-400/12 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 bottom-0 h-56 w-56 rounded-full bg-emerald-400/10 blur-2xl" />
        </>
      )}
      {!isHero && (
        <div className="pointer-events-none absolute right-6 top-0 h-28 w-28 rounded-full bg-cyan-200/35 blur-2xl md:right-14" />
      )}

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p
              className={cn(
                "mb-2 text-[10px] font-bold uppercase tracking-[0.28em]",
                isHero ? "text-emerald-200/90" : "text-emerald-700/80",
              )}
            >
              {eyebrow}
            </p>
          )}
          <h1
            className={cn(
              "text-2xl font-bold tracking-tight md:text-[1.75rem]",
              !isHero && "text-[#0A2E1F]",
            )}
          >
            {title}
          </h1>
          {description && (
            <p
              className={cn(
                "mt-2 max-w-2xl text-sm leading-relaxed font-medium",
                isHero ? "text-emerald-50/85" : "text-slate-600",
              )}
            >
              {description}
            </p>
          )}
        </div>
        {children ? (
          <div className="relative flex shrink-0 flex-wrap gap-3">{children}</div>
        ) : null}
      </div>
    </div>
  );
}

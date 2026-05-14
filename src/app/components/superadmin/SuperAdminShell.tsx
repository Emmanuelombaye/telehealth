import type { ReactNode } from "react";
import { cn } from "../ui/utils";

type SuperAdminShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Shared page frame for superadmin routes: readable type scale, calm borders, no oversized “cockpit” chrome.
 */
export function SuperAdminShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: SuperAdminShellProps) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-0 pb-16 sm:px-0", className)}>
      <header className="mb-8 rounded-2xl border border-slate-200/90 bg-white px-5 py-5 shadow-sm sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{eyebrow}</p>
            ) : null}
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.65rem]">{title}</h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </header>
      <div className="space-y-8">{children}</div>
    </div>
  );
}

/** Standard panel surface for metrics, charts, and lists */
export const saPanel = "rounded-2xl border border-slate-200/90 bg-white shadow-sm";

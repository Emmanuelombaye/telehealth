import type { ReactNode } from "react";
import type { TooltipProps } from "recharts";
import { cn } from "../../ui/shared.tsx";

/** RPM analytics palette — matches premium purple dashboard reference */
export const RPM_CHART = {
  primary: "#8B5CF6",
  primaryDark: "#7C3AED",
  primaryLight: "#A78BFA",
  primaryFill: "url(#rpmAreaPrimary)",
  secondary: "#E2E8F0",
  secondaryDark: "#CBD5E1",
  grid: "#EEF2F6",
  axis: "#94A3B8",
  card: "#FFFFFF",
  cardBorder: "rgba(226, 232, 240, 0.9)",
} as const;

export const rpmChartCard = cn(
  "rounded-2xl border bg-white/95 p-4 sm:p-5 flex flex-col",
  "shadow-[0_4px_24px_-6px_rgba(139,92,246,0.12),0_1px_0_rgba(255,255,255,0.9)_inset]",
  "rpm-dark:bg-slate-900/80 rpm-dark:border-slate-700/60",
);

export const rpmAxisTick = { fill: RPM_CHART.axis, fontSize: 10, fontWeight: 500 };
export const rpmAxisProps = {
  tick: rpmAxisTick,
  axisLine: false,
  tickLine: false,
  dy: 4,
};
export const rpmGridProps = {
  stroke: RPM_CHART.grid,
  vertical: false,
  strokeDasharray: "0",
};

export function RpmChartGradients() {
  return (
    <defs>
      <linearGradient id="rpmAreaPrimary" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.45} />
        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id="rpmAreaSoft" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.35} />
        <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="rpmAreaSys" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.4} />
        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.03} />
      </linearGradient>
      <linearGradient id="rpmAreaDia" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#C4B5FD" stopOpacity={0.25} />
        <stop offset="95%" stopColor="#C4B5FD" stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

type TooltipPayload = { value?: number; name?: string; color?: string };

export function RpmChartTooltip({
  active,
  payload,
  label,
  unit = "",
}: TooltipProps<number, string> & { unit?: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0] as TooltipPayload;
  const val = p.value;
  return (
    <div className="rounded-full bg-white px-3 py-1.5 shadow-lg border border-slate-100 text-xs font-bold text-slate-800">
      {label && <span className="text-slate-400 font-medium mr-1.5">{label}</span>}
      <span style={{ color: p.color || RPM_CHART.primary }}>
        {val != null ? `${val}${unit}` : "—"}
      </span>
    </div>
  );
}

export function RpmChartPanel({
  title,
  subtitle,
  empty,
  featured,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  empty: string;
  featured?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      className={cn(
        rpmChartCard,
        featured ? "min-h-[260px] lg:min-h-[280px]" : "min-h-[220px]",
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3 shrink-0">
        <div>
          <p className="text-sm font-bold text-slate-800 rpm-dark:text-slate-100">{title}</p>
          {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex-1 min-h-[160px]">
        {children || (
          <p className="text-sm text-slate-400 text-center py-14">{empty}</p>
        )}
      </div>
      {footer}
    </div>
  );
}

export const rpmActiveDot = {
  r: 5,
  fill: RPM_CHART.primary,
  stroke: "#fff",
  strokeWidth: 2,
};

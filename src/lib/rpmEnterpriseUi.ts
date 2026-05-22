/** Enterprise RPM visual system — Apple × Stripe × clinical luxury */

export type RpmTheme = "light" | "dark";

export type RpmStatusTone = "stable" | "warning" | "high" | "critical" | "emergency";

export const RPM_STATUS_TONE: Record<
  RpmStatusTone,
  { label: string; ring: string; badge: string; glow: string; dot: string; card: string }
> = {
  stable: {
    label: "Stable",
    ring: "ring-emerald-400/40",
    badge: "bg-emerald-500/15 text-emerald-700 border-emerald-400/30",
    glow: "shadow-[0_0_40px_-8px_rgba(16,185,129,0.35)]",
    dot: "bg-emerald-500",
    card: "border-emerald-200/60 from-emerald-50/80 to-white/90",
  },
  warning: {
    label: "Warning",
    ring: "ring-amber-400/50",
    badge: "bg-amber-500/15 text-amber-800 border-amber-400/35",
    glow: "shadow-[0_0_40px_-8px_rgba(245,158,11,0.3)]",
    dot: "bg-amber-500",
    card: "border-amber-200/70 from-amber-50/90 to-white/90",
  },
  high: {
    label: "High risk",
    ring: "ring-orange-400/50",
    badge: "bg-orange-500/15 text-orange-800 border-orange-400/35",
    glow: "shadow-[0_0_40px_-8px_rgba(249,115,22,0.35)]",
    dot: "bg-orange-500",
    card: "border-orange-200/70 from-orange-50/90 to-white/90",
  },
  critical: {
    label: "Critical",
    ring: "ring-red-500/60",
    badge: "bg-red-500/20 text-red-800 border-red-400/40 animate-pulse",
    glow: "shadow-[0_0_48px_-6px_rgba(239,68,68,0.45)]",
    dot: "bg-red-500 animate-pulse",
    card: "border-red-300/80 from-red-50/95 to-white/90",
  },
  emergency: {
    label: "Emergency",
    ring: "ring-violet-500/60",
    badge: "bg-violet-500/20 text-violet-900 border-violet-400/40 animate-pulse",
    glow: "shadow-[0_0_52px_-4px_rgba(139,92,246,0.5)]",
    dot: "bg-violet-600 animate-pulse",
    card: "border-violet-300/80 from-violet-50/95 to-white/90",
  },
};

export function rpmShellClass(dark: boolean): string {
  return dark
    ? "rpm-dark min-h-full bg-[#060b14] text-slate-100"
    : "rpm-light min-h-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 text-slate-900";
}

export const rpmGlass = [
  "rounded-2xl border backdrop-blur-xl transition-all duration-300",
  "rpm-light:border-white/60 rpm-light:bg-white/65 rpm-light:shadow-[0_8px_32px_-8px_rgba(15,23,42,0.12),0_1px_0_rgba(255,255,255,0.8)_inset]",
  "rpm-dark:border-white/10 rpm-dark:bg-slate-900/55 rpm-dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)]",
].join(" ");

export const rpmGlassPanel = [
  "rounded-2xl border backdrop-blur-2xl",
  "rpm-light:bg-white/72 rpm-light:border-slate-200/70 rpm-light:shadow-xl",
  "rpm-dark:bg-slate-900/70 rpm-dark:border-slate-700/50 rpm-dark:shadow-2xl",
].join(" ");

export const rpmKpiCard = [
  "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-500",
  "hover:-translate-y-0.5 hover:shadow-2xl",
  "rpm-light:border-white/70 rpm-light:bg-gradient-to-br rpm-light:from-white/95 rpm-light:to-slate-50/80",
  "rpm-dark:border-slate-700/60 rpm-dark:bg-gradient-to-br rpm-dark:from-slate-900/90 rpm-dark:to-slate-800/50",
].join(" ");

export const rpmMonitorCard = [
  "relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 cursor-pointer",
  "hover:scale-[1.01] hover:shadow-xl",
  "bg-gradient-to-br backdrop-blur-md",
].join(" ");

export function patientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}

export function aiConfidencePct(level: string): number {
  if (level === "critical") return 94;
  if (level === "high") return 82;
  if (level === "moderate") return 68;
  return 45;
}

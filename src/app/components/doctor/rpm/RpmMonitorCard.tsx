import { Stethoscope, AlertOctagon, MoreHorizontal, Heart, Droplets, Activity } from "lucide-react";
import { Badge, Button, cn } from "../../ui/shared.tsx";
import type { RpmLiveRow } from "../../../../lib/rpmCommandCenter";
import { RPM_STATUS_TONE, patientInitials, rpmMonitorCard } from "../../../../lib/rpmEnterpriseUi";
import { RpmEcgWave, parseBpmFromDisplay } from "./RpmEcgWave";
import { CONNECTIVITY_STYLES } from "../../../../lib/doctorRpm";

type Props = {
  row: RpmLiveRow;
  onOpen: () => void;
  onEscalate: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  compact?: boolean;
};

const VITAL_ACCENT: Record<string, string> = {
  HR: "from-rose-500/15 to-rose-500/5 border-rose-200/60 rpm-dark:border-rose-500/25",
  BP: "from-violet-500/15 to-violet-500/5 border-violet-200/60 rpm-dark:border-violet-500/25",
  "SpO₂": "from-sky-500/15 to-sky-500/5 border-sky-200/60 rpm-dark:border-sky-500/25",
  Glucose: "from-amber-500/15 to-amber-500/5 border-amber-200/60 rpm-dark:border-amber-500/25",
  RR: "from-teal-500/15 to-teal-500/5 border-teal-200/60 rpm-dark:border-teal-500/25",
  Temp: "from-orange-500/15 to-orange-500/5 border-orange-200/60 rpm-dark:border-orange-500/25",
};

export function RpmMonitorCard({ row, onOpen, onEscalate, onHoverStart, onHoverEnd, compact }: Props) {
  const tone = RPM_STATUS_TONE[row.statusTone];
  const conn = CONNECTIVITY_STYLES[row.patient.connectivity];
  const bpm = parseBpmFromDisplay(row.heartRate);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className={cn(
        rpmMonitorCard,
        tone.card,
        tone.glow,
        tone.ring,
        "ring-1 rpm-dark:from-slate-800/95 rpm-dark:to-slate-900/85 rpm-dark:border-slate-700/50",
        compact ? "p-3" : "p-4",
      )}
    >
      <div className="flex items-start gap-3 mb-2.5">
        <div
          className={cn(
            "h-11 w-11 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-lg",
            row.statusTone === "emergency"
              ? "bg-gradient-to-br from-violet-600 to-fuchsia-700"
              : row.statusTone === "critical"
                ? "bg-gradient-to-br from-red-600 to-rose-700"
                : "bg-gradient-to-br from-[#0A2E1F] to-emerald-700",
          )}
        >
          {patientInitials(row.patient.patient_name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-black text-sm rpm-text truncate">{row.patient.patient_name}</p>
          <p className="text-[10px] rpm-muted">
            Age {row.age} · {row.lastReading}
          </p>
        </div>
        <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", conn.dot)} title={conn.label} />
      </div>

      {/* Hero vitals — heart rate & oxygen */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="rounded-xl border bg-gradient-to-br from-rose-500/12 to-transparent border-rose-200/50 p-2 rpm-dark:border-rose-500/30">
          <div className="flex items-center gap-1 text-[9px] font-black uppercase text-rose-600 rpm-dark:text-rose-400">
            <Heart className="h-3 w-3 fill-current" />
            Heart rate
          </div>
          <p className="text-lg font-black rpm-text tabular-nums leading-tight mt-0.5">{row.heartRate}</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-sky-500/12 to-transparent border-sky-200/50 p-2 rpm-dark:border-sky-500/30">
          <div className="flex items-center gap-1 text-[9px] font-black uppercase text-sky-600 rpm-dark:text-sky-400">
            <Droplets className="h-3 w-3" />
            SpO₂
          </div>
          <p className="text-lg font-black rpm-text tabular-nums leading-tight mt-0.5">{row.oxygen}</p>
        </div>
      </div>

      <div className="mb-2 rounded-xl border border-black/[0.06] bg-[#030712]/90 rpm-dark:bg-black/40 px-2 py-1.5 shadow-inner">
        <RpmEcgWave points={row.ecgWaveform} bpm={bpm} />
      </div>

      <div className={cn("grid gap-1.5 text-[10px]", compact ? "grid-cols-2" : "grid-cols-3")}>
        {[
          ["HR", row.heartRate],
          ["BP", row.bloodPressure],
          ["SpO₂", row.oxygen],
          ["Glucose", row.glucose],
          ["RR", row.respiratoryRate],
          ["Temp", row.temperature],
        ]
          .slice(0, compact ? 4 : 6)
          .map(([k, v]) => (
            <div
              key={k}
              className={cn(
                "rounded-lg border bg-gradient-to-br px-2 py-1.5",
                VITAL_ACCENT[k as string] ?? "from-slate-500/10 border-slate-200/50",
              )}
            >
              <span className="rpm-muted block text-[8px] uppercase font-bold tracking-wide">{k}</span>
              <span className="font-bold rpm-text tabular-nums">{v}</span>
            </div>
          ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge className={cn("text-[8px] font-black border", tone.badge)}>{tone.label}</Badge>
        <Badge className="text-[8px] font-black border bg-black/5 rpm-dark:bg-white/10 rpm-border">
          <Activity className="inline h-2.5 w-2.5 mr-0.5 opacity-70" />
          Risk {row.aiScore}
        </Badge>
        <span className="text-[9px] rpm-muted ml-auto">{row.compliancePct}% adherence</span>
      </div>

      {!compact && (
        <div className="mt-3 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-7 flex-1 text-[10px] font-bold rounded-lg" onClick={onOpen}>
            <Stethoscope className="h-3 w-3 mr-1" />
            Chart
          </Button>
          <Button variant="ghost" size="sm" className="h-7 flex-1 text-[10px] font-bold rounded-lg" onClick={onEscalate}>
            <AlertOctagon className="h-3 w-3 mr-1" />
            Escalate
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      )}
    </article>
  );
}

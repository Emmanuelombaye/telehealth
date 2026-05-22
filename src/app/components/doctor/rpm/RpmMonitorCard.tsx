import { MessageSquare, Stethoscope, AlertOctagon, MoreHorizontal } from "lucide-react";
import { Badge, Button, cn } from "../../ui/shared.tsx";
import type { RpmLiveRow } from "../../../../lib/rpmCommandCenter";
import { RPM_STATUS_TONE, patientInitials, rpmMonitorCard } from "../../../../lib/rpmEnterpriseUi";
import { RpmEcgWave } from "./RpmEcgWave";
import { CONNECTIVITY_STYLES } from "../../../../lib/doctorRpm";

type Props = {
  row: RpmLiveRow;
  onOpen: () => void;
  onEscalate: () => void;
  compact?: boolean;
};

export function RpmMonitorCard({ row, onOpen, onEscalate, compact }: Props) {
  const tone = RPM_STATUS_TONE[row.statusTone];
  const conn = CONNECTIVITY_STYLES[row.patient.connectivity];

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className={cn(
        rpmMonitorCard,
        tone.card,
        tone.glow,
        tone.ring,
        "ring-1",
        compact ? "p-3" : "p-4",
      )}
    >
      <div className="flex items-start gap-3 mb-3">
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

      <div className="mb-2 rounded-xl bg-black/[0.03] rpm-dark:bg-white/[0.04] px-2 py-1">
        <RpmEcgWave points={row.ecgWaveform} />
      </div>

      <div className={cn("grid gap-2 text-[10px] font-mono", compact ? "grid-cols-2" : "grid-cols-3")}>
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
            <div key={k}>
              <span className="rpm-muted block text-[9px] uppercase font-bold">{k}</span>
              <span className="font-bold rpm-text">{v}</span>
            </div>
          ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge className={cn("text-[8px] font-black border", tone.badge)}>{tone.label}</Badge>
        <Badge className="text-[8px] font-black border bg-black/5 rpm-dark:bg-white/10 rpm-border">
          AI {row.aiScore}%
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

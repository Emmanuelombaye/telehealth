import {
  Users,
  AlertTriangle,
  Watch,
  Brain,
  Activity,
  Video,
  Siren,
  Sparkles,
} from "lucide-react";
import { cn } from "../../ui/shared.tsx";
import { useRpmData } from "../../../pages/doctor/rpm/useRpmData";
import { rpmKpiCard } from "../../../../lib/rpmEnterpriseUi";
import { sparklineFromReadings } from "../../../../lib/rpmCommandCenter";

const ACCENTS = [
  "from-emerald-500/20 to-teal-500/5",
  "from-red-500/20 to-rose-500/5",
  "from-violet-500/20 to-purple-500/5",
  "from-orange-500/20 to-amber-500/5",
  "from-sky-500/20 to-cyan-500/5",
  "from-indigo-500/20 to-blue-500/5",
  "from-fuchsia-500/20 to-violet-500/5",
  "from-amber-500/20 to-yellow-500/5",
];

function MiniTrend({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * 56},${24 - ((v - min) / span) * 22}`)
    .join(" ");
  return (
    <svg width={56} height={24} className="opacity-70">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={pts} />
    </svg>
  );
}

export function RpmKpiStrip() {
  const { stats, readings } = useRpmData();
  const trend = sparklineFromReadings(readings, "hr");

  const cards = [
    { label: "Active RPM patients", value: stats.activePatients, icon: Users, pulse: false },
    { label: "Critical alerts", value: stats.criticalAlerts, icon: AlertTriangle, pulse: stats.criticalAlerts > 0 },
    { label: "Devices connected", value: stats.devicesConnected, icon: Watch, pulse: false },
    { label: "High-risk patients", value: stats.highRiskPatients, icon: Brain, pulse: stats.highRiskPatients > 0 },
    { label: "Avg compliance", value: `${stats.avgCompliance}%`, icon: Activity, pulse: false },
    { label: "Live sessions", value: stats.liveConsultations, icon: Video, pulse: false },
    { label: "Escalations today", value: stats.emergencyEscalationsToday, icon: Siren, pulse: stats.emergencyEscalationsToday > 0 },
    { label: "AI predicted risks", value: stats.aiPredictedRisks, icon: Sparkles, pulse: stats.aiPredictedRisks > 0 },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8 px-4">
      {cards.map((c, i) => (
        <div
          key={c.label}
          className={cn(
            rpmKpiCard,
            `bg-gradient-to-br ${ACCENTS[i % ACCENTS.length]}`,
            c.pulse && "ring-1 ring-red-400/30",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className={cn("rounded-xl p-2 bg-white/50 rpm-dark:bg-white/10 shadow-sm", c.pulse && "rpm-live-pulse")}>
              <c.icon className="h-4 w-4 text-emerald-700 rpm-dark:text-emerald-400" />
            </div>
            <MiniTrend values={trend} />
          </div>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-wider rpm-muted">{c.label}</p>
          <p className="text-2xl font-black rpm-text tracking-tight">{c.value}</p>
          {c.pulse && <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-red-500 animate-ping" />}
        </div>
      ))}
    </div>
  );
}

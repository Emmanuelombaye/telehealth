import { Link } from "react-router";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Activity,
  Watch,
  Shield,
  Brain,
  Siren,
  FileBarChart,
  Plug,
  Settings,
  Users,
  Bell,
  AlertOctagon,
  TrendingUp,
} from "lucide-react";
import { cn, Button, Badge } from "../../../components/ui/shared.tsx";
import { useRpmData } from "./useRpmData";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import { RpmWorkspace } from "./RpmWorkspace";
import { RpmAlertsStream } from "../../../components/doctor/rpm/RpmAlertsStream";
import { rpmGlass, RPM_STATUS_TONE, aiConfidencePct } from "../../../../lib/rpmEnterpriseUi";
import {
  RPM_CHART,
  RpmChartGradients,
  RpmChartTooltip,
  rpmAxisProps,
  rpmGridProps,
  rpmChartCard,
} from "../../../components/doctor/rpm/rpmChartUi";
import { timeAgo } from "../../../../lib/rpmCommandCenter";
import { RISK_STYLES, computeAiRisk } from "../../../../lib/rpmCommandCenter";
import { readingsForPatient } from "../../../../lib/doctorRpm";

export function RpmPatientVitalsPage() {
  return (
    <RpmWorkspace
      title="Patient vitals"
      subtitle="Telemetry trends — select a patient for charts"
      icon={Activity}
    />
  );
}

export function RpmAlertsPage() {
  return (
    <RpmWorkspace
      title="Alerts center"
      subtitle="Critical stream — select a patient to review vitals in context"
      icon={Bell}
      extra={
        <div className={cn(rpmGlass, "p-4")}>
          <RpmAlertsStream fullPage filter="all" max={40} />
        </div>
      }
    />
  );
}

export function RpmCriticalPage() {
  return (
    <RpmWorkspace
      title="Critical cases"
      subtitle="Patients needing immediate review"
      icon={AlertOctagon}
      filterRows={(rows) => rows.filter((r) => r.statusTone === "critical" || r.statusTone === "emergency")}
    />
  );
}

export function RpmDevicesPage() {
  const { deviceFleet } = useRpmData();
  return (
    <RpmWorkspace
      title="Device management"
      subtitle="Fleet status — select a patient to see their device sync history"
      icon={Watch}
      extra={
        <div className="grid gap-2 sm:grid-cols-2">
          {deviceFleet.map((d) => (
            <div key={d.source} className={cn(rpmGlass, "p-3 flex justify-between items-center")}>
              <div>
                <p className="font-bold text-sm rpm-text">{d.label}</p>
                <p className="text-[10px] rpm-muted">{d.syncCount} syncs · {d.lastSync ? timeAgo(d.lastSync) : "—"}</p>
              </div>
              <Badge className="capitalize text-[9px]">{d.status}</Badge>
            </div>
          ))}
        </div>
      }
    />
  );
}

export function RpmCompliancePage() {
  const { filteredRows } = useRpmData();
  const chart = filteredRows.slice(0, 12).map((r) => ({
    name: r.patient.patient_name.split(" ")[0],
    adherence: r.compliancePct,
  }));
  return (
    <RpmWorkspace
      title="Compliance tracking"
      subtitle="Adherence by patient — select for individual trends"
      icon={Shield}
      extra={
        <div className={cn(rpmChartCard, "h-[260px]")}>
          <p className="text-sm font-bold text-slate-800 mb-3">Monthly adherence</p>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chart} margin={{ top: 4, left: -12 }}>
              <RpmChartGradients />
              <CartesianGrid {...rpmGridProps} />
              <XAxis dataKey="name" {...rpmAxisProps} />
              <YAxis {...rpmAxisProps} width={32} domain={[0, 100]} />
              <Tooltip content={<RpmChartTooltip unit="%" />} />
              <Bar dataKey="adherence" fill={RPM_CHART.primary} radius={[8, 8, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
    />
  );
}

export function RpmAiRiskPage() {
  const { filteredRows, readings, range, selectPatient } = useRpmData();
  return (
    <RpmWorkspace
      title="AI risk analysis"
      subtitle="Predictive scoring — select a patient for vitals + AI context"
      icon={Brain}
      extra={
        <div className="grid gap-2 sm:grid-cols-2">
          {filteredRows.slice(0, 8).map((row) => {
            const pr = readingsForPatient(readings, row.patient, range);
            const risk = computeAiRisk(row.patient, pr, range);
            return (
              <button
                key={row.patient.key}
                type="button"
                onClick={() => selectPatient(row.patient.key)}
                className={cn(rpmGlass, "p-3 text-left hover:shadow-md transition-shadow")}
              >
                <div className="flex justify-between gap-2">
                  <span className="font-bold text-sm rpm-text truncate">{row.patient.patient_name}</span>
                  <Badge className={cn("text-[8px] border", RISK_STYLES[risk.level].badge)}>{RISK_STYLES[risk.level].label}</Badge>
                </div>
                <p className="text-[10px] rpm-muted mt-1">AI confidence {aiConfidencePct(risk.level)}%</p>
              </button>
            );
          })}
        </div>
      }
    />
  );
}

export function RpmAnalyticsPage() {
  const { stats } = useRpmData();
  const data = [
    { label: "Syncs", v: stats.syncsInRange },
    { label: "Stable %", v: stats.stablePct },
    { label: "Compliance", v: stats.avgCompliance },
    { label: "Critical", v: stats.criticalAlerts },
  ];
  return (
    <RpmWorkspace
      title="Trends & analytics"
      subtitle="Cohort metrics — select a patient for individual charts"
      icon={TrendingUp}
      showKpis
      extra={
        <div className={cn(rpmChartCard, "h-[280px]")}>
          <p className="text-sm font-bold text-slate-800 mb-3">RPM performance</p>
          <ResponsiveContainer width="100%" height="88%">
            <BarChart data={data} margin={{ top: 4, left: -8 }}>
              <RpmChartGradients />
              <CartesianGrid {...rpmGridProps} />
              <XAxis dataKey="label" {...rpmAxisProps} />
              <YAxis {...rpmAxisProps} width={36} />
              <Tooltip content={<RpmChartTooltip />} />
              <Bar dataKey="v" fill={RPM_CHART.primary} radius={[8, 8, 0, 0]} maxBarSize={52} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
    />
  );
}

export function RpmQueuePage() {
  const doctorBase = useDoctorPortalBase();
  return (
    <RpmWorkspace
      title="Care team queue"
      subtitle="Hand off to clinical queue"
      icon={Users}
      extra={
        <Link to={`${doctorBase}/queue`} className={cn(rpmGlass, "block p-5 text-center font-bold text-emerald-700")}>
          Open patient queue →
        </Link>
      }
    />
  );
}

export function RpmEscalationsPage() {
  const { filteredRows, escalated, selectPatient } = useRpmData();
  const list = filteredRows.filter((r) => escalated.has(r.patient.key) || r.statusTone === "emergency");
  return (
    <RpmWorkspace
      title="Emergency escalations"
      subtitle="Purple-tier cases — select for vitals review"
      icon={Siren}
      filterRows={() => list}
      extra={
        list.length === 0 ? (
          <p className={cn(rpmGlass, "p-6 text-center rpm-muted text-sm")}>No active escalations.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {list.map((row) => (
              <button
                key={row.patient.key}
                type="button"
                onClick={() => selectPatient(row.patient.key)}
                className={cn(rpmGlass, "p-3 text-left border-2 border-violet-300/50")}
              >
                <Badge className={RPM_STATUS_TONE.emergency.badge}>{RPM_STATUS_TONE.emergency.label}</Badge>
                <p className="font-black mt-2 rpm-text">{row.patient.patient_name}</p>
              </button>
            ))}
          </div>
        )
      }
    />
  );
}

export function RpmReportsPage() {
  const { stats } = useRpmData();
  return (
    <RpmWorkspace
      title="RPM reports"
      subtitle="Operational summary — select patients for drill-down charts"
      icon={FileBarChart}
      extra={
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Monitored", stats.activePatients],
            ["Critical", stats.criticalAlerts],
            ["Adherence", `${stats.avgCompliance}%`],
            ["AI flagged", stats.aiPredictedRisks],
          ].map(([l, v]) => (
            <div key={l as string} className={cn(rpmGlass, "p-4")}>
              <p className="text-[10px] font-bold uppercase rpm-muted">{l}</p>
              <p className="text-2xl font-black rpm-text mt-1">{v}</p>
            </div>
          ))}
        </div>
      }
    />
  );
}

export function RpmIntegrationsPage() {
  return (
    <RpmWorkspace
      title="Integrations"
      subtitle="Wearables & channels"
      icon={Plug}
      extra={
        <div className="grid gap-2 sm:grid-cols-2">
          {["Apple Health", "Google Fit", "Fitbit", "Garmin", "Twilio SMS", "SendGrid"].map((n) => (
            <div key={n} className={cn(rpmGlass, "p-3 flex justify-between")}>
              <span className="font-bold text-sm rpm-text">{n}</span>
              <Badge className="bg-emerald-500/15 text-emerald-800 text-[9px]">Ready</Badge>
            </div>
          ))}
        </div>
      }
    />
  );
}

export function RpmSettingsPage() {
  const { theme, setTheme, range, setRange } = useRpmData();
  return (
    <RpmWorkspace
      title="RPM settings"
      subtitle="Display preferences"
      icon={Settings}
      extra={
        <div className={cn(rpmGlass, "p-4 space-y-4 max-w-md")}>
          <div>
            <p className="text-xs font-bold rpm-muted mb-2">Default time range</p>
            <div className="flex flex-wrap gap-2">
              {(["24h", "7d", "30d", "all"] as const).map((r) => (
                <Button key={r} variant={range === r ? "primary" : "outline"} size="sm" className="rounded-xl" onClick={() => setRange(r)}>
                  {r}
                </Button>
              ))}
            </div>
          </div>
          <Button className="rounded-xl" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </Button>
        </div>
      }
    />
  );
}

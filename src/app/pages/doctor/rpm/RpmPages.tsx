import { Link } from "react-router";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { Activity, Watch, Shield, Brain, Siren, FileBarChart, Plug, Settings, Users } from "lucide-react";
import { cn, Button, Badge } from "../../../components/ui/shared.tsx";
import { useRpmData } from "./useRpmData";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import { RpmKpiStrip } from "../../../components/doctor/rpm/RpmKpiStrip";
import { RpmMonitorCard } from "../../../components/doctor/rpm/RpmMonitorCard";
import { RpmAlertsStream } from "../../../components/doctor/rpm/RpmAlertsStream";
import { rpmGlass, RPM_STATUS_TONE, aiConfidencePct } from "../../../../lib/rpmEnterpriseUi";
import { buildBpTrend, buildSingleMetricTrend, timeAgo } from "../../../../lib/rpmCommandCenter";
import { RISK_STYLES, computeAiRisk } from "../../../../lib/rpmCommandCenter";
import { readingsForPatient } from "../../../../lib/doctorRpm";
import { toast } from "sonner";

function PageHero({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: typeof Activity }) {
  return (
    <div className={cn(rpmGlass, "mx-4 p-5 flex items-center gap-4")}>
      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-xl">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <h1 className="text-xl font-black rpm-text">{title}</h1>
        <p className="text-sm rpm-muted">{subtitle}</p>
      </div>
    </div>
  );
}

export function RpmPatientVitalsPage() {
  const { filteredRows, setDrawerKey, escalatePatientKey, readings, range } = useRpmData();
  const sample = filteredRows[0];
  const pr = sample ? readingsForPatient(readings, sample.patient, range) : [];
  const bp = buildBpTrend(pr, 24);
  const hr = buildSingleMetricTrend(pr, ["hr"], 24);

  return (
    <div className="space-y-4 pb-8">
      <PageHero title="Patient vitals" subtitle="Advanced telemetry visualization across your RPM cohort" icon={Activity} />
      <div className="grid gap-4 px-4 lg:grid-cols-2">
        <div className={cn(rpmGlass, "p-4 h-[280px]")}>
          <p className="text-xs font-bold rpm-muted mb-2">Blood pressure trend (sample)</p>
          {bp.length > 0 ? (
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={bp}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Area type="monotone" dataKey="sys" stroke="#ef4444" fill="#fecaca55" />
                <Area type="monotone" dataKey="dia" stroke="#3b82f6" fill="#93c5fd44" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm rpm-muted text-center py-20">Select a patient with BP readings</p>
          )}
        </div>
        <div className={cn(rpmGlass, "p-4 h-[280px]")}>
          <p className="text-xs font-bold rpm-muted mb-2">Heart rate trend</p>
          {hr.length > 0 ? (
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={hr}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm rpm-muted text-center py-20">No HR data in range</p>
          )}
        </div>
      </div>
      <div className="grid gap-3 px-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredRows.map((row) => (
          <RpmMonitorCard
            key={row.patient.key}
            row={row}
            compact
            onOpen={() => setDrawerKey(row.patient.key)}
            onEscalate={() => escalatePatientKey(row.patient.key)}
          />
        ))}
      </div>
    </div>
  );
}

export function RpmAlertsPage() {
  return (
    <div className="space-y-4 pb-8">
      <PageHero title="Alerts center" subtitle="Critical stream · AI anomalies · device events" icon={Activity} />
      <div className="px-4">
        <RpmAlertsStream fullPage filter="all" max={80} />
      </div>
    </div>
  );
}

export function RpmCriticalPage() {
  const { filteredRows, setDrawerKey, escalatePatientKey } = useRpmData();
  const critical = filteredRows.filter((r) => r.statusTone === "critical" || r.statusTone === "emergency");
  return (
    <div className="space-y-4 pb-8">
      <PageHero title="Critical cases" subtitle="Patients requiring immediate clinical attention" icon={AlertOctagon} />
      <div className="grid gap-3 px-4 sm:grid-cols-2 xl:grid-cols-3">
        {critical.length === 0 ? (
          <p className={cn(rpmGlass, "p-8 text-center rpm-muted col-span-full")}>No critical cases in this window.</p>
        ) : (
          critical.map((row) => (
            <RpmMonitorCard key={row.patient.key} row={row} onOpen={() => setDrawerKey(row.patient.key)} onEscalate={() => escalatePatientKey(row.patient.key)} />
          ))
        )}
      </div>
    </div>
  );
}

export function RpmDevicesPage() {
  const { deviceFleet } = useRpmData();
  const integrations = [
    { name: "Apple Health", status: "Connected", patients: deviceFleet.filter((d) => d.source.includes("apple")).length },
    { name: "Google Fit", status: "Connected", patients: deviceFleet.filter((d) => d.source.includes("google")).length },
    { name: "Fitbit", status: "Available", patients: 0 },
    { name: "Garmin", status: "Available", patients: 0 },
    { name: "Bluetooth RPM", status: "Live", patients: deviceFleet.length },
  ];

  return (
    <div className="space-y-4 pb-8">
      <PageHero title="Device management" subtitle="IoT fleet · wearables · sync health" icon={Watch} />
      <div className="grid gap-3 px-4 md:grid-cols-2">
        {deviceFleet.map((d) => (
          <div key={d.source} className={cn(rpmGlass, "p-4 flex justify-between items-center")}>
            <div>
              <p className="font-bold rpm-text">{d.label}</p>
              <p className="text-xs rpm-muted">{d.patientCount} patients · {d.syncCount} syncs</p>
              <p className="text-[10px] rpm-muted mt-1">Firmware auto · Last {d.lastSync ? timeAgo(d.lastSync) : "—"}</p>
            </div>
            <Badge className="font-bold capitalize">{d.status}</Badge>
          </div>
        ))}
      </div>
      <div className="px-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((i) => (
          <div key={i.name} className={cn(rpmGlass, "p-4")}>
            <p className="font-black rpm-text">{i.name}</p>
            <p className="text-xs rpm-muted mt-1">{i.status}</p>
            <p className="text-[10px] mt-2">Bluetooth · cloud sync enabled</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RpmCompliancePage() {
  const { filteredRows } = useRpmData();
  const chart = filteredRows.slice(0, 12).map((r) => ({
    name: r.patient.patient_name.split(" ")[0],
    adherence: r.compliancePct,
    missed: Math.max(0, 100 - r.compliancePct),
  }));

  return (
    <div className="space-y-4 pb-8">
      <PageHero title="Compliance tracking" subtitle="Adherence · engagement · device usage" icon={Shield} />
      <div className={cn(rpmGlass, "mx-4 p-4 h-[300px]")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip />
            <Bar dataKey="adherence" fill="#059669" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="px-4 grid gap-2 sm:grid-cols-2">
        {filteredRows
          .sort((a, b) => a.compliancePct - b.compliancePct)
          .slice(0, 8)
          .map((r) => (
            <div key={r.patient.key} className={cn(rpmGlass, "p-3 flex justify-between")}>
              <span className="font-bold text-sm rpm-text">{r.patient.patient_name}</span>
              <span className={cn("font-black", r.compliancePct < 50 ? "text-red-600" : "text-emerald-600")}>{r.compliancePct}%</span>
            </div>
          ))}
      </div>
    </div>
  );
}

export function RpmAiRiskPage() {
  const { filteredRows, readings, range, setDrawerKey } = useRpmData();

  return (
    <div className="space-y-4 pb-8">
      <PageHero title="AI risk analysis" subtitle="Predictive deterioration · cardiac · metabolic · respiratory" icon={Brain} />
      <div className="px-4 grid gap-3 md:grid-cols-2">
        {filteredRows.map((row) => {
          const pr = readingsForPatient(readings, row.patient, range);
          const risk = computeAiRisk(row.patient, pr, range);
          const conf = aiConfidencePct(risk.level);
          return (
            <button
              key={row.patient.key}
              type="button"
              onClick={() => setDrawerKey(row.patient.key)}
              className={cn(rpmGlass, "p-4 text-left hover:shadow-xl transition-all")}
            >
              <div className="flex justify-between">
                <p className="font-black rpm-text">{row.patient.patient_name}</p>
                <Badge className={cn("text-[9px] font-black border", RISK_STYLES[risk.level].badge)}>{RISK_STYLES[risk.level].label}</Badge>
              </div>
              <div className="mt-3 h-2 rounded-full bg-black/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" style={{ width: `${conf}%` }} />
              </div>
              <p className="text-[10px] rpm-muted mt-1">AI confidence {conf}%</p>
              <ul className="mt-2 text-xs rpm-muted list-disc pl-4 space-y-0.5">
                {risk.reasons.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p className="text-[10px] mt-2 text-violet-600 font-semibold">Recommended: clinical review within 24h</p>
            </button>
          );
        })}
      </div>
    </div>
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
    <div className="space-y-4 pb-8">
      <PageHero title="Trends & analytics" subtitle="Executive RPM performance intelligence" icon={Activity} />
      <RpmKpiStrip />
      <div className={cn(rpmGlass, "mx-4 p-4 h-[320px]")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="v" fill="#0A2E1F" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function RpmQueuePage() {
  const doctorBase = useDoctorPortalBase();
  return (
    <div className="space-y-4 pb-8 px-4">
      <PageHero title="Care team queue" subtitle="Hand off to clinical queue for active cases" icon={Users} />
      <Link
        to={`${doctorBase}/queue`}
        className={cn(rpmGlass, "block p-6 text-center font-bold text-emerald-700 hover:shadow-xl transition-shadow")}
      >
        Open patient queue →
      </Link>
    </div>
  );
}

export function RpmEscalationsPage() {
  const { filteredRows, escalated, setDrawerKey } = useRpmData();
  const list = filteredRows.filter((r) => escalated.has(r.patient.key) || r.statusTone === "emergency");
  return (
    <div className="space-y-4 pb-8">
      <PageHero title="Emergency escalations" subtitle="Purple-tier emergency workflow" icon={Siren} />
      <div className="grid gap-3 px-4 sm:grid-cols-2">
        {list.length === 0 ? (
          <p className={cn(rpmGlass, "p-8 rpm-muted text-center col-span-full")}>No active escalations. Use Escalate on a patient card.</p>
        ) : (
          list.map((row) => (
            <div
              key={row.patient.key}
              className={cn(rpmGlass, "p-4 border-2", RPM_STATUS_TONE.emergency.ring)}
              style={{ borderColor: "rgba(139,92,246,0.4)" }}
            >
              <Badge className={RPM_STATUS_TONE.emergency.badge}>{RPM_STATUS_TONE.emergency.label}</Badge>
              <p className="font-black mt-2 rpm-text">{row.patient.patient_name}</p>
              <Button className="mt-3 rounded-xl" size="sm" onClick={() => setDrawerKey(row.patient.key)}>
                Open chart
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function RpmReportsPage() {
  const { stats } = useRpmData();
  return (
    <div className="space-y-4 pb-8">
      <PageHero title="RPM reports" subtitle="Operational · clinical · revenue impact" icon={FileBarChart} />
      <div className="px-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Patients monitored", stats.activePatients],
          ["Emergency incidents", stats.criticalAlerts],
          ["Avg adherence", `${stats.avgCompliance}%`],
          ["AI flagged", stats.aiPredictedRisks],
        ].map(([l, v]) => (
          <div key={l as string} className={cn(rpmGlass, "p-5")}>
            <p className="text-[10px] font-bold uppercase rpm-muted">{l}</p>
            <p className="text-2xl font-black rpm-text mt-1">{v}</p>
          </div>
        ))}
      </div>
      <p className="text-xs rpm-muted text-center px-4">Export PDF / CSV — connect reporting service in Settings.</p>
    </div>
  );
}

export function RpmIntegrationsPage() {
  return (
    <div className="space-y-4 pb-8">
      <PageHero title="Integrations" subtitle="Wearables · EHR · notification channels" icon={Plug} />
      <div className="px-4 grid gap-3 md:grid-cols-2">
        {["Apple Health", "Google Fit", "Fitbit", "Garmin", "Twilio SMS", "SendGrid Email"].map((n) => (
          <div key={n} className={cn(rpmGlass, "p-4 flex justify-between items-center")}>
            <span className="font-bold rpm-text">{n}</span>
            <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-400/30">Ready</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RpmSettingsPage() {
  const { range, setRange, theme, setTheme } = useRpmData();
  return (
    <div className="space-y-4 pb-8">
      <PageHero title="RPM settings" subtitle="Display · defaults · alert preferences" icon={Settings} />
      <div className={cn(rpmGlass, "mx-4 p-5 space-y-4 max-w-lg")}>
        <div>
          <p className="text-xs font-bold rpm-muted mb-2">Default time range</p>
          <div className="flex flex-wrap gap-2">
            {(["24h", "7d", "30d", "all"] as const).map((r) => (
              <Button key={r} variant={range === r ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => setRange(r)}>
                {r}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold rpm-muted mb-2">Theme</p>
          <Button className="rounded-xl" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "Switch to light" : "Switch to dark"}
          </Button>
        </div>
      </div>
    </div>
  );
}

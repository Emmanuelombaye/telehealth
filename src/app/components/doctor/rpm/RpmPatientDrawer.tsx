import { createPortal } from "react-dom";
import { Link } from "react-router";
import {
  X,
  Stethoscope,
  MessageSquare,
  Pill,
  AlertOctagon,
  Activity,
  Clock,
  Brain,
  Shield,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  RPM_CHART,
  RpmChartGradients,
  RpmChartTooltip,
  rpmActiveDot,
  rpmAxisProps,
  rpmGridProps,
  rpmChartCard,
} from "./rpmChartUi";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, cn } from "../../ui/shared.tsx";
import { doctorSurfaceCard } from "../../../../lib/doctorPortalUi";
import { doctorMessagesHref } from "../../../../lib/doctorPortalBase";
import {
  buildBpTrend,
  buildSingleMetricTrend,
  RPM_METRIC_OPTIONS,
  sourceDisplay,
  timeAgo,
  type RpmTimeRange,
} from "../../../../lib/rpmCommandCenter";
import {
  buildVitalCards,
  STATUS_STYLES,
  type VitalReading,
} from "../../../../lib/vitalsClinical";
import {
  ALERT_TIER_STYLES,
  computeAiRisk,
  computeCompliance,
  orderContextFromRow,
  RISK_STYLES,
  SEVERITY_STYLES,
  type RpmAlert,
  type RpmLiveRow,
  type RpmOrderRow,
  type RpmTimelineEvent,
} from "../../../../lib/rpmCommandCenter";
import { CONNECTIVITY_STYLES } from "../../../../lib/doctorRpm";
import { RpmEcgWave, parseBpmFromDisplay } from "./RpmEcgWave";

type Props = {
  open: boolean;
  onClose: () => void;
  row: RpmLiveRow | null;
  order: RpmOrderRow | null;
  patientReadings: VitalReading[];
  alerts: RpmAlert[];
  timeline: RpmTimelineEvent[];
  doctorBase: "/doctor" | "/providers";
  range: RpmTimeRange;
  chartMetric: (typeof RPM_METRIC_OPTIONS)[number]["id"];
  onChartMetric: (id: (typeof RPM_METRIC_OPTIONS)[number]["id"]) => void;
  onEscalate: () => void;
  dark?: boolean;
  /** True when opened via tap/click — shows backdrop */
  pinned?: boolean;
  onHoverEnter?: () => void;
  onHoverLeave?: () => void;
};

export function RpmPatientDrawer({
  open,
  onClose,
  row,
  order,
  patientReadings,
  alerts,
  timeline,
  doctorBase,
  range,
  chartMetric,
  onChartMetric,
  onEscalate,
  dark = false,
  pinned = true,
  onHoverEnter,
  onHoverLeave,
}: Props) {
  if (!open || !row) return null;

  const patient = row.patient;
  const conn = CONNECTIVITY_STYLES[patient.connectivity];
  const ctx = order ? orderContextFromRow(order) : null;
  const risk = computeAiRisk(patient, patientReadings, range);
  const compliance = computeCompliance(patient, range);
  const vitalCards = buildVitalCards(patientReadings, patient.intake);
  const bpTrend = buildBpTrend(patientReadings, 20);
  const metricOpt = RPM_METRIC_OPTIONS.find((m) => m.id === chartMetric);
  const metricTrend =
    chartMetric !== "bp" && metricOpt
      ? buildSingleMetricTrend(patientReadings, [...metricOpt.metrics], 24)
      : [];

  const panel = (
    <div className="fixed inset-0 z-[200] flex justify-end pointer-events-none">
      {pinned && (
        <button
          type="button"
          className="absolute inset-0 bg-[#0A2E1F]/40 backdrop-blur-sm pointer-events-auto"
          aria-label="Close patient monitor"
          onClick={onClose}
        />
      )}
      {!pinned && (
        <div className="absolute inset-0 pointer-events-auto" aria-hidden onClick={onClose} />
      )}
      <aside
        onMouseEnter={onHoverEnter}
        onMouseLeave={onHoverLeave}
        className={cn(
          "relative flex h-dvh w-full max-w-xl flex-col border-l shadow-2xl pointer-events-auto",
          pinned ? "animate-in slide-in-from-right duration-300" : "transition-transform duration-200",
          dark
            ? "border-slate-700 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 text-slate-100"
            : "border-emerald-900/10 bg-gradient-to-b from-white via-slate-50/80 to-white",
        )}
      >
        <header
          className={cn(
            "shrink-0 border-b px-5 py-4 backdrop-blur-md",
            dark ? "border-slate-700 bg-slate-900/90" : "border-slate-200/80 bg-white/90",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Patient monitor</p>
              <h2 className="text-xl font-black text-[#0A2E1F] truncate">{patient.patient_name}</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge className={cn("text-[9px] font-black border", SEVERITY_STYLES[row.severity].badge)}>
                  {row.severityLabel}
                </Badge>
                <Badge className={cn("text-[9px] font-black border", RISK_STYLES[risk.level].badge)}>
                  {RISK_STYLES[risk.level].label}
                </Badge>
                <Badge className={cn("text-[9px] font-black border", conn.badge)}>
                  {conn.label}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {patient.order_id && (
              <Link
                to={`${doctorBase}/consult?orderId=${encodeURIComponent(patient.order_id)}`}
                className="inline-flex items-center rounded-xl bg-[#0A2E1F] text-white px-3 py-2 text-xs font-bold hover:bg-emerald-900"
              >
                <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
                Start consultation
              </Link>
            )}
            {patient.patient_id && (
              <Link
                to={doctorMessagesHref(doctorBase, patient.patient_id)}
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#0A2E1F] hover:border-emerald-300"
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                Message
              </Link>
            )}
            <Link
              to={`${doctorBase}/erx`}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#0A2E1F] hover:border-emerald-300"
            >
              <Pill className="h-3.5 w-3.5 mr-1.5" />
              Prescription
            </Link>
            <Button
              variant="outline"
              className="rounded-xl border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold h-9"
              onClick={onEscalate}
            >
              <AlertOctagon className="h-3.5 w-3.5 mr-1.5" />
              Escalate
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-5">
          <div className="rounded-2xl border border-slate-200/80 bg-[#030712]/95 p-3 rpm-dark:border-slate-700/60">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Live cardiac rhythm</p>
            <RpmEcgWave points={row.ecgWaveform} bpm={parseBpmFromDisplay(row.heartRate)} className="min-h-[40px]" />
          </div>

          <section className="grid grid-cols-2 gap-3">
            <Card className={cn(doctorSurfaceCard, "col-span-2")}>
              <CardContent className="p-4 grid sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Condition</p>
                  <p className="font-bold text-[#0A2E1F]">{ctx?.category ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Medication</p>
                  <p className="font-bold text-[#0A2E1F] truncate">{ctx?.medication ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Allergies</p>
                  <p className="font-bold text-[#0A2E1F] truncate">{ctx?.allergies ?? "—"}</p>
                </div>
              </CardContent>
            </Card>
            <Card className={doctorSurfaceCard}>
              <CardContent className="p-4">
                <p className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Compliance
                </p>
                <p className="text-2xl font-black text-[#0A2E1F] mt-1">{compliance}%</p>
              </CardContent>
            </Card>
            <Card className={doctorSurfaceCard}>
              <CardContent className="p-4">
                <p className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                  <Brain className="h-3 w-3" /> AI risk
                </p>
                <p className="text-sm font-black text-[#0A2E1F] mt-1">{RISK_STYLES[risk.level].label}</p>
                {risk.reasons.length > 0 && (
                  <ul className="mt-2 text-[10px] text-slate-600 space-y-0.5 list-disc pl-3">
                    {risk.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>

          <div className="grid gap-2 sm:grid-cols-2">
            {vitalCards.slice(0, 6).map((card) => {
              const st = STATUS_STYLES[card.status];
              return (
                <Card key={card.id} className={cn(doctorSurfaceCard, "ring-1", st.ring)}>
                  <CardContent className="p-3">
                    <p className="text-[9px] font-black uppercase text-slate-500">{card.label}</p>
                    <p className="text-base font-black text-[#0A2E1F]">{card.current}</p>
                    <Badge className={cn("mt-1 text-[8px] font-black border", st.badge)}>{card.statusLabel}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className={cn(rpmChartCard, dark && "rpm-dark:border-slate-700")}>
            <div className="flex flex-row items-center justify-between pb-2">
              <p className="text-sm font-bold text-slate-800 rpm-dark:text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#8B5CF6]" />
                Vitals trend
              </p>
              <select
                value={chartMetric}
                onChange={(e) => onChartMetric(e.target.value as typeof chartMetric)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white rpm-dark:bg-slate-800 rpm-dark:border-slate-600"
              >
                {RPM_METRIC_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="h-[220px]">
              {chartMetric === "bp" && bpTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bpTrend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <RpmChartGradients />
                    <CartesianGrid {...rpmGridProps} />
                    <XAxis dataKey="time" {...rpmAxisProps} />
                    <YAxis {...rpmAxisProps} width={36} />
                    <Tooltip content={<RpmChartTooltip />} />
                    <Area type="monotone" dataKey="sys" stroke={RPM_CHART.primaryDark} strokeWidth={2} fill="url(#rpmAreaSys)" activeDot={rpmActiveDot} />
                    <Area type="monotone" dataKey="dia" stroke={RPM_CHART.primaryLight} strokeWidth={2} fill="url(#rpmAreaDia)" activeDot={rpmActiveDot} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : metricTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metricTrend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <RpmChartGradients />
                    <CartesianGrid {...rpmGridProps} />
                    <XAxis dataKey="time" {...rpmAxisProps} />
                    <YAxis {...rpmAxisProps} width={36} />
                    <Tooltip content={<RpmChartTooltip />} />
                    <Area type="monotone" dataKey="value" stroke={RPM_CHART.primary} strokeWidth={2.5} fill="url(#rpmAreaPrimary)" activeDot={rpmActiveDot} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-400 text-center py-16">No trend data in range.</p>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Devices: {patient.deviceSources.map(sourceDisplay).join(" · ") || "None paired"}
              {patient.lastSyncAt && ` · Last sync ${timeAgo(patient.lastSyncAt)}`}
            </p>
          </div>

          <Card className={doctorSurfaceCard}>
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-[#0A2E1F] flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Activity timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
              {timeline.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">No events in range.</p>
              ) : (
                timeline.map((ev) => (
                  <div
                    key={ev.id}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs",
                      ev.tier ? ALERT_TIER_STYLES[ev.tier] : "border-slate-100 bg-white",
                    )}
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-bold text-[#0A2E1F]">{ev.label}</span>
                      <span className="text-[10px] text-slate-500 shrink-0">{timeAgo(ev.at)}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{ev.detail}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {alerts.filter((a) => a.patientKey === patient.key).length > 0 && (
            <Card className={doctorSurfaceCard}>
              <CardHeader>
                <CardTitle className="text-sm font-black text-red-800">Active alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {alerts
                  .filter((a) => a.patientKey === patient.key)
                  .slice(0, 6)
                  .map((a) => (
                    <div key={a.id} className={cn("rounded-lg border p-2 text-xs", ALERT_TIER_STYLES[a.tier])}>
                      <p className="font-bold">{a.title}</p>
                      <p className="text-slate-600">{a.detail}</p>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </div>
      </aside>
    </div>
  );

  return createPortal(panel, document.body);
}

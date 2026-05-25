import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Heart, Droplets, Activity, Thermometer, Gauge } from "lucide-react";
import { cn } from "../../ui/shared.tsx";
import { RpmEcgWave, parseBpmFromDisplay } from "./RpmEcgWave";
import {
  buildBpTrend,
  buildSingleMetricTrend,
  type RpmLiveRow,
} from "../../../../lib/rpmCommandCenter";
import type { VitalReading } from "../../../../lib/vitalsClinical";
import { buildVitalCards, STATUS_STYLES } from "../../../../lib/vitalsClinical";
import { Badge } from "../../ui/shared.tsx";
import {
  RPM_CHART,
  RpmChartGradients,
  RpmChartPanel,
  RpmChartTooltip,
  rpmActiveDot,
  rpmAxisProps,
  rpmGridProps,
} from "./rpmChartUi";

type Props = {
  row: RpmLiveRow;
  readings: VitalReading[];
};

export function RpmInlineCharts({ row, readings }: Props) {
  const bp = buildBpTrend(readings, 24);
  const hr = buildSingleMetricTrend(readings, ["hr"], 24);
  const spo2 = buildSingleMetricTrend(readings, ["spo2"], 24);
  const glucose = buildSingleMetricTrend(readings, ["glucose"], 24);
  const temp = buildSingleMetricTrend(readings, ["temp", "temperature"], 24);
  const cards = buildVitalCards(readings, row.patient.intake);

  const base = row.compliancePct;
  const adherenceBar = [
    { label: "Mon", readings: Math.min(base, 100), target: 80 },
    { label: "Tue", readings: Math.min(base + 8, 100), target: 80 },
    { label: "Wed", readings: Math.max(base - 12, 0), target: 80 },
    { label: "Thu", readings: base, target: 80 },
    { label: "Fri", readings: Math.min(base + 5, 100), target: 80 },
    { label: "Sat", readings: Math.max(base - 5, 0), target: 80 },
    { label: "Sun", readings: base, target: 80 },
  ];

  const adherencePct = Math.min(100, Math.max(0, row.compliancePct));

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-slate-900 rpm-dark:text-white">{row.patient.patient_name}</h2>
          <p className="text-xs text-slate-400 rpm-dark:text-slate-500">Vitals analytics · select another patient to switch</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cards.slice(0, 4).map((c) => (
            <Badge key={c.id} className={cn("text-[9px] font-black border", STATUS_STYLES[c.status].badge)}>
              {c.label}: {c.current}
            </Badge>
          ))}
        </div>
      </div>

      {/* Live snapshot + ECG strip */}
      <div className="grid gap-3 lg:grid-cols-[1fr_minmax(0,200px)]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Heart rate", value: row.heartRate, icon: Heart, tone: "text-rose-500" },
            { label: "Blood pressure", value: row.bloodPressure, icon: Gauge, tone: "text-violet-500" },
            { label: "SpO₂", value: row.oxygen, icon: Droplets, tone: "text-sky-500" },
            { label: "Temperature", value: row.temperature, icon: Thermometer, tone: "text-orange-500" },
          ].map((v) => (
            <div
              key={v.label}
              className="rounded-xl border border-slate-200/80 bg-white/80 p-3 rpm-dark:bg-slate-800/60 rpm-dark:border-slate-700/60"
            >
              <div className={cn("flex items-center gap-1 text-[9px] font-black uppercase", v.tone)}>
                <v.icon className="h-3 w-3" />
                {v.label}
              </div>
              <p className="text-base font-black rpm-text tabular-nums mt-1">{v.value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-[#030712]/95 p-2 rpm-dark:border-slate-700/60 min-h-[88px] flex flex-col justify-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400/90 mb-1 flex items-center gap-1">
            <Activity className="h-3 w-3" /> Live rhythm
          </p>
          <RpmEcgWave points={row.ecgWaveform} bpm={parseBpmFromDisplay(row.heartRate)} />
        </div>
      </div>

      {/* Hero — heart rate trend */}
      <RpmChartPanel
        title="Heart rate trend"
        subtitle="Live telemetry · last readings in range"
        empty="No heart rate data in this window"
        featured
        footer={
          hr.length > 0 ? (
            <button
              type="button"
              className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 rpm-dark:text-emerald-400 flex items-center gap-1"
            >
              View full vitals history
              <span aria-hidden>→</span>
            </button>
          ) : undefined
        }
      >
        {hr.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hr} margin={{ top: 12, right: 8, left: -8, bottom: 0 }}>
              <RpmChartGradients />
              <CartesianGrid {...rpmGridProps} />
              <XAxis dataKey="time" {...rpmAxisProps} interval="preserveStartEnd" />
              <YAxis {...rpmAxisProps} width={36} />
              <Tooltip content={<RpmChartTooltip unit=" bpm" />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#rpmAreaHeart)"
                dot={false}
                activeDot={{ ...rpmActiveDot, fill: "#10b981" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </RpmChartPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <RpmChartPanel title="Blood pressure" subtitle="Systolic & diastolic" empty="No BP readings in range">
          {bp.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bp} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <RpmChartGradients />
                <CartesianGrid {...rpmGridProps} />
                <XAxis dataKey="time" {...rpmAxisProps} interval="preserveStartEnd" />
                <YAxis {...rpmAxisProps} width={36} />
                <Tooltip content={<RpmChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="sys"
                  name="Systolic"
                  stroke={RPM_CHART.primaryDark}
                  strokeWidth={2}
                  fill="url(#rpmAreaSys)"
                  dot={false}
                  activeDot={rpmActiveDot}
                />
                <Area
                  type="monotone"
                  dataKey="dia"
                  name="Diastolic"
                  stroke={RPM_CHART.primaryLight}
                  strokeWidth={2}
                  fill="url(#rpmAreaDia)"
                  dot={false}
                  activeDot={{ ...rpmActiveDot, fill: RPM_CHART.primaryLight }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </RpmChartPanel>

        <RpmChartPanel title="Medication adherence" subtitle="Readings consistency vs goal" empty="—">
          <div className="flex flex-col sm:flex-row items-center gap-4 h-full min-h-[160px]">
            <div className="relative h-28 w-28 shrink-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--rpm-chart-grid, #e2e8f0)" strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${adherencePct * 2.64} 264`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black rpm-text">{adherencePct}%</span>
                <span className="text-[9px] font-bold rpm-muted uppercase">Adherence</span>
              </div>
            </div>
            <div className="flex-1 w-full min-h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={adherenceBar} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={4}>
                  <CartesianGrid {...rpmGridProps} />
                  <XAxis dataKey="label" {...rpmAxisProps} />
                  <YAxis {...rpmAxisProps} width={32} domain={[0, 100]} />
                  <Tooltip content={<RpmChartTooltip unit="%" />} />
                  <Bar dataKey="readings" name="Readings" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="target" name="Goal" fill={RPM_CHART.secondary} radius={[6, 6, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </RpmChartPanel>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricAreaChart title="Oxygen saturation (SpO₂)" data={spo2} unit="%" domain={[85, 100]} empty="No SpO₂ in range" stroke="#0ea5e9" fill="url(#rpmAreaSoft)" />
        <MetricAreaChart title="Glucose" data={glucose} unit=" mg/dL" empty="No glucose in range" />
        <MetricAreaChart title="Temperature" data={temp} unit="°" empty="No temperature in range" stroke="#f97316" fill="url(#rpmAreaTemp)" />
      </div>
    </div>
  );
}

function MetricAreaChart({
  title,
  data,
  unit,
  domain,
  empty,
  stroke = RPM_CHART.primary,
  fill = "url(#rpmAreaSoft)",
}: {
  title: string;
  data: { time: string; value: number }[];
  unit: string;
  domain?: [number, number];
  empty: string;
  stroke?: string;
  fill?: string;
}) {
  return (
    <RpmChartPanel title={title} empty={empty}>
      {data.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <RpmChartGradients />
            <CartesianGrid {...rpmGridProps} />
            <XAxis dataKey="time" {...rpmAxisProps} interval="preserveStartEnd" />
            <YAxis {...rpmAxisProps} width={36} domain={domain} />
            <Tooltip content={<RpmChartTooltip unit={unit} />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={2}
              fill={fill}
              dot={false}
              activeDot={{ ...rpmActiveDot, fill: stroke }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </RpmChartPanel>
  );
}

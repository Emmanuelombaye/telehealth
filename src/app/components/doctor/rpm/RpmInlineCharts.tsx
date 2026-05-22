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
import { cn } from "../../ui/shared.tsx";
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

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-slate-900 rpm-dark:text-white">{row.patient.patient_name}</h2>
          <p className="text-xs text-slate-400">Vitals analytics · select another patient to switch</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cards.slice(0, 4).map((c) => (
            <Badge key={c.id} className={cn("text-[9px] font-black border", STATUS_STYLES[c.status].badge)}>
              {c.label}: {c.current}
            </Badge>
          ))}
        </div>
      </div>

      {/* Hero — weekly-style performance curve (heart rate) */}
      <RpmChartPanel
        title="Heart rate trend"
        subtitle="Live telemetry · last readings in range"
        empty="No heart rate data in this window"
        featured
        footer={
          hr.length > 0 ? (
            <button
              type="button"
              className="mt-3 text-xs font-semibold text-[#8B5CF6] hover:text-[#7C3AED] flex items-center gap-1"
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
                stroke={RPM_CHART.primary}
                strokeWidth={2.5}
                fill="url(#rpmAreaPrimary)"
                dot={false}
                activeDot={rpmActiveDot}
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

        <RpmChartPanel title="RPM engagement" subtitle="Readings consistency" empty="—">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={adherenceBar} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={4}>
              <CartesianGrid {...rpmGridProps} />
              <XAxis dataKey="label" {...rpmAxisProps} />
              <YAxis {...rpmAxisProps} width={32} domain={[0, 100]} />
              <Tooltip content={<RpmChartTooltip unit="%" />} />
              <Bar dataKey="readings" name="Readings" fill={RPM_CHART.primary} radius={[6, 6, 0, 0]} maxBarSize={22} />
              <Bar dataKey="target" name="Goal" fill={RPM_CHART.secondary} radius={[6, 6, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </RpmChartPanel>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MetricAreaChart title="Oxygen saturation (SpO₂)" data={spo2} unit="%" domain={[85, 100]} empty="No SpO₂ in range" />
        <MetricAreaChart title="Glucose" data={glucose} unit=" mg/dL" empty="No glucose in range" />
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
}: {
  title: string;
  data: { time: string; value: number }[];
  unit: string;
  domain?: [number, number];
  empty: string;
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
              stroke={RPM_CHART.primary}
              strokeWidth={2}
              fill="url(#rpmAreaSoft)"
              dot={false}
              activeDot={rpmActiveDot}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </RpmChartPanel>
  );
}

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "../../ui/shared.tsx";
import { rpmGlass } from "../../../../lib/rpmEnterpriseUi";
import {
  buildBpTrend,
  buildSingleMetricTrend,
  type RpmLiveRow,
} from "../../../../lib/rpmCommandCenter";
import type { VitalReading } from "../../../../lib/vitalsClinical";
import { buildVitalCards, STATUS_STYLES } from "../../../../lib/vitalsClinical";
import { Badge } from "../../ui/shared.tsx";

type Props = {
  row: RpmLiveRow;
  readings: VitalReading[];
};

export function RpmInlineCharts({ row, readings }: Props) {
  const bp = buildBpTrend(readings, 20);
  const hr = buildSingleMetricTrend(readings, ["hr"], 20);
  const spo2 = buildSingleMetricTrend(readings, ["spo2"], 20);
  const glucose = buildSingleMetricTrend(readings, ["glucose"], 20);
  const cards = buildVitalCards(readings, row.patient.intake);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black rpm-text">{row.patient.patient_name}</h2>
          <p className="text-xs rpm-muted">Live vitals · click another patient to switch</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cards.slice(0, 4).map((c) => (
            <Badge key={c.id} className={cn("text-[9px] font-black border", STATUS_STYLES[c.status].badge)}>
              {c.label}: {c.current}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ChartPanel title="Blood pressure" empty="No BP readings in range">
          {bp.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bp}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                <Area type="monotone" dataKey="sys" stroke="#ef4444" fill="#fecaca44" strokeWidth={2} />
                <Area type="monotone" dataKey="dia" stroke="#3b82f6" fill="#93c5fd33" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>
        <ChartPanel title="Heart rate" empty="No HR readings in range">
          {hr.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hr}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>
        <ChartPanel title="SpO₂" empty="No oxygen readings in range">
          {spo2.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spo2}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} domain={[85, 100]} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>
        <ChartPanel title="Glucose" empty="No glucose readings in range">
          {glucose.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={glucose}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>
      </div>
    </div>
  );
}

function ChartPanel({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(rpmGlass, "p-3 h-[220px] flex flex-col")}>
      <p className="text-[10px] font-black uppercase tracking-wider rpm-muted mb-2">{title}</p>
      <div className="flex-1 min-h-0">
        {children || <p className="text-sm rpm-muted text-center py-16">{empty}</p>}
      </div>
    </div>
  );
}

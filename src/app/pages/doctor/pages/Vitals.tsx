import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Activity,
  AlertTriangle,
  Droplets,
  Heart,
  HeartPulse,
  Loader2,
  RefreshCw,
  Search,
  Thermometer,
  TrendingUp,
  Wind,
  Scale,
  Watch,
  Radio,
  Filter,
  User,
  BookOpen,
  CheckCircle2,
  CircleDashed,
  MinusCircle,
} from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, cn } from "../../../components/ui/shared.tsx";
import { DoctorPageHeader } from "../../../components/doctor/DoctorPageHeader";
import { doctorPageContainer, doctorSurfaceCard } from "../../../../lib/doctorPortalUi";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import { supabase } from "../../../../lib/supabaseClient";
import {
  buildVitalCards,
  SOURCE_LABEL,
  STATUS_STYLES,
  type VitalReading,
  type VitalCardModel,
} from "../../../../lib/vitalsClinical";
import { isMissingTableError } from "../../../../lib/supabaseTableError";
import {
  buildBpTrendData,
  buildSingleVitalTrend,
  buildVitalsRoster,
  CLINICAL_THRESHOLDS,
  readingsForVitalsPatient,
  timeAgoVitals,
  vitalsHubStats,
  VITAL_METRIC_CHARTS,
  type VitalsTimeRange,
} from "../../../../lib/doctorVitals";
import type { RpmTimeRange } from "../../../../lib/doctorRpm";
import { assessVitalCompleteness } from "../../../../lib/patientVitals";

const CARD_ICONS: Record<string, typeof Heart> = {
  bp: Heart,
  hr: Activity,
  spo2: Wind,
  temp: Thermometer,
  weight: Scale,
  glucose: Droplets,
  resp: Radio,
};

type RosterFilter = "all" | "alerts" | "device" | "baseline";
type PatientTab = "overview" | "trends" | "history";

function VitalMetricCard({ card }: { card: VitalCardModel }) {
  const Icon = CARD_ICONS[card.id] ?? HeartPulse;
  const styles = STATUS_STYLES[card.status];
  const hasTrend = card.sparkline && card.sparkline.length > 1;

  return (
    <Card className={cn(doctorSurfaceCard, "overflow-hidden transition-shadow hover:shadow-md ring-1", styles.ring)}>
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-3 border-b border-emerald-100/60 bg-gradient-to-br from-white to-emerald-50/30 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0A2E1F] text-emerald-100 shadow-lg shadow-emerald-950/20">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
              <p className="text-xl font-black tracking-tight text-[#0A2E1F] truncate">{card.current}</p>
            </div>
          </div>
          <Badge className={cn("shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase", styles.badge)}>
            <span className={cn("mr-1.5 inline-block h-1.5 w-1.5 rounded-full", styles.dot)} />
            {card.statusLabel}
          </Badge>
        </div>
        <div className="px-5 py-3 flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span className="truncate">{SOURCE_LABEL[card.source] || card.source}</span>
          <span>{timeAgoVitals(card.recordedAt)}</span>
        </div>
        {hasTrend && (
          <div className="h-[72px] px-2 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={card.sparkline}>
                <defs>
                  <linearGradient id={`g-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#059669" strokeWidth={2} fill={`url(#g-${card.id})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DoctorVitalsPage() {
  const doctorBase = useDoctorPortalBase();
  const navigate = useNavigate();
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<VitalsTimeRange>("7d");
  const [rosterFilter, setRosterFilter] = useState<RosterFilter>("all");
  const [patientTab, setPatientTab] = useState<PatientTab>("overview");
  const [chartMetric, setChartMetric] = useState<(typeof VITAL_METRIC_CHARTS)[number]["id"]>("bp");
  const [loading, setLoading] = useState(true);
  const [missingTable, setMissingTable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ordersForRoster, setOrdersForRoster] = useState<
    { id: string; user_id: string | null; patient_name: string; patient_vitals: unknown }[]
  >([]);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [readingsRes, ordersRes] = await Promise.all([
        supabase.from("vital_readings").select("*").order("recorded_at", { ascending: false }).limit(1200),
        supabase
          .from("orders")
          .select("id, user_id, patient_name, patient_vitals")
          .order("created_at", { ascending: false })
          .limit(500),
      ]);

      if (readingsRes.error) {
        if (isMissingTableError(readingsRes.error)) {
          setMissingTable(true);
          setReadings([]);
        } else {
          console.warn("[Vitals] readings:", readingsRes.error.message);
        }
      } else {
        setMissingTable(false);
        setReadings((readingsRes.data || []) as VitalReading[]);
      }

      if (!ordersRes.error && ordersRes.data) {
        setOrdersForRoster(ordersRes.data as typeof ordersForRoster);
      }
    } catch (err) {
      console.error("Vitals fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (missingTable) return;
    const ch = supabase
      .channel("doctor-vitals-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "vital_readings" }, fetchAll)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [fetchAll, missingTable]);

  const fullRoster = useMemo(
    () => buildVitalsRoster(readings, ordersForRoster, range),
    [readings, ordersForRoster, range],
  );

  const filteredRoster = useMemo(() => {
    const q = search.trim().toLowerCase();
    return fullRoster.filter((p) => {
      if (rosterFilter === "alerts" && p.flaggedCount === 0) return false;
      if (rosterFilter === "device" && !p.hasDeviceData) return false;
      if (rosterFilter === "baseline" && (!p.intake || p.hasDeviceData)) return false;
      if (!q) return true;
      return p.patient_name.toLowerCase().includes(q);
    });
  }, [fullRoster, search, rosterFilter]);

  const selectedPatient = fullRoster.find((p) => p.key === selectedKey) ?? filteredRoster[0] ?? null;

  useEffect(() => {
    if (selectedPatient && !selectedKey) setSelectedKey(selectedPatient.key);
  }, [selectedPatient, selectedKey]);

  const patientReadings = useMemo(
    () => (selectedPatient ? readingsForVitalsPatient(readings, selectedPatient, range) : []),
    [readings, selectedPatient, range],
  );

  const vitalCards = useMemo(
    () => buildVitalCards(patientReadings, selectedPatient?.intake ?? null),
    [patientReadings, selectedPatient],
  );

  const vitalCompleteness = useMemo(
    () => assessVitalCompleteness(selectedPatient?.intake ?? null, patientReadings),
    [selectedPatient?.intake, patientReadings],
  );

  const missingVitals = vitalCompleteness.filter((v) => v.status === "missing");
  const partialVitals = vitalCompleteness.filter((v) => v.status === "partial");

  const stats = useMemo(() => {
    const abnormal = vitalCards.filter((c) => c.status === "alert" || c.status === "high" || c.status === "low").length;
    return vitalsHubStats(fullRoster, readings, range, abnormal);
  }, [fullRoster, readings, range, vitalCards]);

  const criticalQueue = useMemo(() => {
    const start = range === "all" ? 0 : Date.now() - (range === "24h" ? 1 : range === "7d" ? 7 : 30) * 86400000;
    return readings
      .filter((r) => r.flagged && (start === 0 || new Date(r.recorded_at).getTime() >= start))
      .slice(0, 12);
  }, [readings, range]);

  const bpTrend = useMemo(() => buildBpTrendData(patientReadings, 20), [patientReadings]);

  const chartConfig = VITAL_METRIC_CHARTS.find((c) => c.id === chartMetric)!;
  const singleTrend = useMemo(
    () => (chartMetric !== "bp" ? buildSingleVitalTrend(patientReadings, [...chartConfig.metrics], 28) : []),
    [patientReadings, chartMetric, chartConfig.metrics],
  );

  const historyRows = useMemo(
    () =>
      [...patientReadings]
        .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
        .slice(0, 40)
        .map((r) => ({
          id: r.id,
          vital: r.metric.replace(/_/g, " ").toUpperCase(),
          value: `${r.value}${r.unit ? ` ${r.unit}` : ""}`,
          source: SOURCE_LABEL[r.source || ""] || r.source || "Device",
          flagged: r.flagged,
          at: new Date(r.recorded_at).toLocaleString(),
        })),
    [patientReadings],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className={cn(doctorPageContainer, "space-y-6 pb-16 animate-in fade-in duration-500")}>
      <DoctorPageHeader
        variant="hero"
        eyebrow="Clinical monitoring"
        title="Patient Vitals"
        description="Blood pressure, heart rate, oxygen, glucose, weight, and respiratory metrics — with enrollment baselines, clinical thresholds, and device trends from vital_readings."
      >
        <Button
          variant="outline"
          className="rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/20"
          onClick={fetchAll}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          Refresh
        </Button>
        <Link
          to={`${doctorBase}/rpm`}
          className="inline-flex items-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-4 py-2 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/25"
        >
          <Watch className="h-4 w-4 mr-2" />
          RPM devices
        </Link>
      </DoctorPageHeader>

      {missingTable && (
        <Card className="border-amber-300 bg-amber-50/90">
          <CardContent className="p-4 text-sm text-amber-950">
            <p className="font-bold mb-1">vital_readings table not provisioned</p>
            <p>
              Run{" "}
              <code className="font-mono bg-white px-1.5 py-0.5 rounded text-xs">
                scripts/sql/RUN_IN_SUPABASE_backfill_patient_vitals.sql
              </code>{" "}
              in Supabase SQL Editor. Intake baselines from <code className="font-mono">orders.patient_vitals</code> still show in the roster until device data syncs.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[10px] font-black uppercase text-slate-500 mr-1">Range</span>
        {(["24h", "7d", "30d", "all"] as RpmTimeRange[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-black uppercase border",
              range === r ? "bg-[#0A2E1F] text-white border-[#0A2E1F]" : "bg-white text-slate-600 border-slate-200",
            )}
          >
            {r === "all" ? "All" : r}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "On chart", value: stats.monitored, icon: HeartPulse },
          { label: "Device data", value: stats.withDeviceData, icon: Watch },
          { label: "Intake baseline only", value: stats.intakeOnly, icon: BookOpen },
          { label: "Flagged in range", value: stats.critical, icon: AlertTriangle },
          { label: "Readings in range", value: stats.readingsInRange, icon: TrendingUp },
        ].map((s) => (
          <Card key={s.label} className={doctorSurfaceCard}>
            <CardContent className="flex items-center gap-3 p-4">
              <s.icon className="h-5 w-5 text-emerald-700 shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500">{s.label}</p>
                <p className="text-xl font-black text-[#0A2E1F]">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className={cn(doctorSurfaceCard, "lg:col-span-3")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-[#0A2E1F]">Patients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="pl-9 rounded-xl border-emerald-100"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "alerts", label: "Flagged" },
                  { id: "device", label: "Device" },
                  { id: "baseline", label: "Baseline" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setRosterFilter(f.id)}
                  className={cn(
                    "rounded-lg px-2 py-1 text-[9px] font-black uppercase border",
                    rosterFilter === f.id ? "bg-[#0A2E1F] text-white" : "bg-white text-slate-500 border-slate-200",
                  )}
                >
                  <Filter className="h-2.5 w-2.5 inline mr-0.5 opacity-60" />
                  {f.label}
                </button>
              ))}
            </div>
            <div className="max-h-[400px] space-y-1 overflow-y-auto custom-scrollbar pr-1">
              {filteredRoster.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500">No patients match.</p>
              ) : (
                filteredRoster.map((p) => {
                  const active = p.key === selectedKey;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setSelectedKey(p.key)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2.5 text-left transition-all",
                        active ? "border-[#0A2E1F] bg-[#0A2E1F] text-white shadow-md" : "border-slate-100 bg-white hover:border-emerald-200",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold truncate">{p.patient_name}</span>
                        {p.flaggedCount > 0 && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />}
                      </div>
                      <p className={cn("text-[10px] mt-0.5", active ? "text-emerald-200" : "text-slate-500")}>
                        {p.hasDeviceData ? `${p.readingCount} readings` : "Intake baseline"}
                        {p.intake?.bmi ? ` · BMI ${p.intake.bmi}` : ""}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-6 space-y-4">
          {selectedPatient ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-[#0A2E1F]">{selectedPatient.patient_name}</h2>
                  <p className="text-xs text-slate-500 font-semibold">
                    {patientReadings.length} readings in range · Last {timeAgoVitals(selectedPatient.lastReadingAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedPatient.order_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs font-bold"
                      onClick={() => navigate(`${doctorBase}/patients/${selectedPatient.order_id}`)}
                    >
                      <User className="h-3.5 w-3.5 mr-1" />
                      Chart
                    </Button>
                  )}
                  <Link
                    to={`${doctorBase}/rpm`}
                    className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-emerald-50"
                  >
                    <Radio className="h-3.5 w-3.5 mr-1" />
                    RPM
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: "overview", label: "Overview" },
                    { id: "trends", label: "Trends" },
                    { id: "history", label: "History" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPatientTab(t.id)}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-black uppercase border",
                      patientTab === t.id ? "bg-[#0A2E1F] text-white" : "bg-white text-slate-600 border-slate-200",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {patientTab === "overview" && (
                <>
                  {(missingVitals.length > 0 || partialVitals.length > 0) && (
                    <Card className={cn(doctorSurfaceCard, "border-amber-200/80 bg-amber-50/30")}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black text-[#0A2E1F] flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          Vitals completeness
                        </CardTitle>
                        <p className="text-xs text-slate-600 font-medium mt-1">
                          {missingVitals.length > 0
                            ? `${missingVitals.length} not captured — patient can add at enrollment or you can request a reading.`
                            : "Some metrics have intake only; device trends will appear after sync."}
                        </p>
                      </CardHeader>
                      <CardContent className="grid gap-2 sm:grid-cols-2">
                        {vitalCompleteness.map((item) => {
                          const Icon =
                            item.status === "complete"
                              ? CheckCircle2
                              : item.status === "partial"
                                ? CircleDashed
                                : MinusCircle;
                          const tone =
                            item.status === "complete"
                              ? "border-emerald-200 bg-emerald-50/50 text-emerald-900"
                              : item.status === "partial"
                                ? "border-amber-200 bg-amber-50/60 text-amber-950"
                                : "border-slate-200 bg-white text-slate-600";
                          return (
                            <div key={item.key} className={cn("rounded-xl border px-3 py-2.5 flex gap-2.5", tone)}>
                              <Icon
                                className={cn(
                                  "h-4 w-4 shrink-0 mt-0.5",
                                  item.status === "complete"
                                    ? "text-emerald-600"
                                    : item.status === "partial"
                                      ? "text-amber-600"
                                      : "text-slate-400",
                                )}
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-black">{item.label}</p>
                                <p className="text-[10px] font-semibold opacity-80 mt-0.5">{item.detail}</p>
                                <p className="text-[9px] mt-1 font-bold uppercase tracking-wide opacity-60">
                                  {item.hasIntake ? "Intake" : "—"} · {item.hasReadings ? "Readings" : "—"}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    {vitalCards.map((card) => (
                      <VitalMetricCard key={card.id} card={card} />
                    ))}
                  </div>
                  <Card className={doctorSurfaceCard}>
                    <CardHeader>
                      <CardTitle className="text-sm font-black text-[#0A2E1F]">Vitals summary table</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-[10px] font-black uppercase text-slate-500 border-b border-emerald-100">
                            <th className="pb-2 pr-3">Vital</th>
                            <th className="pb-2 pr-3">Value</th>
                            <th className="pb-2 pr-3">Status</th>
                            <th className="pb-2">Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vitalCards.map((row) => {
                            const st = STATUS_STYLES[row.status];
                            return (
                              <tr key={row.id} className="border-b border-slate-50">
                                <td className="py-2.5 font-bold text-[#0A2E1F]">{row.label}</td>
                                <td className="py-2.5 font-mono font-semibold">{row.current}</td>
                                <td className="py-2.5">
                                  <Badge className={cn("text-[9px] font-black border", st.badge)}>{row.statusLabel}</Badge>
                                </td>
                                <td className="py-2.5 text-xs text-slate-500">{timeAgoVitals(row.recordedAt)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </>
              )}

              {patientTab === "trends" && (
                <Card className={doctorSurfaceCard}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-black text-[#0A2E1F]">Metric trends</CardTitle>
                    <select
                      value={chartMetric}
                      onChange={(e) => setChartMetric(e.target.value as typeof chartMetric)}
                      className="text-xs border rounded-lg px-2 py-1 bg-white"
                    >
                      {VITAL_METRIC_CHARTS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </CardHeader>
                  <CardContent>
                    {chartMetric === "bp" ? (
                      bpTrend.length === 0 ? (
                        <p className="text-sm text-slate-500 py-16 text-center">No BP data in range.</p>
                      ) : (
                        <div className="h-[260px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={bpTrend}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} domain={["dataMin - 8", "dataMax + 8"]} />
                              <Tooltip />
                              <Line type="monotone" dataKey="sys" name="Systolic" stroke="#ef4444" strokeWidth={2} dot={false} />
                              <Line type="monotone" dataKey="dia" name="Diastolic" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )
                    ) : singleTrend.length === 0 ? (
                      <p className="text-sm text-slate-500 py-16 text-center">No data for this metric.</p>
                    ) : (
                      <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={singleTrend}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Area type="monotone" dataKey="value" stroke="#059669" fill="#10b98133" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {patientTab === "history" && (
                <Card className={doctorSurfaceCard}>
                  <CardHeader>
                    <CardTitle className="text-sm font-black text-[#0A2E1F]">Full reading history</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[420px] overflow-y-auto custom-scrollbar space-y-2">
                    {historyRows.length === 0 ? (
                      <p className="text-sm text-slate-500 py-8 text-center">No device readings — intake baseline only.</p>
                    ) : (
                      historyRows.map((h) => (
                        <div
                          key={h.id}
                          className={cn(
                            "flex justify-between rounded-xl border px-3 py-2 text-xs",
                            h.flagged ? "border-red-200 bg-red-50" : "border-slate-100 bg-slate-50/60",
                          )}
                        >
                          <div>
                            <span className="font-black">{h.vital}</span>
                            <span className="mx-2 text-slate-300">·</span>
                            <span className="font-mono font-bold">{h.value}</span>
                            <p className="text-[10px] text-slate-500 mt-0.5">{h.source}</p>
                          </div>
                          <span className="text-slate-500 shrink-0 ml-2">{h.at}</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              )}

              {selectedPatient.intake && patientTab === "overview" && (
                <Card className={cn(doctorSurfaceCard, "border-dashed border-emerald-200")}>
                  <CardHeader>
                    <CardTitle className="text-[10px] font-black uppercase text-emerald-800">Enrollment baseline</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    {selectedPatient.intake.height && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">Height</p>
                        <p className="font-bold">{selectedPatient.intake.height}</p>
                      </div>
                    )}
                    {selectedPatient.intake.weight && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">Weight</p>
                        <p className="font-bold">{selectedPatient.intake.weight}</p>
                      </div>
                    )}
                    {selectedPatient.intake.bmi && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">BMI</p>
                        <p className="font-bold">{selectedPatient.intake.bmi}</p>
                      </div>
                    )}
                    {selectedPatient.intake.bp_sys != null && selectedPatient.intake.bp_dia != null && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">Blood pressure</p>
                        <p className="font-bold font-mono">
                          {selectedPatient.intake.bp_sys}/{selectedPatient.intake.bp_dia}
                        </p>
                      </div>
                    )}
                    {selectedPatient.intake.hr != null && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">Heart rate</p>
                        <p className="font-bold">{selectedPatient.intake.hr} bpm</p>
                      </div>
                    )}
                    {selectedPatient.intake.spo2 != null && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">SpO₂</p>
                        <p className="font-bold">{selectedPatient.intake.spo2}%</p>
                      </div>
                    )}
                    {selectedPatient.intake.temp_f != null && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">Temperature</p>
                        <p className="font-bold">{selectedPatient.intake.temp_f}°F</p>
                      </div>
                    )}
                    {selectedPatient.intake.glucose != null && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">Glucose</p>
                        <p className="font-bold">{selectedPatient.intake.glucose} mg/dL</p>
                      </div>
                    )}
                    {selectedPatient.intake.resp_rate != null && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">Respiratory</p>
                        <p className="font-bold">{selectedPatient.intake.resp_rate} /min</p>
                      </div>
                    )}
                    {selectedPatient.intake.allergies && (
                      <div className="col-span-2">
                        <p className="text-[10px] text-slate-500 uppercase">Allergies</p>
                        <p className="font-semibold text-red-800">{selectedPatient.intake.allergies}</p>
                      </div>
                    )}
                    {selectedPatient.intake.currentMeds && (
                      <div className="col-span-2">
                        <p className="text-[10px] text-slate-500 uppercase">Current meds</p>
                        <p className="font-semibold">{selectedPatient.intake.currentMeds}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className={doctorSurfaceCard}>
              <CardContent className="py-20 text-center">
                <HeartPulse className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
                <p className="font-bold text-[#0A2E1F]">Select a patient</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3 space-y-4">
          <Card className={doctorSurfaceCard}>
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase text-[#0A2E1F] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Critical alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[280px] overflow-y-auto custom-scrollbar space-y-2">
              {criticalQueue.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No flagged readings.</p>
              ) : (
                criticalQueue.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedKey(r.patient_id || r.patient_name || "unknown")}
                    className="w-full text-left rounded-xl border border-red-200 bg-red-50 p-3 hover:shadow-sm"
                  >
                    <p className="font-bold text-xs text-red-900">{r.patient_name}</p>
                    <p className="font-mono text-sm font-black text-red-600">
                      {r.value}
                      {r.unit ? ` ${r.unit}` : ""}
                    </p>
                    <p className="text-[10px] text-slate-500">{timeAgoVitals(r.recorded_at)}</p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card className={doctorSurfaceCard}>
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase text-slate-600">Clinical thresholds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar">
              {CLINICAL_THRESHOLDS.map((row) => (
                <div key={row.metric} className="rounded-lg border border-slate-100 p-2.5 text-[10px]">
                  <p className="font-black text-[#0A2E1F] mb-1">{row.metric}</p>
                  <p className="text-slate-600">
                    <span className="text-emerald-700 font-semibold">Normal:</span> {row.normal}
                  </p>
                  {"elevated" in row && (
                    <p className="text-slate-600">
                      <span className="text-amber-700 font-semibold">Elevated:</span> {row.elevated}
                    </p>
                  )}
                  {"high" in row && (
                    <p className="text-slate-600">
                      <span className="text-red-700 font-semibold">High:</span> {row.high}
                    </p>
                  )}
                  {"alert" in row && (
                    <p className="text-slate-600">
                      <span className="text-red-700 font-semibold">Alert:</span> {row.alert}
                    </p>
                  )}
                  {"low" in row && (
                    <p className="text-slate-600">
                      <span className="text-sky-700 font-semibold">Low:</span> {row.low}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

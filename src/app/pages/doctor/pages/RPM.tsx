import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  HeartPulse,
  Activity,
  AlertTriangle,
  Watch,
  Smartphone,
  RefreshCw,
  Loader2,
  Search,
  Radio,
  Wind,
  Droplets,
  Thermometer,
  Scale,
  ChevronRight,
  Stethoscope,
  Heart,
  TrendingUp,
  Wifi,
  WifiOff,
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
import { isMissingTableError } from "../../../../lib/supabaseTableError";
import {
  buildVitalCards,
  STATUS_STYLES,
  type VitalReading,
} from "../../../../lib/vitalsClinical";
import { filterClinicalPatientOrders } from "../../../../lib/clinicalTestData";
import {
  buildBpTrend,
  buildRpmRoster,
  buildSingleMetricTrend,
  computeRpmStats,
  CONNECTIVITY_STYLES,
  deviceSourceBreakdown,
  METRIC_LABEL,
  readingRowStatus,
  readingsForPatient,
  RPM_METRIC_OPTIONS,
  sourceDisplay,
  timeAgo,
  type RpmPatient,
  type RpmTimeRange,
} from "../../../../lib/doctorRpm";

const CARD_ICONS: Record<string, typeof Heart> = {
  bp: Heart,
  hr: Activity,
  spo2: Wind,
  glucose: Droplets,
  temp: Thermometer,
  weight: Scale,
  resp: Radio,
};

export function DoctorRPMPage() {
  const doctorBase = useDoctorPortalBase();
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const [orders, setOrders] = useState<{ id: string; user_id: string | null; patient_name: string; patient_vitals: unknown }[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<RpmTimeRange>("24h");
  const [chartMetric, setChartMetric] = useState<(typeof RPM_METRIC_OPTIONS)[number]["id"]>("bp");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missingTable, setMissingTable] = useState(false);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [readingsRes, ordersRes] = await Promise.all([
        supabase.from("vital_readings").select("*").order("recorded_at", { ascending: false }).limit(1200),
        supabase
          .from("orders")
          .select("id, user_id, patient_name, patient_vitals")
          .order("created_at", { ascending: false })
          .limit(400),
      ]);

      if (readingsRes.error) {
        if (isMissingTableError(readingsRes.error)) {
          setMissingTable(true);
          setReadings([]);
        } else {
          console.warn("[RPM] readings:", readingsRes.error.message);
        }
      } else {
        setMissingTable(false);
        setReadings((readingsRes.data || []) as VitalReading[]);
      }

      if (!ordersRes.error) {
        const rows = filterClinicalPatientOrders(ordersRes.data || []);
        setOrders(
          rows.map((o) => ({
            id: o.id,
            user_id: o.user_id,
            patient_name: o.patient_name,
            patient_vitals: o.patient_vitals,
          })),
        );
      }
    } catch (err) {
      console.error("RPM fetch error:", err);
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
      .channel("rpm-vitals-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "vital_readings" }, fetchAll)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [fetchAll, missingTable]);

  const roster = useMemo(() => buildRpmRoster(readings, orders, range), [readings, orders, range]);
  const stats = useMemo(() => computeRpmStats(roster, readings, range), [roster, readings, range]);
  const sources = useMemo(() => deviceSourceBreakdown(readings, range), [readings, range]);

  const filteredRoster = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter((p) => p.patient_name.toLowerCase().includes(q));
  }, [roster, search]);

  const selected = roster.find((p) => p.key === selectedKey) ?? filteredRoster[0] ?? null;

  useEffect(() => {
    if (selected && !selectedKey) setSelectedKey(selected.key);
  }, [selected, selectedKey]);

  const patientReadings = useMemo(
    () => (selected ? readingsForPatient(readings, selected, range) : []),
    [readings, selected, range],
  );

  const vitalCards = useMemo(
    () => (selected ? buildVitalCards(patientReadings, selected.intake) : []),
    [patientReadings, selected],
  );

  const bpTrend = useMemo(() => buildBpTrend(patientReadings, 18), [patientReadings]);

  const metricTrend = useMemo(() => {
    const opt = RPM_METRIC_OPTIONS.find((m) => m.id === chartMetric);
    if (!opt || chartMetric === "bp") return [];
    return buildSingleMetricTrend(patientReadings, [...opt.metrics], 24);
  }, [patientReadings, chartMetric]);

  const criticalQueue = useMemo(() => {
    const start = range === "all" ? 0 : Date.now() - (range === "24h" ? 1 : range === "7d" ? 7 : 30) * 86400000;
    return readings
      .filter((r) => r.flagged && (start === 0 || new Date(r.recorded_at).getTime() >= start))
      .slice(0, 10);
  }, [readings, range]);

  const liveFeed = useMemo(() => patientReadings.slice(0, 16), [patientReadings]);

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
        eyebrow="Connected devices"
        title="Remote Patient Monitoring"
        description="Live telemetry from BP cuffs, wearables, and health apps — critical thresholds surface in the alert queue for rapid clinical review."
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
          to={`${doctorBase}/vitals`}
          className="inline-flex items-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-4 py-2 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/25"
        >
          <HeartPulse className="h-4 w-4 mr-2" />
          Clinical vitals
        </Link>
      </DoctorPageHeader>

      {missingTable && (
        <Card className="border-amber-300 bg-amber-50/90">
          <CardContent className="p-4 text-sm text-amber-950">
            <p className="font-bold mb-1">RPM telemetry not provisioned</p>
            <p>
              Run{" "}
              <code className="font-mono bg-white px-2 py-0.5 rounded text-xs">supabase_vital_readings.sql</code> or{" "}
              <code className="font-mono bg-white px-2 py-0.5 rounded text-xs">
                scripts/sql/RUN_IN_SUPABASE_backfill_patient_vitals.sql
              </code>{" "}
              in Supabase. Enrollment baselines from <code className="font-mono">orders.patient_vitals</code> still appear in the roster.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-1">Time range</span>
        {(["24h", "7d", "30d", "all"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-black uppercase border transition-colors",
              range === r
                ? "bg-[#0A2E1F] text-white border-[#0A2E1F]"
                : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300",
            )}
          >
            {r === "all" ? "All time" : r}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Patients on RPM", value: stats.monitored, icon: HeartPulse, accent: "text-emerald-700" },
          { label: "Live / recent devices", value: stats.liveDevices, icon: Watch, accent: "text-violet-600" },
          { label: "Critical alerts", value: stats.criticalAlerts, icon: AlertTriangle, accent: "text-red-600" },
          { label: "Stable (no flags)", value: `${stats.stablePct}%`, icon: Activity, accent: "text-emerald-600" },
          { label: "Syncs in range", value: stats.syncs, icon: Smartphone, accent: "text-indigo-600" },
        ].map((s) => (
          <Card key={s.label} className={doctorSurfaceCard}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={cn("rounded-2xl bg-emerald-50 p-3", s.accent)}>
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{s.label}</p>
                <p className="text-2xl font-black text-[#0A2E1F]">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className={cn(doctorSurfaceCard, "lg:col-span-3")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-[#0A2E1F]">RPM roster</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patients…"
                className="pl-9 rounded-xl border-emerald-100"
              />
            </div>
            <div className="max-h-[440px] space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
              {filteredRoster.length === 0 ? (
                <p className="py-10 text-center text-xs text-slate-500">No monitored patients in this range.</p>
              ) : (
                filteredRoster.map((p) => {
                  const active = p.key === selectedKey;
                  const conn = CONNECTIVITY_STYLES[p.connectivity];
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setSelectedKey(p.key)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2.5 text-left transition-all",
                        active
                          ? "border-[#0A2E1F] bg-[#0A2E1F] text-white shadow-md"
                          : "border-slate-100 bg-white hover:border-emerald-200",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold truncate">{p.patient_name}</span>
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", conn.dot)} title={conn.label} />
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span
                          className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded border",
                            active ? "bg-white/15 text-white border-white/20" : conn.badge,
                          )}
                        >
                          {conn.label}
                        </span>
                        {p.alertCountInRange > 0 && (
                          <span className="text-[9px] font-black text-red-500">{p.alertCountInRange} alert</span>
                        )}
                      </div>
                      <p className={cn("text-[10px] mt-0.5 truncate", active ? "text-emerald-200" : "text-slate-500")}>
                        {p.readingsInRange} syncs · {timeAgo(p.lastSyncAt)}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-6 space-y-6">
          {selected ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-[#0A2E1F]">{selected.patient_name}</h2>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    {selected.deviceSources.map(sourceDisplay).join(" · ") || "Awaiting device pairing"}
                    {selected.lastSyncAt && ` · Last sync ${timeAgo(selected.lastSyncAt)}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selected.order_id && (
                    <Link
                      to={`${doctorBase}/consult?orderId=${encodeURIComponent(selected.order_id)}`}
                      className="inline-flex items-center rounded-xl bg-[#0A2E1F] text-white px-3 py-2 text-xs font-bold hover:bg-emerald-900"
                    >
                      <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
                      Case workspace
                    </Link>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {vitalCards.slice(0, 4).map((card) => {
                  const Icon = CARD_ICONS[card.id] ?? Activity;
                  const st = STATUS_STYLES[card.status];
                  return (
                    <Card key={card.id} className={cn(doctorSurfaceCard, "ring-1", st.ring)}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-4 w-4 text-emerald-800" />
                          <p className="text-[10px] font-black uppercase text-slate-500">{card.label}</p>
                        </div>
                        <p className="text-lg font-black text-[#0A2E1F]">{card.current}</p>
                        <Badge className={cn("mt-2 text-[9px] font-black border", st.badge)}>{card.statusLabel}</Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className={doctorSurfaceCard}>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
                  <CardTitle className="text-base font-black text-[#0A2E1F]">Live telemetry</CardTitle>
                  <select
                    value={chartMetric}
                    onChange={(e) => setChartMetric(e.target.value as typeof chartMetric)}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-[#0A0D14]"
                  >
                    {RPM_METRIC_OPTIONS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </CardHeader>
                <CardContent>
                  {chartMetric === "bp" ? (
                    bpTrend.length === 0 ? (
                      <div className="h-[240px] flex flex-col items-center justify-center text-sm text-slate-500">
                        <Heart className="h-8 w-8 mb-2 opacity-30" />
                        No blood pressure telemetry in range.
                      </div>
                    ) : (
                      <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={bpTrend}>
                            <defs>
                              <linearGradient id="rpmSys" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="rpmDia" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} domain={["dataMin - 8", "dataMax + 8"]} />
                            <Tooltip contentStyle={{ borderRadius: 12 }} />
                            <Area type="monotone" dataKey="sys" name="Systolic" stroke="#ef4444" fill="url(#rpmSys)" strokeWidth={2} />
                            <Area type="monotone" dataKey="dia" name="Diastolic" stroke="#3b82f6" fill="url(#rpmDia)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )
                  ) : metricTrend.length === 0 ? (
                    <div className="h-[240px] flex flex-col items-center justify-center text-sm text-slate-500">
                      <TrendingUp className="h-8 w-8 mb-2 opacity-30" />
                      No readings for this metric in range.
                    </div>
                  ) : (
                    <div className="h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metricTrend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                          <Tooltip contentStyle={{ borderRadius: 12 }} />
                          <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className={doctorSurfaceCard}>
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-[#0A2E1F]">
                    Device sync stream
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {liveFeed.length === 0 ? (
                    <p className="text-sm text-slate-500 py-6 text-center">No device syncs in selected range.</p>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                      {liveFeed.map((r) => {
                        const st = STATUS_STYLES[readingRowStatus(r)];
                        return (
                          <div
                            key={r.id}
                            className={cn(
                              "flex items-center justify-between rounded-xl border px-3 py-2 text-xs",
                              r.flagged ? "border-red-200 bg-red-50/90" : "border-slate-100 bg-slate-50/60",
                            )}
                          >
                            <div className="min-w-0">
                              <span className="font-black text-[#0A2E1F]">{METRIC_LABEL[r.metric] || r.metric}</span>
                              <span className="mx-2 text-slate-300">·</span>
                              <span className="font-mono font-bold">
                                {r.value}
                                {r.unit ? ` ${r.unit}` : ""}
                              </span>
                              <p className="text-[10px] text-slate-500 mt-0.5 truncate">{sourceDisplay(r.source)}</p>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <Badge className={cn("text-[8px] font-black border mb-1", st.badge)}>
                                {r.flagged ? "Flagged" : "OK"}
                              </Badge>
                              <p className="text-[10px] text-slate-500">{timeAgo(r.recorded_at)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className={doctorSurfaceCard}>
              <CardContent className="py-20 text-center">
                <Radio className="mx-auto h-12 w-12 text-emerald-300 mb-4" />
                <p className="font-bold text-[#0A2E1F]">Select a patient to monitor</p>
                <p className="text-sm text-slate-500 mt-1">Choose from the RPM roster to view live device telemetry.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card className={doctorSurfaceCard}>
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-[#0A2E1F] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Critical alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {criticalQueue.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500">
                  <Wifi className="h-7 w-7 mx-auto mb-2 text-emerald-400 opacity-60" />
                  No flagged readings in range.
                </div>
              ) : (
                <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar">
                  {criticalQueue.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedKey(r.patient_id || r.patient_name || "unknown")}
                      className="w-full text-left rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-bold text-sm text-red-900">{r.patient_name || "Unknown"}</p>
                        <span className="text-[10px] text-slate-500 shrink-0">{timeAgo(r.recorded_at)}</span>
                      </div>
                      <p className="text-xs font-semibold text-red-700 mt-0.5">{METRIC_LABEL[r.metric] || r.metric}</p>
                      <p className="font-mono text-base font-black text-red-600 mt-1">
                        {r.value}
                        {r.unit ? ` ${r.unit}` : ""}
                      </p>
                      <span className="text-[10px] font-bold text-red-600 mt-2 inline-flex items-center">
                        Review patient <ChevronRight className="h-3 w-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={doctorSurfaceCard}>
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-[#0A2E1F]">
                Device sources ({stats.sourceCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sources.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  <WifiOff className="h-7 w-7 mx-auto mb-2 opacity-30" />
                  No device sources in range.
                </div>
              ) : (
                <div className="space-y-2">
                  {sources.map((s) => (
                    <div
                      key={s.source}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2"
                    >
                      <span className="text-xs font-bold text-[#0A2E1F]">{s.label}</span>
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-black">
                        {s.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selected?.intake && (
            <Card className={cn(doctorSurfaceCard, "border-dashed border-emerald-200")}>
              <CardHeader>
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
                  Enrollment baseline
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                {selected.intake.weight && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Weight</p>
                    <p className="font-bold text-[#0A2E1F]">{selected.intake.weight}</p>
                  </div>
                )}
                {selected.intake.bmi && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">BMI</p>
                    <p className="font-bold text-[#0A2E1F]">{selected.intake.bmi}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

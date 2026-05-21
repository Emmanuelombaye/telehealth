import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
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
  parseIntakeVitals,
  SOURCE_LABEL,
  STATUS_STYLES,
  type VitalReading,
  type VitalCardModel,
} from "../../../../lib/vitalsClinical";
import { isMissingTableError } from "../../../../lib/supabaseTableError";

type PatientOption = {
  key: string;
  patient_id: string | null;
  patient_name: string;
  intake: ReturnType<typeof parseIntakeVitals>;
};

const CARD_ICONS: Record<string, typeof Heart> = {
  bp: Heart,
  hr: Activity,
  spo2: Wind,
  temp: Thermometer,
  weight: Scale,
  glucose: Droplets,
  resp: Radio,
};

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

function VitalMetricCard({ card }: { card: VitalCardModel }) {
  const Icon = CARD_ICONS[card.id] ?? HeartPulse;
  const styles = STATUS_STYLES[card.status];
  const hasTrend = card.sparkline && card.sparkline.length > 1;

  return (
    <Card
      className={cn(
        doctorSurfaceCard,
        "overflow-hidden transition-shadow hover:shadow-md ring-1",
        styles.ring,
      )}
    >
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
          <Badge className={cn("shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider", styles.badge)}>
            <span className={cn("mr-1.5 inline-block h-1.5 w-1.5 rounded-full", styles.dot)} />
            {card.statusLabel}
          </Badge>
        </div>
        <div className="px-5 py-3 flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span className="truncate" title={card.source}>
            {SOURCE_LABEL[card.source] || card.source}
          </span>
          <span>{timeAgo(card.recordedAt)}</span>
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
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [missingTable, setMissingTable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [readingsRes, ordersRes] = await Promise.all([
        supabase
          .from("vital_readings")
          .select("*")
          .order("recorded_at", { ascending: false })
          .limit(800),
        supabase
          .from("orders")
          .select("user_id, patient_name, patient_vitals, created_at")
          .not("patient_vitals", "is", null)
          .order("created_at", { ascending: false })
          .limit(300),
      ]);

      let rows: VitalReading[] = [];
      if (readingsRes.error) {
        if (isMissingTableError(readingsRes.error)) {
          setMissingTable(true);
          setReadings([]);
        } else if (readingsRes.error.code === "PGRST303" || readingsRes.error.message?.toLowerCase().includes("jwt")) {
          setReadings([]);
        } else {
          console.warn("[Vitals] readings fetch:", readingsRes.error.message);
        }
      } else {
        setMissingTable(false);
        rows = (readingsRes.data || []) as VitalReading[];
        setReadings(rows);
      }

      if (ordersRes.error && !isMissingTableError(ordersRes.error)) {
        console.warn("[Vitals] orders fetch:", ordersRes.error.message);
      }

      const map = new Map<string, PatientOption>();

      for (const r of rows) {
        const key = r.patient_id || r.patient_name || "unknown";
        if (!map.has(key)) {
          map.set(key, {
            key,
            patient_id: r.patient_id,
            patient_name: r.patient_name || "Unknown patient",
            intake: null,
          });
        }
      }

      for (const o of ordersRes.data || []) {
        const key = o.user_id || o.patient_name || "unknown";
        if (!map.has(key)) {
          map.set(key, {
            key,
            patient_id: o.user_id ?? null,
            patient_name: o.patient_name || "Unknown patient",
            intake: parseIntakeVitals(o.patient_vitals),
          });
        } else {
          const existing = map.get(key)!;
          if (!existing.intake) existing.intake = parseIntakeVitals(o.patient_vitals);
        }
      }

      const list = Array.from(map.values()).sort((a, b) =>
        a.patient_name.localeCompare(b.patient_name),
      );
      setPatients(list);
      setSelectedKey((prev) => (prev && list.some((p) => p.key === prev) ? prev : list[0]?.key ?? null));
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

  const selectedPatient = patients.find((p) => p.key === selectedKey) ?? null;

  const patientReadings = useMemo(() => {
    if (!selectedPatient) return [];
    return readings.filter(
      (r) =>
        (selectedPatient.patient_id && r.patient_id === selectedPatient.patient_id) ||
        (selectedPatient.patient_name && r.patient_name === selectedPatient.patient_name),
    );
  }, [readings, selectedPatient]);

  const vitalCards = useMemo(
    () => buildVitalCards(patientReadings, selectedPatient?.intake ?? null),
    [patientReadings, selectedPatient],
  );

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => p.patient_name.toLowerCase().includes(q));
  }, [patients, search]);

  const stats = useMemo(() => {
    const since24h = Date.now() - 24 * 60 * 60 * 1000;
    const recent = readings.filter((r) => new Date(r.recorded_at).getTime() > since24h);
    const critical = recent.filter((r) => r.flagged).length;
    const monitored = patients.length;
    const abnormalCards = vitalCards.filter((c) => c.status === "alert" || c.status === "high").length;
    return { monitored, critical, readings24h: recent.length, abnormalCards };
  }, [readings, patients, vitalCards]);

  const criticalQueue = useMemo(
    () => readings.filter((r) => r.flagged).slice(0, 8),
    [readings],
  );

  const bpTrend = useMemo(() => {
    const slice = patientReadings
      .filter((r) => r.metric === "bp_sys" || r.metric === "bp_dia")
      .slice()
      .reverse();
    const buckets: Record<string, { time: string; sys?: number; dia?: number }> = {};
    for (const r of slice) {
      const t = new Date(r.recorded_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
      buckets[t] ||= { time: t };
      if (r.metric === "bp_sys") buckets[t].sys = Number(r.value);
      else buckets[t].dia = Number(r.value);
    }
    return Object.values(buckets).slice(-16);
  }, [patientReadings]);

  const historyRows = useMemo(() => {
    return patientReadings.slice(0, 12).map((r) => ({
      id: r.id,
      vital: r.metric.replace(/_/g, " ").toUpperCase(),
      value: `${r.value}${r.unit ? ` ${r.unit}` : ""}`,
      source: SOURCE_LABEL[r.source || ""] || r.source || "Device",
      flagged: r.flagged,
      at: new Date(r.recorded_at).toLocaleString(),
    }));
  }, [patientReadings]);

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
        description="Real-time and historical health metrics — blood pressure, heart rate, oxygen, glucose, weight, and intake baselines. Abnormal readings surface as clinical alerts."
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
          className="inline-flex items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-4 py-2 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/25 transition-colors"
        >
          <Watch className="h-4 w-4 mr-2" />
          RPM devices
        </Link>
      </DoctorPageHeader>

      {missingTable && (
        <Card className="border-amber-300 bg-amber-50/90">
          <CardContent className="p-4 text-sm text-amber-950">
            <p className="font-bold mb-1">Device telemetry table not provisioned</p>
            <p>
              Run <code className="font-mono bg-white px-2 py-0.5 rounded text-xs">scripts/sql/RUN_IN_SUPABASE_backfill_patient_vitals.sql</code> in the Supabase SQL Editor (creates <code className="font-mono">vital_readings</code> and seeds data). Enrollment vitals from <code className="font-mono">orders.patient_vitals</code> still appear below until then.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Patients monitored", value: stats.monitored, icon: HeartPulse, accent: "text-emerald-600" },
          { label: "Critical alerts (24h)", value: stats.critical, icon: AlertTriangle, accent: "text-red-600" },
          { label: "Readings (24h)", value: stats.readings24h, icon: TrendingUp, accent: "text-violet-600" },
          { label: "Abnormal (selected)", value: stats.abnormalCards, icon: Activity, accent: "text-amber-600" },
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
            <CardTitle className="text-sm font-black uppercase tracking-widest text-[#0A2E1F]">Patients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roster..."
                className="pl-9 rounded-xl border-emerald-100"
              />
            </div>
            <div className="max-h-[420px] space-y-1 overflow-y-auto custom-scrollbar pr-1">
              {filteredPatients.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500">No patients with vitals yet.</p>
              ) : (
                filteredPatients.map((p) => {
                  const active = p.key === selectedKey;
                  const hasAlert = readings.some(
                    (r) =>
                      r.flagged &&
                      ((p.patient_id && r.patient_id === p.patient_id) || r.patient_name === p.patient_name),
                  );
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setSelectedKey(p.key)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2.5 text-left transition-all",
                        active
                          ? "border-[#0A2E1F] bg-[#0A2E1F] text-white shadow-md"
                          : "border-slate-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/50",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold truncate">{p.patient_name}</span>
                        {hasAlert && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-red-500 animate-pulse" />
                        )}
                      </div>
                      {p.intake?.bmi && (
                        <p className={cn("text-[10px] mt-0.5 font-semibold", active ? "text-emerald-200" : "text-slate-500")}>
                          Intake BMI {p.intake.bmi}
                        </p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-9 space-y-6">
          {selectedPatient ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-[#0A2E1F]">{selectedPatient.patient_name}</h2>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    {selectedPatient.intake?.sex && `${selectedPatient.intake.sex} · `}
                    {selectedPatient.intake?.height && `H ${selectedPatient.intake.height} · `}
                    {patientReadings.length} device readings on chart
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {vitalCards.map((card) => (
                  <VitalMetricCard key={card.id} card={card} />
                ))}
              </div>

              <Card className={doctorSurfaceCard}>
                <CardHeader>
                  <CardTitle className="text-base font-black text-[#0A2E1F]">Current vitals summary</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-emerald-100 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <th className="pb-3 pr-4">Vital</th>
                        <th className="pb-3 pr-4">Current</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3 pr-4">Source</th>
                        <th className="pb-3">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vitalCards.map((row) => {
                        const st = STATUS_STYLES[row.status];
                        return (
                          <tr key={row.id} className="border-b border-slate-50 last:border-0">
                            <td className="py-3 pr-4 font-bold text-[#0A2E1F]">{row.label}</td>
                            <td className="py-3 pr-4 font-mono font-semibold">{row.current}</td>
                            <td className="py-3 pr-4">
                              <Badge className={cn("rounded-md border text-[10px] font-black uppercase", st.badge)}>
                                {row.statusLabel}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4 text-slate-600 text-xs">{SOURCE_LABEL[row.source] || row.source}</td>
                            <td className="py-3 text-slate-500 text-xs">{timeAgo(row.recordedAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <div className="grid gap-6 xl:grid-cols-2">
                <Card className={doctorSurfaceCard}>
                  <CardHeader>
                    <CardTitle className="text-base font-black text-[#0A2E1F]">Blood pressure trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bpTrend.length === 0 ? (
                      <div className="flex h-[220px] flex-col items-center justify-center text-sm text-slate-500">
                        <Heart className="mb-2 h-8 w-8 opacity-30" />
                        No BP history for this patient yet.
                      </div>
                    ) : (
                      <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={bpTrend}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} domain={["dataMin - 8", "dataMax + 8"]} />
                            <Tooltip contentStyle={{ borderRadius: 12 }} />
                            <Line type="monotone" dataKey="sys" name="Systolic" stroke="#ef4444" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="dia" name="Diastolic" stroke="#3b82f6" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className={doctorSurfaceCard}>
                  <CardHeader>
                    <CardTitle className="text-base font-black text-[#0A2E1F]">Recent readings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {historyRows.length === 0 ? (
                      <p className="text-sm text-slate-500 py-8 text-center">No device readings — showing intake baseline only.</p>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                        {historyRows.map((h) => (
                          <div
                            key={h.id}
                            className={cn(
                              "flex items-center justify-between rounded-xl border px-3 py-2 text-xs",
                              h.flagged ? "border-red-200 bg-red-50/80" : "border-slate-100 bg-slate-50/50",
                            )}
                          >
                            <div>
                              <span className="font-black text-[#0A2E1F]">{h.vital}</span>
                              <span className="mx-2 text-slate-300">·</span>
                              <span className="font-mono font-bold">{h.value}</span>
                            </div>
                            <span className="text-slate-500">{h.at}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {selectedPatient.intake && (
                <Card className={cn(doctorSurfaceCard, "border-dashed border-emerald-200/80")}>
                  <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-800">
                      Enrollment intake baseline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-sm">
                    {selectedPatient.intake.height && (
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-500">Height</p>
                        <p className="font-bold text-[#0A2E1F]">{selectedPatient.intake.height}</p>
                      </div>
                    )}
                    {selectedPatient.intake.weight && (
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-500">Weight</p>
                        <p className="font-bold text-[#0A2E1F]">{selectedPatient.intake.weight}</p>
                      </div>
                    )}
                    {selectedPatient.intake.bmi && (
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-500">BMI</p>
                        <p className="font-bold text-[#0A2E1F]">{selectedPatient.intake.bmi}</p>
                      </div>
                    )}
                    {selectedPatient.intake.allergies && (
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-bold uppercase text-slate-500">Allergies</p>
                        <p className="font-semibold text-slate-700">{selectedPatient.intake.allergies}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className={doctorSurfaceCard}>
              <CardContent className="py-20 text-center">
                <HeartPulse className="mx-auto h-12 w-12 text-emerald-300 mb-4" />
                <p className="font-bold text-[#0A2E1F]">Select a patient to view vitals</p>
                <p className="text-sm text-slate-500 mt-1">Choose from the roster or connect RPM devices.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card className={doctorSurfaceCard}>
        <CardHeader>
          <CardTitle className="text-base font-black text-[#0A2E1F] flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Platform-wide critical alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {criticalQueue.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No flagged readings in the last sync.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {criticalQueue.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    const key = r.patient_id || r.patient_name || "unknown";
                    setSelectedKey(key);
                  }}
                  className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-4 text-left hover:shadow-md transition-shadow"
                >
                  <p className="font-bold text-sm text-red-900">{r.patient_name || "Unknown"}</p>
                  <p className="text-xs font-semibold text-red-700 mt-1 uppercase">{r.metric.replace(/_/g, " ")}</p>
                  <p className="font-mono text-lg font-black text-red-600 mt-2">
                    {r.value}
                    {r.unit ? ` ${r.unit}` : ""}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-2">{timeAgo(r.recorded_at)}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

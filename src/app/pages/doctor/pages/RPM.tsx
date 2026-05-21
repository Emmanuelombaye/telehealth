import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  HeartPulse,
  Activity,
  AlertTriangle,
  Watch,
  RefreshCw,
  Loader2,
  Search,
  Stethoscope,
  LayoutGrid,
  List,
  Users,
  Wifi,
  WifiOff,
  Brain,
  Video,
  ChevronUp,
  ChevronDown,
  Bell,
  CheckCircle2,
  UserPlus,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, cn } from "../../../components/ui/shared.tsx";
import { DoctorPageHeader } from "../../../components/doctor/DoctorPageHeader";
import { doctorPageContainer, doctorSurfaceCard } from "../../../../lib/doctorPortalUi";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import { supabase } from "../../../../lib/supabaseClient";
import { isMissingTableError } from "../../../../lib/supabaseTableError";
import { type VitalReading } from "../../../../lib/vitalsClinical";
import { filterClinicalPatientOrders } from "../../../../lib/clinicalTestData";
import {
  buildRpmRoster,
  CONNECTIVITY_STYLES,
  readingsForPatient,
  timeAgo,
  type RpmTimeRange,
} from "../../../../lib/doctorRpm";
import {
  ALERT_TIER_STYLES,
  buildAlertsEngine,
  buildDeviceFleet,
  buildLiveMonitoringRows,
  buildPatientTimeline,
  computeCommandStats,
  loadAcknowledgedAlerts,
  saveAcknowledgedAlerts,
  sortLiveRows,
  SEVERITY_STYLES,
  RISK_STYLES,
  type RpmAlert,
  type RpmLiveRow,
  type RpmOrderRow,
  RPM_METRIC_OPTIONS,
} from "../../../../lib/rpmCommandCenter";
import { RpmPatientDrawer } from "../../../components/doctor/rpm/RpmPatientDrawer";

const PAGE_SIZE = 12;

export function DoctorRPMPage() {
  const doctorBase = useDoctorPortalBase();
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const [orders, setOrders] = useState<RpmOrderRow[]>([]);
  const [drawerKey, setDrawerKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<RpmTimeRange>("24h");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [sortKey, setSortKey] = useState("severity");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [alertFilter, setAlertFilter] = useState<"all" | "critical" | "warning" | "info">("all");
  const [acked, setAcked] = useState<Set<string>>(() => loadAcknowledgedAlerts());
  const [chartMetric, setChartMetric] = useState<(typeof RPM_METRIC_OPTIONS)[number]["id"]>("bp");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missingTable, setMissingTable] = useState(false);
  const [livePulse, setLivePulse] = useState(false);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [readingsRes, ordersRes] = await Promise.all([
        supabase.from("vital_readings").select("*").order("recorded_at", { ascending: false }).limit(1200),
        supabase
          .from("orders")
          .select("id, user_id, patient_name, patient_vitals, medication, category, intake_answers, zoom_status, status")
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
        setLivePulse(true);
        setTimeout(() => setLivePulse(false), 1200);
      }

      if (!ordersRes.error) {
        const rows = filterClinicalPatientOrders(ordersRes.data || []);
        setOrders(
          rows.map((o) => ({
            id: o.id,
            user_id: o.user_id,
            patient_name: o.patient_name,
            patient_vitals: o.patient_vitals,
            medication: (o as { medication?: string }).medication,
            category: (o as { category?: string }).category,
            intake_answers: (o as { intake_answers?: Record<string, unknown> }).intake_answers,
            zoom_status: (o as { zoom_status?: string }).zoom_status,
            status: (o as { status?: string }).status,
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
      .channel("rpm-command-center")
      .on("postgres_changes", { event: "*", schema: "public", table: "vital_readings" }, fetchAll)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [fetchAll, missingTable]);

  const roster = useMemo(() => buildRpmRoster(readings, orders, range), [readings, orders, range]);
  const stats = useMemo(() => computeCommandStats(roster, readings, orders, range), [roster, readings, orders, range]);
  const liveRows = useMemo(() => buildLiveMonitoringRows(roster, readings, range), [roster, readings, range]);
  const allAlerts = useMemo(() => buildAlertsEngine(roster, readings, range), [roster, readings, range]);
  const deviceFleet = useMemo(() => buildDeviceFleet(readings, range), [readings, range]);

  const visibleAlerts = useMemo(() => {
    return allAlerts.filter((a) => {
      if (acked.has(a.id)) return false;
      if (alertFilter !== "all" && a.tier !== alertFilter) return false;
      return true;
    });
  }, [allAlerts, acked, alertFilter]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = liveRows;
    if (q) rows = rows.filter((r) => r.patient.patient_name.toLowerCase().includes(q));
    return sortLiveRows(rows, sortKey, sortDir);
  }, [liveRows, search, sortKey, sortDir]);

  const pageRows = filteredRows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  const drawerRow = drawerKey ? liveRows.find((r) => r.patient.key === drawerKey) ?? null : null;
  const drawerOrder = drawerRow?.patient.order_id
    ? orders.find((o) => o.id === drawerRow.patient.order_id) ?? null
    : drawerRow?.patient.patient_id
      ? orders.find((o) => o.user_id === drawerRow.patient.patient_id) ?? null
      : null;

  const drawerReadings = useMemo(
    () => (drawerRow ? readingsForPatient(readings, drawerRow.patient, range) : []),
    [drawerRow, readings, range],
  );

  const drawerTimeline = useMemo(
    () => (drawerRow ? buildPatientTimeline(drawerRow.patient, drawerReadings, allAlerts) : []),
    [drawerRow, drawerReadings, allAlerts],
  );

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const acknowledgeAlert = (id: string) => {
    setAcked((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveAcknowledgedAlerts(next);
      return next;
    });
    toast.success("Alert acknowledged");
  };

  const escalateAlert = (alert: RpmAlert) => {
    toast.warning(`Escalation logged: ${alert.patientName}`, {
      description: alert.detail,
    });
    setDrawerKey(alert.patientKey);
  };

  const SortIcon = ({ col }: { col: string }) =>
    sortKey === col ? (
      sortDir === "asc" ? (
        <ChevronUp className="h-3 w-3 inline ml-0.5" />
      ) : (
        <ChevronDown className="h-3 w-3 inline ml-0.5" />
      )
    ) : null;

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const kpiCards = [
    { label: "Active RPM patients", value: stats.activePatients, icon: Users, accent: "text-emerald-700", pulse: false },
    { label: "Critical alerts", value: stats.criticalAlerts, icon: AlertTriangle, accent: "text-red-600", pulse: stats.criticalAlerts > 0 },
    { label: "Devices connected", value: stats.devicesConnected, icon: Watch, accent: "text-violet-600", pulse: false },
    { label: "Avg compliance", value: `${stats.avgCompliance}%`, icon: Activity, accent: "text-sky-600", pulse: false },
    { label: "High-risk (AI)", value: stats.highRiskPatients, icon: Brain, accent: "text-orange-600", pulse: stats.highRiskPatients > 0 },
    { label: "Live consultations", value: stats.liveConsultations, icon: Video, accent: "text-indigo-600", pulse: false },
  ];

  return (
    <div className={cn(doctorPageContainer, "space-y-6 pb-16 animate-in fade-in duration-500")}>
      <DoctorPageHeader
        variant="hero"
        eyebrow="Clinical command center"
        title="RPM live monitoring"
        description="Hospital-grade remote monitoring — real-time vitals, AI risk scoring, alert workflows, and device fleet status wired from your database."
      >
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold",
            livePulse ? "border-emerald-400 bg-emerald-500/20 text-white" : "border-white/20 bg-white/10 text-emerald-100",
          )}
        >
          <span className={cn("h-2 w-2 rounded-full bg-emerald-400", livePulse && "animate-ping")} />
          Live feed
        </span>
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
              <code className="font-mono bg-white px-2 py-0.5 rounded text-xs">supabase_vital_readings.sql</code> in
              Supabase. Enrollment baselines from orders still populate the roster.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-1">Time range</span>
          {(["24h", "7d", "30d", "all"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRange(r);
                setPage(0);
              }}
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
        <div className="flex rounded-xl border border-slate-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1.5",
              viewMode === "table" ? "bg-[#0A2E1F] text-white" : "text-slate-600",
            )}
          >
            <List className="h-3.5 w-3.5" />
            Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1.5",
              viewMode === "grid" ? "bg-[#0A2E1F] text-white" : "text-slate-600",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Multi-monitor
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {kpiCards.map((s) => (
          <Card
            key={s.label}
            className={cn(
              doctorSurfaceCard,
              "backdrop-blur-sm bg-white/95 shadow-sm hover:shadow-md transition-shadow",
              s.pulse && "ring-1 ring-red-200",
            )}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("rounded-2xl bg-emerald-50/90 p-2.5", s.accent)}>
                <s.icon className={cn("h-5 w-5", s.pulse && "animate-pulse")} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">{s.label}</p>
                <p className="text-xl font-black text-[#0A2E1F]">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8 space-y-4">
          <Card className={cn(doctorSurfaceCard, "overflow-hidden")}>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white pb-4">
              <div>
                <CardTitle className="text-base font-black text-[#0A2E1F] flex items-center gap-2">
                  <Radio className="h-5 w-5 text-emerald-700" />
                  Live patient monitoring
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  {filteredRows.length} patients · {stats.syncsInRange} syncs in range · {stats.stablePct}% stable
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Search patients…"
                  className="pl-9 rounded-xl border-emerald-100"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {viewMode === "table" ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                          <th className="px-4 py-3">
                            <button type="button" onClick={() => toggleSort("patient")} className="hover:text-[#0A2E1F]">
                              Patient <SortIcon col="patient" />
                            </button>
                          </th>
                          <th className="px-3 py-3">HR</th>
                          <th className="px-3 py-3">BP</th>
                          <th className="px-3 py-3">SpO₂</th>
                          <th className="px-3 py-3">Glucose</th>
                          <th className="px-3 py-3">
                            <button type="button" onClick={() => toggleSort("severity")} className="hover:text-[#0A2E1F]">
                              Status <SortIcon col="severity" />
                            </button>
                          </th>
                          <th className="px-3 py-3">Device</th>
                          <th className="px-3 py-3">
                            <button type="button" onClick={() => toggleSort("risk")} className="hover:text-[#0A2E1F]">
                              AI risk <SortIcon col="risk" />
                            </button>
                          </th>
                          <th className="px-3 py-3">
                            <button type="button" onClick={() => toggleSort("last")} className="hover:text-[#0A2E1F]">
                              Last <SortIcon col="last" />
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageRows.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-4 py-16 text-center text-slate-500 text-sm">
                              No patients match this filter.
                            </td>
                          </tr>
                        ) : (
                          pageRows.map((row) => {
                            const conn = CONNECTIVITY_STYLES[row.patient.connectivity];
                            return (
                              <tr
                                key={row.patient.key}
                                className={cn(
                                  "border-b border-slate-50 hover:bg-emerald-50/30 cursor-pointer transition-colors border-l-4",
                                  SEVERITY_STYLES[row.severity].row,
                                )}
                                onClick={() => setDrawerKey(row.patient.key)}
                              >
                                <td className="px-4 py-3 font-bold text-[#0A2E1F]">{row.patient.patient_name}</td>
                                <td className="px-3 py-3 font-mono text-xs">{row.heartRate}</td>
                                <td className="px-3 py-3 font-mono text-xs">{row.bloodPressure}</td>
                                <td className="px-3 py-3 font-mono text-xs">{row.oxygen}</td>
                                <td className="px-3 py-3 font-mono text-xs">{row.glucose}</td>
                                <td className="px-3 py-3">
                                  <Badge className={cn("text-[9px] font-black border", SEVERITY_STYLES[row.severity].badge)}>
                                    {row.severityLabel}
                                  </Badge>
                                </td>
                                <td className="px-3 py-3">
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                                    <span className={cn("h-1.5 w-1.5 rounded-full", conn.dot)} />
                                    {row.deviceLabel}
                                  </span>
                                </td>
                                <td className="px-3 py-3">
                                  <Badge className={cn("text-[9px] font-black border", RISK_STYLES[row.risk].badge)}>
                                    {row.riskLabel}
                                  </Badge>
                                </td>
                                <td className="px-3 py-3 text-xs text-slate-500">{row.lastReading}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  {filteredRows.length > PAGE_SIZE && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs">
                      <span className="text-slate-500">
                        Page {page + 1} of {pageCount}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= pageCount - 1}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredRows.slice(0, 12).map((row) => {
                    const conn = CONNECTIVITY_STYLES[row.patient.connectivity];
                    return (
                      <button
                        key={row.patient.key}
                        type="button"
                        onClick={() => setDrawerKey(row.patient.key)}
                        className={cn(
                          "text-left rounded-2xl border-2 p-4 bg-gradient-to-br from-white to-slate-50/80 shadow-sm hover:shadow-lg transition-all",
                          row.severity === "critical"
                            ? "border-red-300 ring-1 ring-red-100"
                            : row.severity === "warning"
                              ? "border-amber-200"
                              : "border-emerald-100",
                        )}
                      >
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <p className="font-black text-[#0A2E1F] truncate">{row.patient.patient_name}</p>
                          <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", conn.dot)} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                          <div>
                            <span className="text-slate-400 block">HR</span>
                            <span className="font-bold">{row.heartRate}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">BP</span>
                            <span className="font-bold">{row.bloodPressure}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">SpO₂</span>
                            <span className="font-bold">{row.oxygen}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Glucose</span>
                            <span className="font-bold">{row.glucose}</span>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1">
                          <Badge className={cn("text-[8px] font-black border", SEVERITY_STYLES[row.severity].badge)}>
                            {row.severityLabel}
                          </Badge>
                          <Badge className={cn("text-[8px] font-black border", RISK_STYLES[row.risk].badge)}>
                            {row.riskLabel}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-4 space-y-4">
          <Card className={doctorSurfaceCard}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-[#0A2E1F] flex items-center gap-2">
                <Bell className="h-4 w-4 text-red-500" />
                Alerts center
                {visibleAlerts.length > 0 && (
                  <Badge className="bg-red-600 text-white border-0 text-[10px]">{visibleAlerts.length}</Badge>
                )}
              </CardTitle>
              <div className="flex flex-wrap gap-1 mt-2">
                {(["all", "critical", "warning", "info"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setAlertFilter(f)}
                    className={cn(
                      "rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase border",
                      alertFilter === f ? "bg-[#0A2E1F] text-white border-[#0A2E1F]" : "bg-white text-slate-600 border-slate-200",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {visibleAlerts.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  <Wifi className="h-8 w-8 mx-auto mb-2 text-emerald-400 opacity-60" />
                  No open alerts in this range.
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                  {visibleAlerts.slice(0, 20).map((a) => (
                    <div key={a.id} className={cn("rounded-xl border p-3 text-xs", ALERT_TIER_STYLES[a.tier])}>
                      <div className="flex justify-between gap-2">
                        <p className="font-bold text-[#0A2E1F]">{a.patientName}</p>
                        <span className="text-[10px] text-slate-500 shrink-0">{timeAgo(a.recordedAt)}</span>
                      </div>
                      <p className="font-semibold text-slate-800 mt-0.5">{a.title}</p>
                      <p className="text-slate-600 mt-0.5">{a.detail}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[10px] font-bold"
                          onClick={() => acknowledgeAlert(a.id)}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Ack
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[10px] font-bold text-red-700"
                          onClick={() => escalateAlert(a)}
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Escalate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[10px] font-bold"
                          onClick={() => setDrawerKey(a.patientKey)}
                        >
                          <Stethoscope className="h-3 w-3 mr-1" />
                          Open
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={doctorSurfaceCard}>
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-[#0A2E1F]">
                Device fleet
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deviceFleet.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  <WifiOff className="h-7 w-7 mx-auto mb-2 opacity-30" />
                  No device syncs in range.
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar">
                  {deviceFleet.map((d) => (
                    <div
                      key={d.source}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/90 px-3 py-2.5 backdrop-blur-sm"
                    >
                      <div>
                        <p className="text-xs font-bold text-[#0A2E1F]">{d.label}</p>
                        <p className="text-[10px] text-slate-500">
                          {d.patientCount} patients · {d.syncCount} syncs
                          {d.lastSync && ` · ${timeAgo(d.lastSync)}`}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          "text-[9px] font-black border",
                          d.status === "online"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : d.status === "idle"
                              ? "bg-amber-100 text-amber-900 border-amber-200"
                              : "bg-slate-100 text-slate-600 border-slate-200",
                        )}
                      >
                        {d.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={cn(doctorSurfaceCard, "border-dashed border-emerald-200/80 bg-emerald-50/30")}>
            <CardContent className="p-4 text-xs text-emerald-900">
              <p className="font-bold flex items-center gap-2 mb-1">
                <UserPlus className="h-4 w-4" />
                Escalation workflow
              </p>
              <p>
                Critical vitals (SpO₂ &lt; 85%, BP &gt; 180) surface as critical alerts. Use Escalate to log outreach and
                open the patient monitor. Acknowledged alerts are stored locally for this workstation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <RpmPatientDrawer
        open={!!drawerKey}
        onClose={() => setDrawerKey(null)}
        row={drawerRow}
        order={drawerOrder}
        patientReadings={drawerReadings}
        alerts={allAlerts}
        timeline={drawerTimeline}
        doctorBase={doctorBase}
        range={range}
        chartMetric={chartMetric}
        onChartMetric={setChartMetric}
        onEscalate={() => {
          if (drawerRow) {
            toast.warning(`Emergency escalation: ${drawerRow.patient.patient_name}`, {
              description: "Clinical team notified via workflow log.",
            });
          }
        }}
      />
    </div>
  );
}

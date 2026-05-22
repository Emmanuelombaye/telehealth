import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Video,
  ClipboardCheck,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Download,
  Sparkles,
  HeartPulse,
  FlaskConical,
  FileText,
  Pill,
  ChevronRight,
  Activity,
  Target,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { DoctorPageHeader } from "../../../components/doctor/DoctorPageHeader";
import { doctorPageContainer, doctorSurfaceCard, doctorInsetCard } from "../../../../lib/doctorPortalUi";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import { supabase } from "../../../../lib/supabaseClient";
import { usePatientStore } from "../../../../lib";
import { isMissingTableError } from "../../../../lib/supabaseTableError";
import {
  buildPhysicianAnalytics,
  exportAnalyticsPdf,
  RANGE_LABELS,
  rangeStart,
  type AnalyticsRange,
  type SupplementalMetrics,
} from "../../../../lib/doctorAnalytics";
import { toast } from "sonner";

const RANGES: AnalyticsRange[] = ["7D", "30D", "90D", "YTD"];

const PIE_COLORS = ["#0A2E1F", "#10b981", "#0d9488", "#D4AF37", "#6366f1", "#f59e0b"];

const EMPTY_SUPPLEMENT: SupplementalMetrics = {
  flaggedVitals: 0,
  labsNew: 0,
  labsPending: 0,
  labsFinal: 0,
  notesAuthored: 0,
  prescriptionsIssued: 0,
  vitalsTableMissing: false,
  labsTableMissing: false,
};

export function DoctorAnalyticsPage() {
  const doctorBase = useDoctorPortalBase();
  const { orders, fetchOrders, subscribeToOrders } = usePatientStore();
  const [range, setRange] = useState<AnalyticsRange>("30D");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [supplement, setSupplement] = useState<SupplementalMetrics>(EMPTY_SUPPLEMENT);

  const fetchSupplemental = useCallback(async () => {
    const start = rangeStart(range).toISOString();
    const next: SupplementalMetrics = { ...EMPTY_SUPPLEMENT };

    const [vitalsRes, labsRes, notesRes, rxRes] = await Promise.all([
      supabase
        .from("vital_readings")
        .select("*", { count: "exact", head: true })
        .eq("flagged", true)
        .gte("recorded_at", start),
      supabase.from("lab_results").select("status, created_at").gte("created_at", start).limit(500),
      supabase.from("visit_summaries").select("*", { count: "exact", head: true }).gte("created_at", start),
      supabase.from("prescriptions").select("*", { count: "exact", head: true }).gte("created_at", start),
    ]);

    if (vitalsRes.error) {
      if (isMissingTableError(vitalsRes.error)) next.vitalsTableMissing = true;
    } else {
      next.flaggedVitals = vitalsRes.count ?? 0;
    }

    if (labsRes.error) {
      if (isMissingTableError(labsRes.error)) next.labsTableMissing = true;
    } else {
      for (const row of labsRes.data || []) {
        const s = (row as { status?: string }).status;
        if (s === "new") next.labsNew += 1;
        else if (s === "pending" || s === "partial") next.labsPending += 1;
        else if (s === "final") next.labsFinal += 1;
      }
    }

    if (!notesRes.error) next.notesAuthored = notesRes.count ?? 0;
    if (!rxRes.error) next.prescriptionsIssued = rxRes.count ?? 0;

    setSupplement(next);
  }, [range]);

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchOrders();
      await fetchSupplemental();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchOrders, fetchSupplemental]);

  useEffect(() => {
    loadAll();
    const unsub = subscribeToOrders();
    const ch = supabase
      .channel("doctor-analytics-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, loadAll)
      .subscribe();
    return () => {
      unsub();
      supabase.removeChannel(ch);
    };
  }, [loadAll, subscribeToOrders]);

  useEffect(() => {
    if (!loading) fetchSupplemental();
  }, [range, fetchSupplemental, loading]);

  const analytics = useMemo(
    () => buildPhysicianAnalytics(orders, range, supplement, doctorBase),
    [orders, range, supplement, doctorBase],
  );

  const handleExport = async () => {
    try {
      await exportAnalyticsPdf(analytics);
      toast.success("Branded insights PDF downloaded.");
    } catch (e) {
      console.error(e);
      toast.error("Could not generate PDF export.");
    }
  };

  if (loading) {
    return (
      <div className={doctorPageContainer}>
        <div className="flex flex-col items-center justify-center py-28">
          <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500 mt-4 font-medium">Computing clinical insights…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(doctorPageContainer, "space-y-6 pb-16 animate-in fade-in duration-500")}>
      <DoctorPageHeader
        variant="hero"
        eyebrow="Performance intelligence"
        title="Analytics & Insights"
        description="Real-time physician KPIs from encounters, queue velocity, RPM vitals, labs, and documentation — tuned for clinical operations, not billing."
      >
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/20 bg-white/10 p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition-colors",
                range === r ? "bg-[#D4AF37] text-[#0A2E1F]" : "text-white/90 hover:bg-white/15",
              )}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          className="rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/20"
          onClick={loadAll}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          Refresh
        </Button>
        <Button
          className="rounded-xl bg-[#D4AF37]/90 text-[#0A2E1F] hover:bg-[#D4AF37] font-bold"
          onClick={handleExport}
        >
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </DoctorPageHeader>

      {(supplement.vitalsTableMissing || supplement.labsTableMissing) && (
        <Card className="border-amber-200 bg-amber-50/90">
          <CardContent className="p-4 text-sm text-amber-950">
            Some data sources are unavailable in Supabase
            {supplement.vitalsTableMissing && " (vital_readings)"}
            {supplement.vitalsTableMissing && supplement.labsTableMissing && " · "}
            {supplement.labsTableMissing && " (lab_results)"}. Encounter metrics still reflect live orders.
          </CardContent>
        </Card>
      )}

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
        <KpiCard
          label="Encounters"
          value={analytics.encounters}
          sub={analytics.periodLabel}
          trend={analytics.encountersTrendPct}
          icon={Activity}
        />
        <KpiCard label="Unique patients" value={analytics.uniquePatients} sub="Distinct in period" icon={Users} />
        <KpiCard
          label="Clearance rate"
          value={`${analytics.clearanceRatePct}%`}
          sub="Rx / shipped / delivered"
          icon={ClipboardCheck}
          positive
        />
        <KpiCard
          label="Avg wait"
          value={`${analytics.avgWaitMins}m`}
          sub={
            analytics.waitTrendMins === 0
              ? "Stable vs prior period"
              : analytics.waitTrendMins > 0
                ? `+${analytics.waitTrendMins}m vs prior`
                : `${analytics.waitTrendMins}m vs prior`
          }
          icon={Clock}
        />
        <KpiCard label="Video rate" value={`${analytics.videoRatePct}%`} sub="Sync / enrollment video" icon={Video} />
        <KpiCard
          label="Queue now"
          value={analytics.pendingQueue}
          sub={`${analytics.urgentCount} urgent in period`}
          icon={AlertTriangle}
          warn={analytics.pendingQueue > 0}
        />
      </div>

      {/* Supplemental clinical row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Critical vitals", value: supplement.flaggedVitals, icon: HeartPulse, to: `${doctorBase}/vitals` },
          { label: "Labs in flight", value: supplement.labsNew + supplement.labsPending, icon: FlaskConical, to: `${doctorBase}/labs` },
          { label: "Clinical notes", value: supplement.notesAuthored, icon: FileText, to: `${doctorBase}/scribe` },
          { label: "Prescriptions", value: supplement.prescriptionsIssued, icon: Pill, to: `${doctorBase}/erx` },
        ].map((item) => (
          <Link key={item.label} to={item.to} className={cn(doctorSurfaceCard, "group hover:shadow-md transition-shadow")}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500">{item.label}</p>
                <p className="text-2xl font-black text-[#0A2E1F] mt-1">{item.value}</p>
              </div>
              <item.icon className="h-8 w-8 text-emerald-600/80 group-hover:scale-110 transition-transform" />
            </CardContent>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Volume chart */}
        <Card className={cn(doctorSurfaceCard, "xl:col-span-2 overflow-hidden")}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-[#0A2E1F] flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  Encounter volume
                </h3>
                <p className="text-sm text-slate-500 mt-1">New cases, clearances, and urgent flags over time</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-black uppercase">
                {analytics.intakeCompletePct}% intake complete
              </Badge>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.volumeSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="encGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="clrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid #d1fae5",
                      boxShadow: "0 16px 40px rgba(10,46,31,0.12)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                  <Area type="monotone" dataKey="encounters" name="Encounters" stroke="#10b981" strokeWidth={3} fill="url(#encGrad)" />
                  <Area type="monotone" dataKey="cleared" name="Cleared" stroke="#D4AF37" strokeWidth={2} fill="url(#clrGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category donut */}
        <Card className={doctorSurfaceCard}>
          <CardContent className="p-6">
            <h3 className="text-lg font-black text-[#0A2E1F] mb-1">Treatment mix</h3>
            <p className="text-sm text-slate-500 mb-4">Category distribution</p>
            {analytics.categoryBreakdown.length === 0 ? (
              <p className="text-sm text-slate-400 py-16 text-center">No category data in range</p>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.categoryBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={88}
                      paddingAngle={3}
                    >
                      {analytics.categoryBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="space-y-2 mt-2">
              {analytics.categoryBreakdown.slice(0, 4).map((c, i) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-semibold text-slate-700">
                    <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {c.name}
                  </span>
                  <span className="font-black text-[#0A2E1F]">{c.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status pipeline */}
        <Card className={doctorSurfaceCard}>
          <CardContent className="p-6">
            <h3 className="text-lg font-black text-[#0A2E1F] mb-1">Care pipeline</h3>
            <p className="text-sm text-slate-500 mb-6">Encounters by fulfillment status in period</p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.statusPipeline} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={120}
                    tick={{ fontSize: 9, fontWeight: 700, fill: "#475569" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {analytics.statusPipeline.map((entry) => (
                      <Cell key={entry.status} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top medications */}
        <Card className={doctorSurfaceCard}>
          <CardContent className="p-6">
            <h3 className="text-lg font-black text-[#0A2E1F] mb-1">Top therapies</h3>
            <p className="text-sm text-slate-500 mb-6">Most prescribed / ordered medications</p>
            <div className="space-y-3">
              {analytics.topMedications.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-12">No medication data</p>
              ) : (
                analytics.topMedications.map((m, i) => {
                  const max = analytics.topMedications[0]?.value || 1;
                  const pct = Math.round((m.value / max) * 100);
                  return (
                    <div key={m.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold text-slate-700 truncate pr-2">{m.name}</span>
                        <span className="font-black text-[#0A2E1F] shrink-0">{m.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: i * 0.05 }}
                          className="h-full rounded-full bg-gradient-to-r from-[#0A2E1F] to-emerald-600"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI-style insights */}
      <Card className={cn(doctorSurfaceCard, "border-emerald-200/60 bg-gradient-to-br from-emerald-50/40 via-white to-cyan-50/30")}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="h-5 w-5 text-[#D4AF37]" />
            <h3 className="text-lg font-black text-[#0A2E1F]">Clinical insights</h3>
            <Badge className="ml-auto text-[9px] font-black uppercase bg-[#0A2E1F] text-white">Actionable</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {analytics.insights.length === 0 ? (
                <p className="text-sm text-slate-500 col-span-2 py-6 text-center">
                  All metrics nominal for this period — no priority alerts generated.
                </p>
              ) : (
                analytics.insights.map((ins, i) => (
                  <motion.div
                    key={ins.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={cn(
                      doctorInsetCard,
                      "p-4 flex flex-col gap-2",
                      ins.severity === "warning" && "border-amber-200 bg-amber-50/50",
                      ins.severity === "success" && "border-emerald-200 bg-emerald-50/40",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {ins.severity === "warning" ? (
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      ) : ins.severity === "success" ? (
                        <Target className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-[#0A2E1F]">{ins.title}</p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ins.body}</p>
                      </div>
                    </div>
                    {ins.actionTo && (
                      <Link
                        to={ins.actionTo}
                        className="text-xs font-bold text-emerald-800 inline-flex items-center gap-1 hover:underline mt-1"
                      >
                        {ins.actionLabel}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        {[
          { to: `${doctorBase}/queue`, label: "Clinical queue" },
          { to: `${doctorBase}/patients`, label: "Patient roster" },
          { to: `${doctorBase}/rpm`, label: "RPM dashboard" },
          { to: `${doctorBase}/notifications`, label: "Alerts hub" },
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-[#0A2E1F] hover:border-emerald-300 shadow-sm"
          >
            {link.label}
            <ChevronRight className="h-3.5 w-3.5 text-emerald-600" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  trend,
  icon: Icon,
  positive,
  warn,
}: {
  label: string;
  value: number | string;
  sub: string;
  trend?: number;
  icon: typeof Activity;
  positive?: boolean;
  warn?: boolean;
}) {
  const trendUp = trend !== undefined && trend > 0;
  const trendDown = trend !== undefined && trend < 0;
  const good = trendUp;
  const bad = trendDown;

  return (
    <Card className={cn(doctorSurfaceCard, warn && "ring-1 ring-amber-200")}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", positive ? "bg-emerald-50" : "bg-slate-50")}>
            <Icon className={cn("h-5 w-5", positive ? "text-emerald-700" : warn ? "text-amber-600" : "text-slate-600")} />
          </div>
          {trend !== undefined && trend !== 0 && (
            <span
              className={cn(
                "flex items-center text-[10px] font-black px-2 py-0.5 rounded-full",
                good && "bg-emerald-100 text-emerald-800",
                bad && "bg-amber-100 text-amber-800",
                !good && !bad && "bg-slate-100 text-slate-600",
              )}
            >
              {trendUp ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <p className="text-2xl font-black text-[#0A2E1F] mt-3">{value}</p>
        <p className="text-[11px] font-bold uppercase text-slate-500 mt-1">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

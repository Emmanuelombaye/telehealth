import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router";
import { motion } from "framer-motion";
import { 
  BarChart3, ArrowUpRight, 
  ShieldCheck, 
  Download, Loader2, Stethoscope, Package, ChevronRight, User, Route, TrendingUp
} from "lucide-react";
import { Card, Badge, Button } from "../../../components/ui/shared.tsx";
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie
} from "recharts";
import { useAuthStore } from "../../../../lib/auth-store";
import { supabase } from "../../../../lib/supabaseClient";
import { ORDERS_ADMIN_NON_CLINICAL_SELECT, applyOrdersBrandScope, resolveAdminBrandScope } from "../../../../lib/adminScope";
import { isAuditPlaceholderOrder } from "../../../../lib/clinicalTestData";
import { useBrand } from "../../../context/BrandContext";
import { cn } from "../../../components/ui/shared.tsx";
import { downloadBrandedScreenshotPdf } from "../../../../lib/brandedExport";
import {
  buildAdminBrandAnalytics,
  buildTreatmentPipelineViews,
  type AdminAnalyticsOrder,
  type AdminTimeRange,
} from "../../../../lib/adminBrandAnalytics";
import { adminPortalBaseFromPath } from "../../../../lib/portalPath";

type AdminOrderRow = AdminAnalyticsOrder & {
  patient_country?: string;
  patientCountry?: string;
};

const CHART = {
  orange: "#E87722",
  gold: "#D4AF37",
  amber: "#F59E0B",
  copper: "#B45309",
  ink: "#0A2E1F",
  muted: "#78716C",
  grid: "#F5F0E8",
};

const PIE = ["#E87722", "#D4AF37", "#F59E0B", "#0A2E1F", "#FB923C", "#B45309", "#78716C"];

export function AdminAnalyticsPage() {
  const location = useLocation();
  const adminBase = adminPortalBaseFromPath(location.pathname);
  const { role, brandId: authBrandId } = useAuthStore();
  const { brand: tenantBrand } = useBrand();
  const brandId = resolveAdminBrandScope(role, authBrandId, tenantBrand.id);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<AdminTimeRange>("30D");
  const [treatmentFilter, setTreatmentFilter] = useState("ALL");
  const [isExporting, setIsExporting] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        let q = supabase
          .from("orders")
          .select(ORDERS_ADMIN_NON_CLINICAL_SELECT)
          .order("created_at", { ascending: false });
        q = applyOrdersBrandScope(q, role, brandId);
        const { data, error } = await q;
        if (error) throw error;
        const rows = (data || [])
          .filter(
            (d) =>
              !isAuditPlaceholderOrder({
                patient_name: d.patient_name,
                order_number: d.order_number,
                medication: d.medication,
              }),
          )
          .map((d) => ({
            orderedDate:
              (d.ordered_date as string) ||
              (d.created_at as string) ||
              "",
            amount: d.amount != null ? String(d.amount) : "",
            status: (d.status as string) || "",
            medication: (d.medication as string) || "",
            category: (d.category as string) || "General",
            patientName: (d.patient_name as string) || "",
            orderNumber: (d.order_number as string) || "",
            patient_country: d.patient_country as string | undefined,
          }));
        setOrders(rows);
      } catch (err) {
        console.error("Analytics orders fetch:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
    const channel = supabase
      .channel("admin-analytics-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadOrders())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [role, brandId]);

  const stats = useMemo(() => buildAdminBrandAnalytics(orders, timeRange), [orders, timeRange]);

  const pipeline = useMemo(
    () => buildTreatmentPipelineViews(orders, timeRange, treatmentFilter),
    [orders, timeRange, treatmentFilter],
  );

  useEffect(() => {
    if (treatmentFilter !== "ALL" && !pipeline.treatmentOptions.includes(treatmentFilter)) {
      setTreatmentFilter("ALL");
    }
  }, [pipeline.treatmentOptions, treatmentFilter]);

  const downloadPDF = async () => {
    if (!terminalRef.current) return;
    setIsExporting(true);
    try {
      const date = new Date().toISOString().split("T")[0];
      await downloadBrandedScreenshotPdf(terminalRef.current, {
        filename: `PeakHealth_Intelligence_${timeRange}_${date}.pdf`,
        title: "Brand Intelligence Report",
        subtitle: `${timeRange} performance · ${date}`,
      });
    } catch (error) {
      console.error("PDF Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-100" />
          <div className="absolute inset-0 rounded-full border-t-2 border-emerald-600 animate-spin" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Syncing Revenue Matrix...</p>
      </div>
    );
  }

  if (!loading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-6 px-6 text-center">
        <BarChart3 className="h-16 w-16 text-slate-200" />
        <div>
          <h2 className="text-2xl font-black text-[#0A2E1F] tracking-tight uppercase italic">No analytics data yet</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-md">
            Orders will appear here once patients complete checkout. Check the Orders page or confirm your brand scope is configured correctly.
          </p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const periodEmpty = orders.length > 0 && stats.periodOrderCount === 0;

  return (
    <div id="analytics-terminal" ref={terminalRef} className="max-w-[1600px] mx-auto space-y-6 sm:space-y-8 pb-8 sm:pb-10 animate-in fade-in duration-700 bg-[#FFFCF7] min-h-full">
      
      {/* HEADER — compact, mobile-first */}
      <div className="flex flex-col gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-amber-100/80 px-3 sm:px-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.35em] px-3 py-1 rounded-lg bg-amber-50 text-[#B45309] border border-amber-200/80">
              Brand analytics
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0A2E1F] tracking-tight mt-2">
              Performance <span className="text-[#E87722]">dashboard</span>
            </h1>
            <p className="text-slate-500 text-xs mt-1">Live orders · treatments · pipeline</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 no-print">
            <div className="flex bg-white p-0.5 rounded-xl border border-amber-100 shadow-sm">
              {(["7D", "30D", "90D", "YTD"] as AdminTimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-3 sm:px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all",
                    timeRange === range
                      ? "bg-[#E87722] text-white shadow-sm"
                      : "text-slate-500 hover:text-[#0A2E1F]",
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
            <Button
              onClick={downloadPDF}
              disabled={isExporting}
              variant="outline"
              className="h-9 px-4 rounded-xl border-amber-200 text-[10px] font-bold uppercase tracking-wide text-slate-600 hover:bg-amber-50 gap-1.5"
            >
              {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              PDF
            </Button>
          </div>
        </div>
      </div>

      {periodEmpty && (
        <div className="mx-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          No orders in the selected <strong>{timeRange}</strong> window. Try <strong>90D</strong> or{" "}
          <strong>YTD</strong> — you have <strong>{orders.length}</strong> total brand order
          {orders.length === 1 ? "" : "s"} on record.
        </div>
      )}

      {/* COMPACT FIGMA-STYLE CHARTS — replaces large KPI tiles */}
      <div className="px-3 sm:px-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Revenue", value: stats.revenue, trend: stats.revenueTrend, dataKey: "revenue" as const, stroke: CHART.orange },
          { label: "Orders", value: stats.patients, trend: stats.patientTrend, dataKey: "revenue" as const, stroke: CHART.gold },
          { label: "Avg order", value: stats.yield, trend: stats.yieldTrend, dataKey: "yield" as const, stroke: CHART.amber },
          { label: "Conversion", value: stats.conversion, trend: stats.conversionTrend, dataKey: "yield" as const, stroke: CHART.copper },
        ].map((m, i) => (
          <Card
            key={m.label}
            className="border border-amber-100/90 shadow-sm rounded-2xl bg-white p-3 sm:p-4 overflow-hidden"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{m.label}</p>
                <p className="text-lg sm:text-xl font-black text-[#0A2E1F] tabular-nums">{m.value}</p>
              </div>
              <span className="text-[9px] font-bold text-[#B45309] bg-amber-50 px-2 py-0.5 rounded-md shrink-0">
                {m.trend}
              </span>
            </div>
            <div className="h-[72px] sm:h-[80px] -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id={`spark-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={m.stroke} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={m.stroke} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey={m.dataKey}
                    stroke={m.stroke}
                    strokeWidth={2}
                    fill={`url(#spark-${i})`}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ))}
      </div>

      {/* Main revenue + category — side by side, compact */}
      <div className="px-3 sm:px-4 grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="lg:col-span-2 border border-amber-100/90 shadow-sm rounded-2xl bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-[#0A2E1F] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#E87722]" />
              Revenue trend
            </h3>
            <span className="text-[9px] font-bold text-slate-400 uppercase">{timeRange}</span>
          </div>
          <div className="h-[160px] sm:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART.orange} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={CHART.orange} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #fde68a", fontSize: 11 }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke={CHART.orange} strokeWidth={2.5} fill="url(#revFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="border border-amber-100/90 shadow-sm rounded-2xl bg-white p-4 sm:p-5">
          <h3 className="text-sm font-black text-[#0A2E1F] mb-1">Category mix</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase mb-3">{timeRange}</p>
          {stats.categoryBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No data</p>
          ) : (
            <>
              <div className="h-[120px] sm:h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={56}
                      paddingAngle={2}
                    >
                      {stats.categoryBreakdown.map((_, idx) => (
                        <Cell key={idx} fill={PIE[idx % PIE.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2 max-h-[72px] overflow-y-auto">
                {stats.categoryBreakdown.slice(0, 4).map((c, idx) => (
                  <div key={c.name} className="flex justify-between text-[10px]">
                    <span className="flex items-center gap-1.5 text-slate-600 truncate">
                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: PIE[idx % PIE.length] }} />
                      {c.name}
                    </span>
                    <span className="font-bold text-[#0A2E1F] shrink-0 ml-2">{c.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* TREATMENT CARE PIPELINE */}
      <div className="px-3 sm:px-4 space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-[#E87722]" />
            <h2 className="text-base sm:text-lg font-black text-[#0A2E1F]">Treatment pipeline</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-print scrollbar-none">
            <button
              type="button"
              onClick={() => setTreatmentFilter("ALL")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap border shrink-0",
                treatmentFilter === "ALL"
                  ? "bg-[#0A2E1F] text-white border-[#0A2E1F]"
                  : "bg-white text-slate-600 border-amber-100",
              )}
            >
              All
            </button>
            {pipeline.treatmentOptions.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setTreatmentFilter(name)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap border shrink-0 max-w-[140px] truncate",
                  treatmentFilter === name
                    ? "bg-[#E87722] text-white border-[#E87722]"
                    : "bg-white text-slate-600 border-amber-100",
                )}
                title={name}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
          <Card className="lg:col-span-8 border border-amber-100/90 shadow-sm rounded-2xl bg-white p-4 sm:p-5 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-black text-[#0A2E1F] flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-[#E87722]" />
                  Fulfillment steps
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Where orders sit in the clinical journey
                </p>
              </div>
              <Badge className="bg-amber-50 text-[#B45309] border-none font-bold text-[9px] uppercase">
                {pipeline.scopedCount} orders
              </Badge>
            </div>

            {pipeline.statusPipeline.length === 0 ? (
              <p className="text-sm text-slate-400 py-16 text-center">No pipeline data for this period</p>
            ) : (
              <>
                <div className="overflow-x-auto pb-2 -mx-2 px-2">
                  <div className="flex items-stretch gap-2 min-w-max">
                    {pipeline.statusPipeline.map((step, i) => (
                      <div key={step.status} className="flex items-center gap-2">
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="w-[132px] rounded-2xl border border-slate-100 bg-slate-50/80 p-4 hover:bg-white hover:shadow-lg transition-all"
                        >
                          <div
                            className="h-1.5 w-full rounded-full mb-3"
                            style={{ background: step.fill }}
                          />
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-tight min-h-[28px]">
                            {step.label}
                          </p>
                          <p className="text-2xl font-black text-[#0A2E1F] mt-2 tabular-nums">{step.count}</p>
                          <p className="text-[8px] font-bold text-slate-400 mt-1 leading-snug line-clamp-2">
                            {step.desc}
                          </p>
                        </motion.div>
                        {i < pipeline.statusPipeline.length - 1 ? (
                          <ChevronRight className="h-4 w-4 text-slate-200 shrink-0" aria-hidden />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-[140px] sm:h-[180px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pipeline.statusPipeline} layout="vertical" margin={{ left: 4, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={118}
                        tick={{ fontSize: 9, fontWeight: 700, fill: "#475569" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value: number, _n: string, item: { payload?: { desc?: string } }) => [
                          `${value} patients`,
                          item.payload?.desc ?? "Orders at this step",
                        ]}
                      />
                      <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                        {pipeline.statusPipeline.map((entry) => (
                          <Cell key={entry.status} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </Card>

          <Card className="lg:col-span-4 border border-amber-200/80 shadow-sm rounded-2xl bg-gradient-to-br from-[#0A2E1F] to-[#1a3d2e] p-4 sm:p-5 text-white">
            <h3 className="text-sm font-black mb-4">Pipeline snapshot</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "In pipeline", val: pipeline.inPipeline },
                { label: "In review", val: pipeline.awaitingReview },
                { label: "Prescribed", val: pipeline.prescribed },
                { label: "Fulfilled", val: pipeline.fulfilled },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-white/10 border border-white/10 px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase text-amber-200/80">{item.label}</p>
                  <p className="text-lg font-black text-[#D4AF37] tabular-nums">{item.val}</p>
                </div>
              ))}
            </div>
            <Link
              to={`${adminBase}/orders`}
              className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase text-[#D4AF37] hover:text-amber-200"
            >
              <Package className="h-4 w-4" />
              Manage orders queue
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        </div>

        <Card className="border border-amber-100/90 shadow-sm rounded-2xl bg-white p-4 sm:p-5 overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="text-sm font-black text-[#0A2E1F]">Patient treatment tracker</h3>
            <Badge className="bg-orange-50 text-[#B45309] border-none font-bold text-[9px] uppercase">
              {pipeline.patientRows.filter((r) => r.needsAttention).length} attention
            </Badge>
          </div>

          {/* Mobile: card list */}
          <div className="md:hidden space-y-3">
            {pipeline.patientRows.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No treatments in period</p>
            ) : (
              pipeline.patientRows.slice(0, 12).map((row) => (
                <div
                  key={row.id}
                  className={cn(
                    "rounded-xl border p-3",
                    row.needsAttention ? "border-amber-200 bg-amber-50/50" : "border-slate-100 bg-slate-50/30",
                  )}
                >
                  <div className="flex justify-between gap-2 mb-2">
                    <p className="font-semibold text-sm text-[#0A2E1F] truncate">{row.patientName}</p>
                    <span className="text-[9px] font-bold text-[#B45309] uppercase shrink-0">{row.statusLabel}</span>
                  </div>
                  <p className="text-xs text-slate-600 truncate">{row.medication}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#E87722] to-[#D4AF37]"
                        style={{ width: `${row.progressPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{row.progressPct}%</span>
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                    <span>{row.orderNumber}</span>
                    <span className="font-bold text-[#0A2E1F]">${row.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="py-3 pr-4">Patient</th>
                  <th className="py-3 pr-4">Order</th>
                  <th className="py-3 pr-4">Treatment</th>
                  <th className="py-3 pr-4">Current step</th>
                  <th className="py-3 pr-4 min-w-[140px]">Progress</th>
                  <th className="py-3 pr-4 text-right">Amount</th>
                  <th className="py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pipeline.patientRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-slate-400 text-xs uppercase font-bold tracking-widest">
                      No patient treatments in this period
                    </td>
                  </tr>
                ) : (
                  pipeline.patientRows.slice(0, 25).map((row) => (
                    <tr
                      key={row.id}
                      className={cn(
                        "border-b border-slate-50 hover:bg-slate-50/80 transition-colors",
                        row.needsAttention && "bg-amber-50/40",
                      )}
                    >
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-[#B45309]" />
                          </div>
                          <span className="font-semibold text-[#0A2E1F]">{row.patientName}</span>
                        </div>
                      </td>
                      <td className="py-4 pr-4 font-mono text-xs text-slate-500">{row.orderNumber}</td>
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-[#0A2E1F] truncate max-w-[200px]">{row.medication}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{row.category}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <span
                          className={cn(
                            "inline-flex px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                            row.needsAttention
                              ? "bg-amber-100 text-amber-900"
                              : row.status === "shipped" || row.status === "delivered"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-700",
                          )}
                        >
                          {row.statusLabel}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#E87722] to-[#D4AF37] transition-all"
                              style={{ width: `${row.progressPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-500 tabular-nums w-8">{row.progressPct}%</span>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-right font-black text-[#0A2E1F]">
                        ${row.amount.toLocaleString()}
                      </td>
                      <td className="py-4 text-right">
                        <Link
                          to={`${adminBase}/orders`}
                          className="text-[10px] font-bold uppercase text-[#E87722] hover:text-[#B45309]"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pipeline.patientRows.length > 25 ? (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 text-center">
              Showing 25 of {pipeline.patientRows.length} — open Orders for the full queue
            </p>
          ) : null}
        </Card>
      </div>

      {/* Product performance + treatment revenue table */}
      <div className="px-3 sm:px-4 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <Card className="border border-amber-100/90 shadow-sm rounded-2xl bg-white p-4 sm:p-5">
          <h3 className="text-sm font-black text-[#0A2E1F] mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#D4AF37]" />
            Top treatments
          </h3>
          {stats.productBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No product data</p>
          ) : (
            <div className="h-[180px] sm:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.productBreakdown} layout="vertical" margin={{ left: 4, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={CHART.grid} />
                  <XAxis type="number" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 8, fill: "#57534e" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number, _n: string, item: { payload?: { revenue?: number } }) => [`${v} · $${(item.payload?.revenue ?? 0).toLocaleString()}`, "Orders"]} />
                  <Bar dataKey="value" fill={CHART.gold} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <Card className="border border-amber-100/90 shadow-sm rounded-2xl bg-white p-4 sm:p-5 overflow-hidden">
          <h3 className="text-sm font-black text-[#0A2E1F] mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#E87722]" />
            Treatment revenue
          </h3>
          <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-amber-100 text-[9px] font-bold uppercase text-slate-500">
                  <th className="py-2 pr-2">Treatment</th>
                  <th className="py-2 pr-2 text-right">Ord</th>
                  <th className="py-2 pr-2 text-right">Rev</th>
                  <th className="py-2 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {stats.topTreatments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">No data</td>
                  </tr>
                ) : (
                  stats.topTreatments.map((t) => (
                    <tr key={t.name} className="border-b border-slate-50">
                      <td className="py-2 pr-2 font-semibold text-[#0A2E1F] truncate max-w-[120px]">{t.name}</td>
                      <td className="py-2 pr-2 text-right font-bold">{t.count}</td>
                      <td className="py-2 pr-2 text-right font-bold">${t.revenue.toLocaleString()}</td>
                      <td className="py-2 text-right text-[#E87722] font-bold">{t.sharePct}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </div>
  );
}

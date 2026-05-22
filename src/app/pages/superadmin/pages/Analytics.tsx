import { useEffect, useState } from "react";
import { Users, TrendingUp, Package, CreditCard, Globe2, Radar, Download, Activity, CheckCircle2 } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { usePatientStore } from "../../../../lib/patient-store";
import { useAuthStore } from "../../../../lib/auth-store";
import { logAdminAudit } from "../../../../lib/adminAudit";
import { motion } from "framer-motion";
import { SuperAdminShell, saPanel } from "../../../components/superadmin/SuperAdminShell.tsx";
import { toast } from "sonner";

const CHART_COLORS = ['#059669', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0A2E1F]/95 p-3 shadow-2xl backdrop-blur-xl">
        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">{label || payload[0].name}</p>
        <p className="text-sm font-black text-white">
          {payload[0].name === "val" ? `${payload[0].value}%` : (typeof payload[0].value === 'number' ? payload[0].value.toLocaleString() : payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function SuperAdminAnalyticsPage() {
  const { orders } = usePatientStore();
  const { user } = useAuthStore();
  const [ready, setReady] = useState(false);
  const [timeRange, setTimeRange] = useState("ALL");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [selectedProduct, setSelectedProduct] = useState("ALL");

  useEffect(() => {
    if (orders) setReady(true);
  }, [orders]);

  // Derived state
  const brandsList = Array.from(new Set(orders.map((o: any) => o.subBrand || o.sub_brand || "Peak Health")));
  const productsList = Array.from(new Set(orders.map((o: any) => o.medication || o.product || "Consultation")));

  const filteredOrders = orders.filter((o: any) => {
    // Time filter
    let timeMatch = true;
    if (timeRange !== "ALL") {
      const now = new Date();
      const orderDate = new Date(o.created_at || new Date());
      const diffMs = now.getTime() - orderDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (timeRange === "1W" && diffDays > 7) timeMatch = false;
      if (timeRange === "3W" && diffDays > 21) timeMatch = false;
      if (timeRange === "1M" && diffDays > 30) timeMatch = false;
      if (timeRange === "3M" && diffDays > 90) timeMatch = false;
      if (timeRange === "YTD" && orderDate.getFullYear() !== now.getFullYear()) timeMatch = false;
    }

    // Brand filter
    let brandMatch = true;
    if (selectedBrand !== "ALL") {
      const b = o.subBrand || o.sub_brand || "Peak Health";
      if (b !== selectedBrand) brandMatch = false;
    }

    // Product filter
    let productMatch = true;
    if (selectedProduct !== "ALL") {
      const p = o.medication || o.product || "Consultation";
      if (p !== selectedProduct) productMatch = false;
    }

    return timeMatch && brandMatch && productMatch;
  });

  const totalMRR = filteredOrders.reduce((sum, o) => {
    const amt = typeof o.amount === "number" ? o.amount : parseFloat(String(o.amount).replace(/[^0-9.-]+/g, "")) || 0;
    return sum + amt;
  }, 0);

  const uniquePatientsCount = new Set(filteredOrders.map((o: any) => o.patient_name)).size;
  const totalOrdersCount = filteredOrders.length;

  const groupedRevenue = filteredOrders.reduce(
    (acc, order: any) => {
      const date = new Date(order.created_at || new Date());
      const month = date.toLocaleString("default", { month: "short" });
      const brand = order.subBrand || order.sub_brand || "Peak Health";
      const amt = typeof order.amount === "number" ? order.amount : parseFloat(String(order.amount).replace(/[^0-9.-]+/g, "")) || 0;

      if (!acc[month]) acc[month] = { month, dateObj: date, total: 0 };
      (acc[month] as any)[brand] = ((acc[month] as any)[brand] || 0) + amt;
      (acc[month] as any).total += amt;
      return acc;
    },
    {} as Record<string, Record<string, number | string | Date>>,
  );

  const platformRevenueData = Object.values(groupedRevenue)
    .sort((a: any, b: any) => (a.dateObj as Date).getTime() - (b.dateObj as Date).getTime())
    .map((item: any) => {
      const { dateObj, ...rest } = item;
      return rest;
    });

  const brands = Array.from(new Set(filteredOrders.map((o: any) => o.subBrand || o.sub_brand || "Peak Health")));
  const brandColors = ["#059669", "#0f766e", "#14b8a6", "#10b981", "#34d399"];

  const geoCounts = filteredOrders.reduce((acc, o: any) => {
    const country = o.patient_country || o.patientCountry || "🇺🇸 United States";
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const geoData = Object.entries(geoCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([country, count]) => ({
      country,
      patients: count,
      pct: Math.round((count / (filteredOrders.length || 1)) * 100)
    }))
    .slice(0, 5);

  if (geoData.length === 0) {
    geoData.push({ country: "🇺🇸 United States", patients: 0, pct: 0 });
  }

  const funnelCounts = {
    submitted: filteredOrders.length,
    inReview: filteredOrders.filter((o: any) => ['medical_review', 'rx_sent', 'shipped', 'delivered'].includes(o.status)).length,
    approved: filteredOrders.filter((o: any) => ['rx_sent', 'shipped', 'delivered'].includes(o.status)).length,
    shipped: filteredOrders.filter((o: any) => ['shipped', 'delivered'].includes(o.status)).length,
    delivered: filteredOrders.filter((o: any) => o.status === 'delivered').length,
  };
  
  const funnelTotal = filteredOrders.length || 1;
  const approvalRate = Math.round((funnelCounts.approved / funnelTotal) * 100) || 0;

  const funnelData = [
    { stage: "Submitted", val: Math.round((funnelCounts.submitted / funnelTotal) * 100), count: funnelCounts.submitted, color: "bg-emerald-500/20" },
    { stage: "Under Review", val: Math.round((funnelCounts.inReview / funnelTotal) * 100), count: funnelCounts.inReview, color: "bg-emerald-500/40" },
    { stage: "Approved", val: Math.round((funnelCounts.approved / funnelTotal) * 100), count: funnelCounts.approved, color: "bg-emerald-500/60" },
    { stage: "Shipped", val: Math.round((funnelCounts.shipped / funnelTotal) * 100), count: funnelCounts.shipped, color: "bg-emerald-500/80" },
    { stage: "Delivered", val: Math.round((funnelCounts.delivered / funnelTotal) * 100), count: funnelCounts.delivered, color: "bg-emerald-400" },
  ];

  const handleExport = async () => {
    const { downloadBrandedReportPdf } = await import("../../../../lib/brandedExport");
    const date = new Date().toISOString().slice(0, 10);
    await logAdminAudit({
      action: "Exported Platform Analytics PDF",
      target_type: "analytics_report",
      detail: { records_included: platformRevenueData.length },
    });
    await downloadBrandedReportPdf({
      filename: `platform-analytics-${date}.pdf`,
      title: "Platform Analytics Report",
      subtitle: `Cross-brand intelligence · ${date}`,
      sections: [
        { kind: "heading", text: "Fulfillment funnel" },
        {
          kind: "table",
          headers: ["Stage", "Count", "% of total"],
          rows: funnelData.map((f) => [f.stage, String(f.count), `${f.val}%`]),
        },
        { kind: "paragraph", text: `Approval rate: ${approvalRate}%` },
        { kind: "heading", text: "Revenue by month" },
        {
          kind: "table",
          headers: ["Month", "Total revenue"],
          rows: platformRevenueData.map((d: { month: string; total: number }) => [
            d.month,
            `$${Number(d.total).toLocaleString()}`,
          ]),
        },
      ],
    });
    toast.success("Branded analytics PDF downloaded.");
  };

  if (!ready) {
    return (
      <SuperAdminShell eyebrow="Analytics" title="Platform Analytics" description="Loading real-time matrix...">
        <div className={cn(saPanel, "h-32 animate-pulse bg-slate-100")} />
      </SuperAdminShell>
    );
  }

  return (
    <SuperAdminShell
      eyebrow="Analytics"
      title="Platform Analytics"
      description="Aggregated platform intelligence derived from live cross-brand ledger."
      actions={
        <Button onClick={handleExport} size="sm" className="h-9 gap-2 rounded-lg bg-[#0A2E1F] hover:bg-emerald-950 px-4 text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all">
          <Download className="h-4 w-4" /> Export PDF
        </Button>
      }
    >
      {/* Figma-based luxury filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200 backdrop-blur-md">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
          {["ALL", "1W", "3W", "1M", "3M", "YTD"].map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                timeRange === t ? "bg-[#0A2E1F] text-emerald-400 shadow-md" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm transition-all cursor-pointer"
        >
          <option value="ALL">ALL BRANDS</option>
          {brandsList.map((b: any) => <option key={b} value={b}>{b}</option>)}
        </select>

        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm transition-all cursor-pointer"
        >
          <option value="ALL">ALL PROTOCOLS</option>
          {productsList.map((p: any) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
        {[
          { label: "Aggregate Revenue", value: `$${totalMRR.toLocaleString()}`, icon: CreditCard, color: "emerald", desc: "Gross platform settlement" },
          { label: "Unique Identities", value: uniquePatientsCount.toLocaleString(), icon: Users, color: "gold", desc: "Total patient reach" },
          { label: "Active Operations", value: totalOrdersCount.toLocaleString(), icon: Package, color: "indigo", desc: "Total platform volume" },
          { label: "Clinical Approval", value: `${approvalRate}%`, icon: CheckCircle2, color: "rose", desc: "Approval conversion rate" },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, ease: "easeOut" }}
          >
            <Card className="group relative overflow-hidden border border-slate-200/50 bg-white/70 backdrop-blur-xl p-5 sm:p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(10,46,31,0.08)] hover:border-emerald-200/60 hover:bg-white rounded-[1.5rem]">
               <div className="flex items-start justify-between mb-6">
                  <div className={cn(
                    "h-10 w-10 sm:h-11 sm:w-11 rounded-[14px] flex items-center justify-center transition-colors duration-300 shadow-sm border border-white/50",
                    s.color === 'emerald' ? "bg-emerald-50/80 text-emerald-600 group-hover:bg-emerald-100" :
                    s.color === 'gold' ? "bg-amber-50/80 text-amber-600 group-hover:bg-amber-100" :
                    s.color === 'indigo' ? "bg-indigo-50/80 text-indigo-600 group-hover:bg-indigo-100" :
                    "bg-rose-50/80 text-rose-600 group-hover:bg-rose-100"
                  )}>
                    <s.icon className="h-5 w-5 sm:h-5 sm:w-5 stroke-[2.5]" />
                  </div>
                  <Badge variant="outline" className="border-slate-200/60 bg-white/50 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:border-emerald-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors shadow-sm">
                     Live
                  </Badge>
               </div>

               <div>
                 <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-slate-400/80 mb-1.5">{s.label}</p>
                 <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A2E1F] leading-none mb-1">{s.value}</h2>
                 <p className="text-[10px] font-semibold text-slate-400/70 uppercase tracking-widest mt-2 group-hover:text-slate-500 transition-colors">
                   {s.desc}
                 </p>
               </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Revenue Chart */}
      <Card className={cn(saPanel, "border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden")}>
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-50 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                 <Activity className="h-4 w-4 text-emerald-500" />
                 <h2 className="text-sm font-black uppercase tracking-widest text-[#0A2E1F]">Revenue Growth Vector</h2>
              </div>
              <p className="text-xs font-medium text-slate-400">Monthly aggregate recurring revenue stacked by brand</p>
            </div>
            <div className="flex flex-wrap gap-2 bg-slate-50 p-1 rounded-2xl">
              {brands.map((b, i) => (
                <span key={b} className="inline-flex items-center gap-2 rounded-xl bg-white shadow-sm px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600">
                  <span className="h-2 w-2 rounded-full shadow-sm" style={{ backgroundColor: brandColors[i % brandColors.length] }} />
                  {b}
                </span>
              ))}
            </div>
          </div>
          <div className="h-[360px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={platformRevenueData.length > 0 ? platformRevenueData : [{ month: "Current", "Peak Health": totalMRR }]}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  {brands.map((brand, i) => (
                    <linearGradient key={`grad-${brand}`} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={brandColors[i % brandColors.length]} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={brandColors[i % brandColors.length]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} dy={10} />
                <YAxis hide />
                <Tooltip
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid #f1f5f9",
                    borderRadius: "16px",
                    boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)",
                    color: "#0f172a",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                  itemStyle={{ fontWeight: 800 }}
                />
                {brands.map((brand, i) => (
                  <Area
                    key={brand}
                    type="monotone"
                    dataKey={brand}
                    stackId="a"
                    stroke={brandColors[i % brandColors.length]}
                    strokeWidth={3}
                    fill={`url(#grad-${i})`}
                    activeDot={{ r: 6, strokeWidth: 0, fill: brandColors[i % brandColors.length] }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Grid for Geo and Funnel using Recharts */}
      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        <Card className={cn(saPanel, "border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white")}>
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-50 pb-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#0A2E1F]">Patient Geography</h2>
              <Globe2 className="h-5 w-5 text-emerald-500" aria-hidden />
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={geoData.length > 0 ? geoData : [{ country: "No Data", patients: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="patients"
                    nameKey="country"
                    stroke="none"
                  >
                    {(geoData.length > 0 ? geoData : [{ country: "No Data", patients: 1 }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(saPanel, "border-none shadow-[0_20px_40px_-10px_rgba(10,46,31,0.2)] bg-[#0A2E1F] text-white relative overflow-hidden")}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/50 to-transparent pointer-events-none" />
          <CardContent className="space-y-6 p-6 sm:p-8 relative z-10">
            <div className="flex items-center justify-between border-b border-emerald-800/50 pb-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-emerald-50">Operational Funnel</h2>
              <Radar className="h-5 w-5 text-emerald-400" aria-hidden />
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={funnelData}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                  barSize={24}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#10b981" strokeOpacity={0.1} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: '#a7f3d0', fontSize: 10, fontWeight: 800 }} width={80} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#064e3b', opacity: 0.4 }} />
                  <Bar dataKey="val" radius={[0, 8, 8, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminShell>
  );
}

import { useEffect, useState } from "react";
import { Users, TrendingUp, Package, CreditCard, Globe2, Radar, Download, Activity, CheckCircle2 } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, linearGradient } from "recharts";
import { usePatientStore } from "../../../../lib/patient-store";
import { motion } from "framer-motion";
import { SuperAdminShell, saPanel } from "../../../components/superadmin/SuperAdminShell.tsx";
import { toast } from "sonner";

export function SuperAdminAnalyticsPage() {
  const { orders } = usePatientStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (orders) setReady(true);
  }, [orders]);

  const totalMRR = orders.reduce((sum, o) => {
    const amt = typeof o.amount === "number" ? o.amount : parseFloat(String(o.amount).replace(/[^0-9.-]+/g, "")) || 0;
    return sum + amt;
  }, 0);

  const uniquePatientsCount = new Set(orders.map((o) => o.patient_name)).size;
  const totalOrdersCount = orders.length;

  // Real data for Area Chart (Aggregate Revenue)
  const groupedRevenue = orders.reduce(
    (acc, order) => {
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

  const brands = Array.from(new Set(orders.map((o) => o.subBrand || o.sub_brand || "Peak Health")));
  const brandColors = ["#059669", "#0f766e", "#14b8a6", "#10b981", "#34d399"];

  // Real data for Geography
  const geoCounts = orders.reduce((acc, o) => {
    const country = o.patient_country || o.patientCountry || "🇺🇸 United States";
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const geoData = Object.entries(geoCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([country, count]) => ({
      country,
      patients: count,
      pct: Math.round((count / (orders.length || 1)) * 100)
    }))
    .slice(0, 5);

  if (geoData.length === 0) {
    geoData.push({ country: "🇺🇸 United States", patients: 0, pct: 0 });
  }

  // Real data for Funnel
  const funnelCounts = {
    submitted: orders.length,
    inReview: orders.filter(o => ['medical_review', 'rx_sent', 'shipped', 'delivered'].includes(o.status)).length,
    approved: orders.filter(o => ['rx_sent', 'shipped', 'delivered'].includes(o.status)).length,
    shipped: orders.filter(o => ['shipped', 'delivered'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };
  
  const funnelTotal = orders.length || 1;
  const approvalRate = Math.round((funnelCounts.approved / funnelTotal) * 100) || 0;

  const funnelData = [
    { stage: "Submitted", val: Math.round((funnelCounts.submitted / funnelTotal) * 100), count: funnelCounts.submitted, color: "bg-emerald-500/20" },
    { stage: "Under Review", val: Math.round((funnelCounts.inReview / funnelTotal) * 100), count: funnelCounts.inReview, color: "bg-emerald-500/40" },
    { stage: "Approved", val: Math.round((funnelCounts.approved / funnelTotal) * 100), count: funnelCounts.approved, color: "bg-emerald-500/60" },
    { stage: "Shipped", val: Math.round((funnelCounts.shipped / funnelTotal) * 100), count: funnelCounts.shipped, color: "bg-emerald-500/80" },
    { stage: "Delivered", val: Math.round((funnelCounts.delivered / funnelTotal) * 100), count: funnelCounts.delivered, color: "bg-emerald-400" },
  ];

  const handleExport = () => {
    toast.success("Export generated", { description: "The analytics report has been downloaded." });
    const rows = ["Month,Total Revenue"];
    platformRevenueData.forEach((d: any) => {
      rows.push(`${d.month},${d.total}`);
    });
    const blob = new Blob([rows.join("\n")], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform-analytics-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
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
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {[
          { label: "Aggregate Revenue", value: `$${totalMRR.toLocaleString()}`, icon: CreditCard, bg: "bg-emerald-50", fg: "text-emerald-700" },
          { label: "Unique Identities", value: uniquePatientsCount.toLocaleString(), icon: Users, bg: "bg-slate-100", fg: "text-slate-800" },
          { label: "Active Operations", value: totalOrdersCount.toLocaleString(), icon: Package, bg: "bg-emerald-50", fg: "text-emerald-800" },
          { label: "Clinical Approval", value: `${approvalRate}%`, icon: CheckCircle2, bg: "bg-[#0A2E1F]/5", fg: "text-[#0A2E1F]" },
        ].map((s, i) => (
          <Card key={i} className={cn(saPanel, "border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white")}>
            <CardContent className="flex flex-col gap-2 p-5 sm:p-6">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", s.bg, s.fg)}>
                <s.icon className="h-5 w-5" />
              </div>
              <p className="text-3xl mt-2 font-black tracking-tighter text-slate-900 leading-none">{s.value}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{s.label}</p>
            </CardContent>
          </Card>
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

      {/* Grid for Geo and Funnel */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={cn(saPanel, "border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white")}>
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-50 pb-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#0A2E1F]">Patient Geography</h2>
              <Globe2 className="h-5 w-5 text-emerald-500" aria-hidden />
            </div>
            <div className="space-y-5">
              {geoData.map((c, i) => (
                <div key={c.country} className="space-y-2 group">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700">{c.country}</span>
                    <span className="tabular-nums font-black tracking-widest text-emerald-700">
                      {c.patients.toLocaleString()} <span className="text-slate-400 font-medium ml-1">({c.pct}%)</span>
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c.pct}%` }}
                      transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 group-hover:from-emerald-300 group-hover:to-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              ))}
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
            <div className="space-y-4">
              {funnelData.map((s, i) => (
                <div key={s.stage} className="flex items-center gap-4 group">
                  <span className="w-28 shrink-0 text-[10px] font-black uppercase tracking-widest text-emerald-100/70 group-hover:text-emerald-50 transition-colors">{s.stage}</span>
                  <div className="relative h-10 flex-1 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 shadow-inner backdrop-blur-sm">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.val}%` }}
                      transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                      className={cn("flex h-full items-center px-3 transition-all", s.color)}
                    >
                      <span className="text-[11px] font-black tracking-widest text-white drop-shadow-md">
                        {s.val}% <span className="opacity-70 ml-1">({s.count})</span>
                      </span>
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminShell>
  );
}

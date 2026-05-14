import { useEffect, useState } from "react";
import { Users, TrendingUp, Package, CreditCard, Globe2, Radar } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { usePatientStore } from "../../../../lib/patient-store";
import { motion } from "framer-motion";
import { SuperAdminShell, saPanel } from "../../../components/superadmin/SuperAdminShell.tsx";

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

  const groupedRevenue = orders.reduce(
    (acc, order) => {
      const date = new Date(order.created_at || new Date());
      const month = date.toLocaleString("default", { month: "short" });
      const brand = order.subBrand || order.sub_brand || "Peak Health";
      const amt = typeof order.amount === "number" ? order.amount : parseFloat(String(order.amount).replace(/[^0-9.-]+/g, "")) || 0;

      if (!acc[month]) acc[month] = { month, dateObj: date };
      (acc[month] as Record<string, number | string | Date>)[brand] =
        ((acc[month] as any)[brand] as number | undefined || 0) + amt;
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
  const brandColors = ["#059669", "#0f766e", "#34d399", "#047857", "#6ee7b7"];

  const geoData = [
    { country: "🇺🇸 United States", patients: Math.floor(uniquePatientsCount * 0.45), pct: 45 },
    { country: "🇬🇧 United Kingdom", patients: Math.floor(uniquePatientsCount * 0.24), pct: 24 },
    { country: "🇦🇪 UAE", patients: Math.floor(uniquePatientsCount * 0.15), pct: 15 },
    { country: "🇧🇷 Brazil", patients: Math.floor(uniquePatientsCount * 0.08), pct: 8 },
    { country: "🌍 Other", patients: Math.floor(uniquePatientsCount * 0.08), pct: 8 },
  ];

  if (!ready) {
    return (
      <SuperAdminShell eyebrow="Analytics" title="Platform analytics" description="Loading store data…">
        <div className={cn(saPanel, "h-32 animate-pulse bg-slate-100")} />
      </SuperAdminShell>
    );
  }

  return (
    <SuperAdminShell
      eyebrow="Analytics"
      title="Platform analytics"
      description="Figures derive from the patient-store order sample available to this session. Geographic split is illustrative until geo fields exist on orders."
      actions={
        <Button size="sm" variant="outline" className="h-9 rounded-lg border-slate-200 text-xs font-medium text-slate-700">
          Export (soon)
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {[
          { label: "Order revenue (sum)", value: `$${totalMRR.toLocaleString()}`, icon: CreditCard, bg: "bg-emerald-50", fg: "text-emerald-700" },
          { label: "Unique patients", value: uniquePatientsCount.toLocaleString(), icon: Users, bg: "bg-slate-100", fg: "text-slate-800" },
          { label: "Orders", value: totalOrdersCount.toLocaleString(), icon: Package, bg: "bg-emerald-50/80", fg: "text-emerald-800" },
          { label: "Demo conversion", value: "38%", icon: TrendingUp, bg: "bg-amber-50", fg: "text-amber-800" },
        ].map((s, i) => (
          <Card key={i} className={saPanel}>
            <CardContent className="flex flex-col gap-2 p-4">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", s.bg, s.fg)}>
                <s.icon className="h-4 w-4" />
              </div>
              <p className="text-xl font-semibold tabular-nums text-slate-900">{s.value}</p>
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className={saPanel}>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Revenue by brand (monthly)</h2>
              <p className="text-xs text-slate-500">Stacked from live order attributes in scope</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {brands.map((b, i) => (
                <span key={b} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: brandColors[i % brandColors.length] }} />
                  {b}
                </span>
              ))}
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  platformRevenueData.length > 0 ? platformRevenueData : [{ month: "Current", "Peak Health": totalMRR }]
                }
                barSize={22}
              >
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                {brands.map((brand, i) => (
                  <Bar
                    key={brand}
                    dataKey={brand}
                    stackId="a"
                    fill={brandColors[i % brandColors.length]}
                    radius={i === brands.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={saPanel}>
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Patient geography (illustrative)</h2>
              <Globe2 className="h-5 w-5 text-slate-400" aria-hidden />
            </div>
            <div className="space-y-4">
              {geoData.map((c, i) => (
                <div key={c.country} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">{c.country}</span>
                    <span className="tabular-nums font-medium text-slate-900">
                      {c.patients.toLocaleString()} · {c.pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c.pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      className="h-full rounded-full bg-emerald-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={cn(saPanel, "border-slate-800 bg-slate-900 text-white")}>
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-emerald-50">Reference funnel (demo)</h2>
              <Radar className="h-5 w-5 text-emerald-400/90" aria-hidden />
            </div>
            <p className="text-xs text-emerald-100/70">Static example stages — replace with product analytics when wired.</p>
            <div className="space-y-3">
              {[
                { stage: "Visit", val: 100, color: "bg-emerald-500/25" },
                { stage: "Intake started", val: 68, color: "bg-emerald-500/40" },
                { stage: "Submitted", val: 52, color: "bg-emerald-500/55" },
                { stage: "Medical review", val: 44, color: "bg-emerald-500/70" },
                { stage: "Paid", val: 38, color: "bg-emerald-400" },
              ].map((s, i) => (
                <div key={s.stage} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-[11px] font-medium text-emerald-100/80">{s.stage}</span>
                  <div className="relative h-9 flex-1 overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.val}%` }}
                      transition={{ duration: 0.8, delay: i * 0.06 }}
                      className={cn("flex h-full items-center px-2", s.color)}
                    >
                      <span className="text-[11px] font-semibold text-slate-900">{s.val}%</span>
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

import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Globe2,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  ShieldCheck,
  Building2,
  Bell,
  Lock,
  Zap,
  Radar,
} from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../components/ui/shared.tsx";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "../../../lib/supabaseClient";
import { ORDERS_ADMIN_NON_CLINICAL_SELECT } from "../../../lib/adminScope";
import { cn } from "../../components/ui/utils";
import { motion } from "framer-motion";
import { AdminScopeNotice } from "../../components/admin/AdminScopeNotice.tsx";

export function SuperAdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(ORDERS_ADMIN_NON_CLINICAL_SELECT)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();

    const channel = supabase
      .channel("schema-db-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalMRR = orders.reduce((sum, order) => {
    const amt =
      typeof order.amount === "number"
        ? order.amount
        : parseFloat(String(order.amount).replace(/[^0-9.-]+/g, "")) || 0;
    return sum + amt;
  }, 0);

  const uniquePatients = new Set(orders.map((o) => o.patient_name)).size;

  const liveBrandRevenueObj = orders.reduce(
    (acc, order) => {
      const brand = order.subBrand || order.sub_brand || "Peak Health";
      const amt =
        typeof order.amount === "number"
          ? order.amount
          : parseFloat(String(order.amount).replace(/[^0-9.-]+/g, "")) || 0;
      if (!acc[brand]) acc[brand] = { name: brand, revenue: 0 };
      acc[brand].revenue += amt;
      return acc;
    },
    {} as Record<string, { name: string; revenue: number }>,
  );

  const liveBrandRevenue = (Object.values(liveBrandRevenueObj) as { name: string; revenue: number }[])
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4);
  const activeBrandsCount = Object.keys(liveBrandRevenueObj).length || 1;

  const liveRevenueData = (
    Object.values(
      orders.reduce(
        (acc, order) => {
          const date = new Date(order.created_at || new Date());
          const monthYear = date.toLocaleString("default", { month: "short", year: "2-digit" });
          const amt =
            typeof order.amount === "number"
              ? order.amount
              : parseFloat(String(order.amount).replace(/[^0-9.-]+/g, "")) || 0;
          if (!acc[monthYear]) acc[monthYear] = { month: monthYear, revenue: 0, dateObj: date };
          acc[monthYear].revenue += amt;
          return acc;
        },
        {} as Record<string, { month: string; revenue: number; dateObj: Date }>,
      ),
    ) as { month: string; revenue: number; dateObj: Date }[]
  )
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
    .map((item) => ({ month: item.month, revenue: item.revenue }));

  const kpis = [
    {
      label: "Platform sales (orders)",
      value: `$${totalMRR.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Active brands",
      value: activeBrandsCount.toString(),
      icon: Building2,
      color: "text-[#0A2E1F]",
      bg: "bg-slate-100",
    },
    {
      label: "Operational patient touchpoints",
      value: uniquePatients.toLocaleString(),
      icon: Users,
      color: "text-emerald-700",
      bg: "bg-emerald-50/80",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 p-4 font-sans text-slate-900 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <AdminScopeNotice variant="platform" />

        {/* Hero — aligned grid, restrained typography */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-br from-white via-emerald-50/30 to-slate-50/80 px-5 py-6 sm:px-8 sm:py-8">
            <div className="grid items-start gap-6 lg:grid-cols-[auto_1fr_auto] lg:gap-10">
              <div className="flex justify-center lg:justify-start">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#0A2E1F] shadow-md ring-1 ring-emerald-500/20 sm:h-20 sm:w-20">
                  <ShieldCheck className="h-8 w-8 text-emerald-400 sm:h-10 sm:w-10" aria-hidden />
                </div>
              </div>

              <div className="min-w-0 space-y-4 text-center lg:text-left">
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:justify-start lg:gap-3">
                  <Badge className="border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-800">
                    Platform super admin
                  </Badge>
                  <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" aria-hidden />
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                    Non-clinical governance only
                  </span>
                </div>

                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight text-[#0A2E1F] sm:text-4xl">
                    Global dashboard
                  </h1>
                  <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 lg:mx-0">
                    Cross-tenant operational snapshot: revenue aggregates, brand footprint, and fulfillment-adjacent
                    metrics. No clinical payloads in this view.
                  </p>
                </div>


              </div>


            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-8 xl:col-span-9">
            <div
              className={cn(
                "grid gap-4 sm:grid-cols-3",
                loading && "opacity-60",
              )}
            >
              {kpis.map((s, i) => (
                <Card
                  key={i}
                  className="border border-slate-200/90 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardContent className="flex flex-col gap-3 p-5 sm:p-6">
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl",
                        s.bg,
                        s.color,
                      )}
                    >
                      <s.icon className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <p className="text-2xl font-bold tabular-nums tracking-tight text-[#0A2E1F] sm:text-3xl">
                        {s.value}
                      </p>
                      <p className="mt-1 text-xs font-medium leading-snug text-slate-500">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border border-slate-200/90 bg-white shadow-sm">
              <CardContent className="space-y-4 p-5 sm:p-6 md:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-[#0A2E1F] sm:text-xl">Revenue by period</h2>
                    <p className="text-xs text-slate-500">
                      All-brand aggregate · non-clinical visibility
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                    <Zap className="h-5 w-5" aria-hidden />
                  </div>
                </div>
                <div className="h-[280px] w-full sm:h-[320px] md:h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={
                        liveRevenueData.length > 0
                          ? liveRevenueData
                          : [{ month: "Current", revenue: totalMRR }]
                      }
                    >
                      <defs>
                        <linearGradient id="execRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0A2E1F",
                          border: "none",
                          borderRadius: "12px",
                          color: "#fff",
                          boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
                          padding: "12px 16px",
                        }}
                        itemStyle={{ color: "#6ee7b7", fontWeight: 600, fontSize: "14px" }}
                        formatter={(v: number) => [`$${(v / 1000).toFixed(1)}k`, "Volume"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#059669"
                        strokeWidth={2}
                        fill="url(#execRev)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-4 xl:col-span-3">
            <Card className="overflow-hidden border border-slate-200/90 bg-gradient-to-br from-[#0A2E1F] to-[#051810] text-white shadow-md">
              <CardContent className="space-y-5 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-emerald-50">Platform pulse</h2>
                  <Radar className="h-5 w-5 shrink-0 text-emerald-400/90" aria-hidden />
                </div>
                <ul className="space-y-2">
                  {[
                    { label: "Edge latency", val: "14 ms" },
                    { label: "Database load", val: "22%" },
                    { label: "Active alerts", val: "0" },
                  ].map((m) => (
                    <li
                      key={m.label}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm"
                    >
                      <span className="text-xs font-medium text-emerald-100/80">{m.label}</span>
                      <span className="font-semibold tabular-nums text-white">{m.val}</span>
                    </li>
                  ))}
                </ul>
                <Button className="h-10 w-full rounded-xl bg-emerald-500 text-sm font-semibold text-[#0A2E1F] hover:bg-emerald-400">
                  System audit
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/90 bg-white shadow-sm">
              <CardContent className="space-y-5 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-[#0A2E1F]">Revenue by brand</h2>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <TrendingUp className="h-4 w-4" aria-hidden />
                  </div>
                </div>
                <div className="space-y-4">
                  {liveBrandRevenue.map((b, i) => (
                    <div key={b.name} className="space-y-2">
                      <div className="flex justify-between gap-2 text-xs font-medium text-slate-600">
                        <span className="min-w-0 truncate">{b.name}</span>
                        <span className="shrink-0 tabular-nums text-[#0A2E1F]">
                          ${(b.revenue / 1000).toFixed(1)}k
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(b.revenue / (totalMRR || 1)) * 100}%` }}
                          transition={{ duration: 1, delay: i * 0.08 }}
                          className="h-full rounded-full bg-emerald-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/superadmin/finance">
                  <Button
                    variant="outline"
                    className="h-10 w-full rounded-xl border-slate-200 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    Open finance
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <footer className="flex flex-col gap-2 border-t border-slate-200/80 pt-6 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium">Peak Health · platform operations</span>
          <span className="tabular-nums">Non-clinical dashboard · {new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
}

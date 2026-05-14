import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  ShieldCheck,
  Building2,
  Bell,
  Lock,
  ChevronRight,
  Radar,
} from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../components/ui/shared.tsx";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "../../../lib/supabaseClient";
import { ORDERS_SUPERADMIN_OVERVIEW_SELECT } from "../../../lib/adminScope";
import { cn } from "../../components/ui/utils";
import { SuperAdminShell, saPanel } from "../../components/superadmin/SuperAdminShell.tsx";

export function SuperAdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(ORDERS_SUPERADMIN_OVERVIEW_SELECT)
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

  if (loading) {
    return (
      <SuperAdminShell eyebrow="Overview" title="Platform dashboard" description="Loading order telemetry…">
        <div className={cn(saPanel, "flex h-48 items-center justify-center text-sm text-slate-500")}>Loading…</div>
      </SuperAdminShell>
    );
  }

  return (
    <SuperAdminShell
      eyebrow="Superadmin"
      title="Platform overview"
      description="Cross-brand revenue, order volume, and quick links to security and finance. Data is sourced from live orders (RLS applies to your session)."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link to="/superadmin/security">
            <Button variant="outline" size="sm" className="h-9 gap-2 rounded-lg border-slate-200 text-slate-700">
              <Lock className="h-4 w-4" />
              Security
            </Button>
          </Link>
          <Link to="/superadmin/notifications">
            <Button variant="outline" size="sm" className="h-9 w-9 rounded-lg border-slate-200 p-0" aria-label="Notifications">
              <Bell className="h-4 w-4 text-slate-600" />
            </Button>
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Order volume (sum)",
            value: `$${totalMRR.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            hint: "From order amounts in scope",
            icon: DollarSign,
            iconBg: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Brands with revenue",
            value: String(activeBrandsCount),
            hint: "Distinct sub-brands in sample",
            icon: Building2,
            iconBg: "bg-slate-100 text-slate-800",
          },
          {
            label: "Patients (unique names)",
            value: uniquePatients.toLocaleString(),
            hint: "Distinct patient_name on orders",
            icon: Users,
            iconBg: "bg-emerald-50/80 text-emerald-800",
          },
        ].map((s, i) => (
          <Card key={i} className={cn(saPanel, "overflow-hidden")}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{s.label}</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">{s.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{s.hint}</p>
                </div>
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", s.iconBg)}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className={cn(saPanel, "lg:col-span-2 overflow-hidden")}>
          <CardContent className="p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Revenue by month</h2>
                <p className="text-xs text-slate-500">Aggregated from orders in your superadmin scope</p>
              </div>
              <Badge variant="outline" className="text-[10px] font-medium text-slate-600">
                Live subscription
              </Badge>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liveRevenueData.length > 0 ? liveRevenueData : [{ month: "Current", revenue: totalMRR }]}>
                  <defs>
                    <linearGradient id="saRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
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
                      backgroundColor: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(v: number | string) => {
                      const n = typeof v === "number" ? v : Number(v);
                      return [`$${n.toLocaleString()}`, "Revenue"];
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} fill="url(#saRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className={cn(saPanel, "overflow-hidden border-emerald-900/20 bg-gradient-to-b from-emerald-950 to-slate-950 text-white")}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-emerald-50">Operations</h2>
                <Radar className="h-4 w-4 text-emerald-400/90" aria-hidden />
              </div>
              <p className="text-xs leading-relaxed text-emerald-100/80">
                Placeholder telemetry for latency and load. Wire Datadog or Supabase metrics here when ready.
              </p>
              <ul className="space-y-2 text-xs text-emerald-50/90">
                <li className="flex justify-between border-b border-white/10 py-2">
                  <span className="text-emerald-200/80">Edge / API</span>
                  <span className="font-medium tabular-nums">—</span>
                </li>
                <li className="flex justify-between border-b border-white/10 py-2">
                  <span className="text-emerald-200/80">Database</span>
                  <span className="font-medium tabular-nums">—</span>
                </li>
                <li className="flex justify-between py-2">
                  <span className="text-emerald-200/80">Alerts</span>
                  <span className="font-medium tabular-nums">0 open</span>
                </li>
              </ul>
              <Link to="/superadmin/audit" className="block">
                <Button className="h-9 w-full rounded-lg bg-emerald-500 text-sm font-medium text-emerald-950 hover:bg-emerald-400">
                  Open audit log
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className={saPanel}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Revenue by brand</h2>
                <Activity className="h-4 w-4 text-slate-400" aria-hidden />
              </div>
              <div className="space-y-3">
                {liveBrandRevenue.length === 0 ? (
                  <p className="text-sm text-slate-500">No brand breakdown yet.</p>
                ) : (
                  liveBrandRevenue.map((b, i) => (
                    <div key={b.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="truncate font-medium text-slate-700">{b.name}</span>
                        <span className="shrink-0 tabular-nums text-slate-900">${b.revenue.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full max-w-full rounded-full bg-emerald-600 transition-[width] duration-700 ease-out"
                          style={{
                            width: `${(b.revenue / (totalMRR || 1)) * 100}%`,
                            transitionDelay: `${Math.min(i, 12) * 60}ms`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Link to="/superadmin/finance">
                <Button variant="outline" className="h-9 w-full rounded-lg border-slate-200 text-sm font-medium text-slate-700">
                  Finance detail
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className={cn(saPanel, "flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-xs text-slate-500")}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden />
          <span>Signed-in as super admin · act only within policy and audit requirements.</span>
        </div>
        <TrendingUp className="hidden h-4 w-4 text-slate-300 sm:block" aria-hidden />
      </div>
    </SuperAdminShell>
  );
}

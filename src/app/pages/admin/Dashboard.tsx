import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import {
  ShoppingCart,
  DollarSign,
  Activity,
  Users,
  Clock,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Search,
  Package,
  BarChart3,
  ArrowUpRight,
  MessageSquare,
  ClipboardList,
  Truck,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../components/ui/shared.tsx";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuthStore } from "../../../lib";
import { supabase } from "../../../lib/supabaseClient";
import { ORDERS_ADMIN_NON_CLINICAL_SELECT, applyOrdersBrandScope } from "../../../lib/adminScope";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function parseAmount(order: any): number {
  if (!order) return 0;
  const raw = order.amount;
  if (typeof raw === "number" && !Number.isNaN(raw)) return raw;
  return parseFloat(String(raw ?? 0).replace(/[^0-9.-]+/g, "")) || 0;
}

function uniquePatientsCount(orders: any[]): number {
  return new Set(orders.map((o) => o?.patient_name).filter(Boolean)).size;
}

const QUICK_LINKS: { to: string; label: string; hint: string; icon: typeof Package }[] = [
  { to: "/admin/orders", label: "Orders", hint: "Queue & fulfillment", icon: ShoppingCart },
  { to: "/admin/patients", label: "Patients", hint: "Roster & profiles", icon: Users },
  { to: "/admin/products", label: "Products", hint: "Catalog & pricing", icon: Package },
  { to: "/admin/analytics", label: "Analytics", hint: "Performance", icon: BarChart3 },
  { to: "/admin/messages", label: "Messages", hint: "Team inbox", icon: MessageSquare },
  { to: "/admin/treatments", label: "Treatments", hint: "Programs", icon: ClipboardList },
];

export function AdminDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const brandId = useAuthStore((state) => state.brandId);
  const adminName = user?.user_metadata?.first_name || "there";

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    async function fetchOrders() {
      try {
        let q = supabase
          .from("orders")
          .select(ORDERS_ADMIN_NON_CLINICAL_SELECT)
          .order("created_at", { ascending: false });
        q = applyOrdersBrandScope(q, role, brandId);
        const { data, error } = await q;
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
      .channel("admin-orders-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role, brandId]);

  const totalRevenue = useMemo(
    () => (orders || []).reduce((sum, order) => sum + parseAmount(order), 0),
    [orders],
  );

  const pendingCount = useMemo(
    () =>
      orders.filter((o) => o?.status === "order_submitted" || o?.status === "medical_review").length,
    [orders],
  );

  const shippedCount = useMemo(() => orders.filter((o) => o?.status === "shipped").length, [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 6), [orders]);

  const chartData = useMemo(() => {
    const byDay = (orders || []).reduce((acc, order) => {
      if (!order?.created_at) return acc;
      const d = new Date(order.created_at);
      if (Number.isNaN(d.getTime())) return acc;
      const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const amt = parseAmount(order);
      acc[date] = (acc[date] || 0) + amt;
      return acc;
    }, {} as Record<string, number>);

    let rows = Object.entries(byDay)
      .map(([date, amount]) => ({ date, amount }))
      .reverse()
      .slice(0, 7)
      .reverse();
    if (rows.length === 0 && totalRevenue > 0) {
      rows = [{ date: "Recent", amount: totalRevenue }];
    }
    if (rows.length === 0) {
      rows = [{ date: "—", amount: 0 }];
    }
    return rows;
  }, [orders, totalRevenue]);

  const orderCount = orders.length;
  const patientsN = uniquePatientsCount(orders);
  const shipRatePct = orderCount ? Math.round((1000 * shippedCount) / orderCount) / 10 : 0;
  const avgOrder = orderCount ? totalRevenue / orderCount : 0;

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQ.trim();
    navigate(q ? `/admin/orders?q=${encodeURIComponent(q)}` : "/admin/orders");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse space-y-8 pb-16 pt-2">
        <div className="h-10 w-48 rounded-lg bg-slate-100" />
        <div className="h-24 max-w-2xl rounded-2xl bg-slate-100" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-100" />
          ))}
        </div>
        <div className="h-80 rounded-2xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl pb-16 pt-1 text-[#0A0D14]">
      {/* Hero */}
      <header className="mb-10 flex flex-col gap-8 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold tracking-wide text-slate-600">
              Brand admin
            </span>
            <span className="hidden text-slate-300 sm:inline">·</span>
            <time className="hidden sm:block" dateTime={new Date().toISOString()}>
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          </div>
          <div className="space-y-2">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-[#0A2E1F] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              {greeting()}, {adminName}
            </h1>
            <p className="max-w-2xl text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
              Operate your Peak Health brand from one place—orders, patients, and revenue stay in sync
              in real time.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="border-0 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
              Live sync
            </Badge>
            {pendingCount > 0 && (
              <Badge className="border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-900">
                {pendingCount} order{pendingCount === 1 ? "" : "s"} need attention
              </Badge>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:shrink-0">
          <form onSubmit={onSearchSubmit} className="relative flex-1 lg:min-w-[280px]">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search orders, patient, MRN…"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none ring-emerald-500/0 transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
            />
          </form>
          <Link to="/admin/orders" className="shrink-0">
            <Button className="h-11 w-full rounded-xl bg-[#0A2E1F] px-5 text-xs font-bold uppercase tracking-widest text-white shadow-md shadow-emerald-900/10 hover:bg-[#051810] sm:w-auto">
              Open orders
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* KPIs */}
      <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:mb-12 lg:grid-cols-4" aria-label="Key metrics">
        {[
          {
            label: "Revenue (loaded)",
            value: `$${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            hint: "Sum of order amounts in view",
            icon: DollarSign,
            accent: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Orders",
            value: orderCount.toLocaleString(),
            hint: "Records in your brand scope",
            icon: ShoppingCart,
            accent: "text-[#0A2E1F]",
            bg: "bg-slate-100",
          },
          {
            label: "Clinical queue",
            value: pendingCount.toLocaleString(),
            hint: "Submitted or in medical review",
            icon: Clock,
            accent: "text-amber-700",
            bg: "bg-amber-50",
          },
          {
            label: "Shipped",
            value: shippedCount.toLocaleString(),
            hint: `${shipRatePct}% of loaded orders`,
            icon: Truck,
            accent: "text-emerald-700",
            bg: "bg-emerald-50/80",
          },
        ].map((k) => (
          <Card
            key={k.label}
            className="border border-slate-100/90 shadow-sm shadow-slate-200/40 transition hover:border-emerald-200/60 hover:shadow-md"
          >
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", k.bg)}>
                  <k.icon className={cn("h-5 w-5", k.accent)} aria-hidden />
                </div>
                <span className="max-w-[10rem] text-right text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  {k.hint}
                </span>
              </div>
              <p className="mt-5 font-mono text-2xl font-semibold tabular-nums tracking-tight text-[#0A2E1F] sm:text-3xl">
                {k.value}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Main column */}
        <div className="space-y-8 lg:col-span-8">
          <Card className="overflow-hidden border border-slate-100/90 shadow-sm shadow-slate-200/30">
            <CardContent className="p-0">
              <div className="flex flex-col gap-1 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-8">
                <div>
                  <h2 className="text-lg font-semibold text-[#0A2E1F] sm:text-xl">Revenue trend</h2>
                  <p className="mt-1 text-sm text-slate-500">Last seven days with activity in your scope</p>
                </div>
                <Link
                  to="/admin/analytics"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Full analytics
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
              <div className="h-[280px] w-full px-2 pb-4 pt-2 sm:h-[320px] sm:px-4 md:h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="adminRevFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 8" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                    />
                    <YAxis hide domain={[0, "auto"]} />
                    <Tooltip
                      cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                      contentStyle={{
                        backgroundColor: "#0A2E1F",
                        border: "none",
                        borderRadius: "12px",
                        color: "#fff",
                        boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
                        padding: "12px 16px",
                      }}
                      formatter={(v: number | string) => [
                        typeof v === "number" ? `$${v.toLocaleString()}` : v,
                        "Amount",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#059669"
                      strokeWidth={2.5}
                      fill="url(#adminRevFill)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0, fill: "#059669" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick links */}
          <section aria-labelledby="admin-quick-links">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="admin-quick-links" className="text-lg font-semibold text-[#0A2E1F]">
                Workspace
              </h2>
              <Sparkles className="h-5 w-5 text-emerald-600/70" aria-hidden />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {QUICK_LINKS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition group-hover:bg-emerald-50 group-hover:text-emerald-700">
                      <item.icon className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#0A2E1F]">{item.label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{item.hint}</p>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar column */}
        <aside className="space-y-6 lg:col-span-4">
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#0A2E1F] to-[#051810] text-white shadow-lg shadow-emerald-950/20">
            <CardContent className="relative p-6 sm:p-8">
              <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300/90">
                    Snapshot
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Brand health</h2>
                </div>
                <Activity className="h-5 w-5 text-emerald-400" aria-hidden />
              </div>
              <ul className="relative mt-8 space-y-3">
                {[
                  { label: "Distinct patients", val: patientsN.toLocaleString(), icon: Users },
                  { label: "Avg order value", val: `$${avgOrder.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign },
                  { label: "Ship rate (loaded)", val: `${shipRatePct}%`, icon: Truck },
                ].map((row) => (
                  <li
                    key={row.label}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-200">
                      <row.icon className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-100/60">
                        {row.label}
                      </p>
                      <p className="truncate text-lg font-semibold tabular-nums text-white">{row.val}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="relative mt-6 grid gap-2">
                <Link to="/admin/analytics">
                  <Button className="h-11 w-full rounded-xl border-0 bg-emerald-500 text-xs font-bold uppercase tracking-widest text-[#0A2E1F] hover:bg-emerald-400">
                    Analytics
                  </Button>
                </Link>
                <Link to="/admin/settings">
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-xl border-white/20 bg-transparent text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10"
                  >
                    Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100/90 shadow-sm">
            <CardContent className="p-6 sm:p-7">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-[#0A2E1F]">Recent orders</h2>
                <Link
                  to="/admin/orders"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  View all
                </Link>
              </div>
              <ul className="mt-5 divide-y divide-slate-100">
                {recentOrders.length === 0 ? (
                  <li className="py-8 text-center text-sm text-slate-500">No orders in scope yet.</li>
                ) : (
                  recentOrders.map((o) => (
                    <li key={o.id ?? `${o.order_number}-${o.created_at}`}>
                      <Link
                        to="/admin/orders"
                        className="flex items-center gap-3 py-3 transition hover:bg-slate-50/80"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                          <FileText className="h-5 w-5" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {o.patient_name || "Patient"}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {o.order_number ? `${o.order_number} · ` : ""}
                            {String(o.status || "").replace(/_/g, " ")}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>

          <Link
            to="/admin/orders"
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-4 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-900"
          >
            <LayoutDashboard className="h-4 w-4 text-emerald-700" aria-hidden />
            Go to order operations
          </Link>
        </aside>
      </div>
    </div>
  );
}

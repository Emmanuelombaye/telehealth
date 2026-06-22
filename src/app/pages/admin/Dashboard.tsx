import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router";
import {
  ShoppingCart,
  DollarSign,
  Activity,
  Users,
  Clock,
  ChevronRight,
  TrendingUp,
  Package,
  BarChart3,
  MessageSquare,
  Layers,
  CreditCard,
  ArrowUpRight,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Card, Button, Badge, cn } from "../../components/ui/shared.tsx";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuthStore } from "../../../lib";
import { supabase } from "../../../lib/supabaseClient";
import { ORDERS_ADMIN_NON_CLINICAL_SELECT, applyOrdersBrandScope, resolveAdminBrandScope } from "../../../lib/adminScope";
import { useBrand } from "../../context/BrandContext";
import { motion } from "framer-motion";
import { AdminScopeNotice } from "../../components/admin/AdminScopeNotice.tsx";
import { adminPortalBaseFromPath } from "../../../lib/portalPath";

function countUniquePatients(orderRows: { user_id?: string; patient_email?: string; patient_name?: string }[]) {
  const seen = new Set<string>();
  for (const o of orderRows) {
    const key = String(o?.user_id ?? o?.patient_email ?? o?.patient_name ?? "").trim();
    if (key) seen.add(key);
  }
  return seen.size;
}

function parseAmount(raw: unknown): number {
  if (typeof raw === "number") return raw;
  return parseFloat(String(raw ?? 0).replace(/[^0-9.-]+/g, "")) || 0;
}

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  order_submitted: { label: "Submitted", tone: "bg-sky-50 text-sky-700 ring-sky-100" },
  medical_review: { label: "In review", tone: "bg-amber-50 text-amber-700 ring-amber-100" },
  shipped: { label: "Shipped", tone: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  delivered: { label: "Delivered", tone: "bg-slate-100 text-slate-600 ring-slate-200" },
  rx_sent: { label: "Prescribed", tone: "bg-[#0A2E1F] text-white ring-[#0A2E1F]/20" },
};

const QUICK_ACTIONS = [
  { label: "Orders", desc: "Fulfillment queue", icon: Package, path: "orders" },
  { label: "Analytics", desc: "Revenue insights", icon: BarChart3, path: "analytics" },
  { label: "Patients", desc: "Operations view", icon: Users, path: "patients" },
  { label: "Products", desc: "Catalog & pricing", icon: Layers, path: "products" },
  { label: "Messages", desc: "Support inbox", icon: MessageSquare, path: "messages" },
  { label: "Finance", desc: "Payouts & reports", icon: CreditCard, path: "finance" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function AdminDashboard() {
  const location = useLocation();
  const adminBase = adminPortalBaseFromPath(location.pathname);
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const authBrandId = useAuthStore((state) => state.brandId);
  const { brand: tenantBrand } = useBrand();
  const brandId = resolveAdminBrandScope(role, authBrandId, tenantBrand.id);
  const adminName = user?.user_metadata?.first_name || "Admin";

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        let allOrders: any[] = [];
        let page = 0;
        const limit = 1000;
        while (true) {
          let q = supabase
            .from("orders")
            .select(ORDERS_ADMIN_NON_CLINICAL_SELECT)
            .order("created_at", { ascending: false })
            .range(page * limit, (page + 1) * limit - 1);
          q = applyOrdersBrandScope(q, role, brandId);
          const { data, error } = await q;
          if (error) throw error;
          if (!data || data.length === 0) break;
          allOrders = [...allOrders, ...data];
          if (data.length < limit) break;
          page++;
        }
        setOrders(allOrders);
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

  const metrics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + parseAmount(o?.amount), 0);
    const pendingCount = orders.filter(
      (o) => o.status === "order_submitted" || o.status === "medical_review",
    ).length;
    const shippedCount = orders.filter((o) => o.status === "shipped" || o.status === "delivered").length;
    const patientCount = countUniquePatients(orders);
    const aov = orders.length ? Math.round(totalRevenue / orders.length) : 0;
    const fulfillmentRate = orders.length ? Math.round((shippedCount / orders.length) * 100) : 0;

    const revenueByDay = orders.reduce(
      (acc, order) => {
        if (!order?.created_at) return acc;
        const d = new Date(order.created_at);
        if (isNaN(d.getTime())) return acc;
        const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (!acc[date]) acc[date] = 0;
        acc[date] += parseAmount(order.amount);
        return acc;
      },
      {} as Record<string, number>,
    );

    const chartData = Object.entries(revenueByDay)
      .map(([date, amount]) => ({ date, amount }))
      .reverse()
      .slice(0, 7)
      .reverse();

    if (chartData.length === 0) {
      chartData.push({ date: "Today", amount: totalRevenue });
    }

    return {
      totalRevenue,
      pendingCount,
      shippedCount,
      patientCount,
      aov,
      fulfillmentRate,
      chartData,
      recentOrders: orders.slice(0, 6),
    };
  }, [orders]);

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-full bg-[#F8FAFC] text-[#0A0D14]">
      <div className="mx-auto max-w-[1600px] space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <AdminScopeNotice variant="brand" />

        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_-8px_rgba(15,23,42,0.08)] sm:p-8"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-slate-200/40 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-md border-0 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-800">
                  Brand operations
                </Badge>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Live sync
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{todayLabel}</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  Good to see you, {adminName}
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
                  Your command center for orders, revenue, and patient operations — scoped to your brand, non-clinical view.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Link to={`${adminBase}/analytics`}>
                <Button
                  variant="outline"
                  className="h-10 rounded-lg border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <BarChart3 className="mr-2 h-4 w-4 text-emerald-600" />
                  View analytics
                </Button>
              </Link>
              <Link to={`${adminBase}/orders`}>
                <Button className="h-10 rounded-lg bg-[#0A2E1F] px-5 text-sm font-medium text-white shadow-sm hover:bg-[#0d3d28]">
                  Manage orders
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.header>

        {/* KPI strip */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Gross revenue",
              value: loading ? "—" : `$${metrics.totalRevenue.toLocaleString()}`,
              hint: "All-time brand volume",
              icon: DollarSign,
              accent: "text-emerald-600 bg-emerald-50",
            },
            {
              label: "Active orders",
              value: loading ? "—" : String(orders.length),
              hint: "In your tenant scope",
              icon: ShoppingCart,
              accent: "text-slate-700 bg-slate-100",
            },
            {
              label: "Review queue",
              value: loading ? "—" : String(metrics.pendingCount),
              hint: "Needs attention",
              icon: Clock,
              accent: "text-amber-600 bg-amber-50",
            },
            {
              label: "Fulfillment rate",
              value: loading ? "—" : `${metrics.fulfillmentRate}%`,
              hint: `${metrics.shippedCount} shipped / delivered`,
              icon: TrendingUp,
              accent: "text-indigo-600 bg-indigo-50",
            },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} custom={i} variants={fadeUp} initial="hidden" animate="show">
              <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", kpi.accent)}>
                    <kpi.icon className="h-5 w-5" />
                  </div>
                  {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-300" />}
                </div>
                <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{kpi.value}</p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">{kpi.label}</p>
                <p className="mt-1 text-xs text-slate-400">{kpi.hint}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Revenue chart */}
          <motion.div
            className="lg:col-span-8"
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            <Card className="h-full rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Revenue trend</h2>
                  <p className="mt-0.5 text-sm text-slate-500">Last 7 days · settlement volume</p>
                </div>
                <Badge variant="outline" className="rounded-md border-slate-200 text-xs font-medium text-slate-600">
                  7-day window
                </Badge>
              </div>
              <div className="h-[320px] w-full">
                {loading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="adminRevPro" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.18} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 500 }}
                        dy={8}
                      />
                      <YAxis hide />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
                              <p className="text-xs font-medium text-slate-500">{payload[0].payload.date}</p>
                              <p className="text-sm font-semibold text-slate-900">
                                ${Number(payload[0].value).toLocaleString()}
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#059669"
                        strokeWidth={2.5}
                        fill="url(#adminRevPro)"
                        dot={false}
                        activeDot={{ r: 4, fill: "#059669", strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Brand health */}
          <motion.div
            className="lg:col-span-4"
            custom={5}
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            <Card className="flex h-full flex-col rounded-xl border border-slate-200/80 bg-[#0A2E1F] p-6 text-white shadow-sm sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Brand health</h2>
                  <p className="mt-0.5 text-sm text-emerald-100/70">Key performance signals</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <Activity className="h-4 w-4 text-emerald-300" />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  { label: "Unique patients", value: loading ? "—" : metrics.patientCount, icon: Users },
                  { label: "Avg. order value", value: loading ? "—" : `$${metrics.aov}`, icon: DollarSign },
                  { label: "Shipped orders", value: loading ? "—" : metrics.shippedCount, icon: Sparkles },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-500/15">
                      <row.icon className="h-4 w-4 text-emerald-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-emerald-100/60">{row.label}</p>
                      <p className="text-base font-semibold text-white">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link to={`${adminBase}/analytics`} className="mt-6 block">
                <Button className="h-10 w-full rounded-lg bg-emerald-500 text-sm font-medium text-[#0A2E1F] hover:bg-emerald-400">
                  Open full analytics
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </Card>
          </motion.div>
        </div>

        {/* Quick actions */}
        <motion.section custom={6} variants={fadeUp} initial="hidden" animate="show">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.path}
                to={`${adminBase}/${action.path}`}
                className="group flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-700">
                  <action.icon className="h-4 w-4" />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-900">{action.label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{action.desc}</p>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* Recent orders */}
        <motion.section custom={7} variants={fadeUp} initial="hidden" animate="show">
          <Card className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Recent orders</h2>
                <p className="mt-0.5 text-sm text-slate-500">Latest activity in your fulfillment pipeline</p>
              </div>
              <Link to={`${adminBase}/orders`}>
                <Button
                  variant="ghost"
                  className="h-9 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  View all
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
              </div>
            ) : metrics.recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <Package className="h-6 w-6 text-slate-400" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-700">No orders yet</p>
                <p className="mt-1 max-w-sm text-sm text-slate-400">
                  Orders will appear here once patients complete checkout on your brand storefront.
                </p>
                <Link to={`${adminBase}/products`} className="mt-5">
                  <Button variant="outline" className="h-9 rounded-lg text-sm">
                    Review products
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {metrics.recentOrders.map((o, i) => {
                  const status = STATUS_LABEL[o.status] ?? {
                    label: String(o.status ?? "Unknown").replace(/_/g, " "),
                    tone: "bg-slate-100 text-slate-600 ring-slate-200",
                  };
                  return (
                    <Link
                      key={o.id ?? i}
                      to={`${adminBase}/orders`}
                      className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/80"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                        {(o.patient_name || "P").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {o.patient_name || "Patient"}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {o.medication || "Treatment"} · {o.order_number || "—"}
                        </p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="text-sm font-medium text-slate-900">
                          ${parseAmount(o.amount).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-400">
                          {o.ordered_date || (o.created_at ? new Date(o.created_at).toLocaleDateString() : "—")}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset",
                          status.tone,
                        )}
                      >
                        {status.label}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.section>
      </div>
    </div>
  );
}

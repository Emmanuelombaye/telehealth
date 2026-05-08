import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Globe, TrendingUp, Users, DollarSign, Activity, ShieldCheck,
  AlertTriangle, Server, ArrowUpRight, Building2, Zap, CheckCircle2,
  Package, Clock, BarChart3, Lock
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "../../components/ui/shared.tsx";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";
import { supabase } from "../../../lib/supabaseClient";

const revenueData = [
  { month: "Nov", revenue: 182000 }, { month: "Dec", revenue: 210000 },
  { month: "Jan", revenue: 198000 }, { month: "Feb", revenue: 234000 },
  { month: "Mar", revenue: 267000 }, { month: "Apr", revenue: 291000 },
  { month: "May", revenue: 318000 },
];

const brandRevenue = [
  { name: "Brand A", revenue: 128000 },
  { name: "Brand B", revenue: 94000 },
  { name: "Brand C", revenue: 61000 },
  { name: "Brand D", revenue: 35000 },
];

const brands = [
  { id: 1, name: "Brand A", slug: "brand-a", domain: "branda.health", patients: 18420, doctors: 142, mrr: "$128,400", growth: "+24%", status: "active", country: "🇺🇸" },
  { id: 2, name: "Brand B", slug: "brand-b", domain: "brandb.care", patients: 11230, doctors: 98, mrr: "$94,200", growth: "+18%", status: "active", country: "🇬🇧" },
  { id: 3, name: "Brand C", slug: "brand-c", domain: "brandc.med", patients: 7840, doctors: 61, mrr: "$61,000", growth: "+9%", status: "active", country: "🇦🇪" },
  { id: 4, name: "Brand D", slug: "brand-d", domain: "brandd.clinic", patients: 3210, doctors: 28, mrr: "$35,000", growth: "+5%", status: "trial", country: "🇧🇷" },
];

const alerts = [
  { severity: "critical", title: "Brute Force Detected", desc: "Brand B — 80+ failed logins from IP 203.0.113.42", time: "4m ago" },
  { severity: "warning", title: "High API Latency", desc: "Brand C — avg response 820ms (threshold: 500ms)", time: "12m ago" },
  { severity: "info", title: "New Brand Onboarded", desc: "Brand D completed setup and went live", time: "2h ago" },
];

const recentActivity = [
  { brand: "Brand A", action: "New doctor verified", user: "Dr. Sarah Johnson", time: "5m ago" },
  { brand: "Brand B", action: "Payout processed", user: "Finance System", time: "22m ago" },
  { brand: "Brand C", action: "Product added", user: "Admin Carlos", time: "1h ago" },
  { brand: "Brand A", action: "Patient milestone: 18K", user: "System", time: "3h ago" },
];

export function SuperAdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const { data, error } = await supabase.from('orders').select('*');
        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchOrders();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Compute live metrics
  const totalMRR = orders.reduce((sum, order) => {
    const amt = typeof order.amount === 'number' ? order.amount : parseFloat(String(order.amount).replace(/[^0-9.-]+/g,"")) || 0;
    return sum + amt;
  }, 0);

  const uniquePatients = new Set(orders.map(o => o.patientName)).size;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
              <ShieldCheck className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">Super Admin</span>
          </div>
          <h1 className="text-2xl font-bold">Platform Overview</h1>
          <p className="text-sm text-muted-foreground">All brands · Global operations · May 2026</p>
        </div>
        <div className="flex gap-2">
          <Link to="/superadmin/brands">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs">
              <Building2 className="h-3.5 w-3.5" /> Manage Brands
            </Button>
          </Link>
          <Link to="/superadmin/analytics">
            <Button size="sm" className="rounded-xl gap-1.5 text-xs bg-violet-600 hover:bg-violet-700">
              <BarChart3 className="h-3.5 w-3.5" /> Full Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Platform MRR", value: `$${totalMRR.toLocaleString(undefined, {minimumFractionDigits: 2})}`, change: "Live", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
          { label: "Total Patients", value: uniquePatients.toLocaleString(), change: "Live", icon: Users, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
          { label: "Active Brands", value: "4", change: "+1 this mo", icon: Building2, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
          { label: "Uptime", value: "99.98%", change: "All systems", icon: Activity, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{s.label}</p>
                <h3 className="text-2xl font-bold mt-1">{s.value}</h3>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full mt-1 inline-block">{s.change}</span>
              </div>
              <div className={`h-12 w-12 rounded-2xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-sm">Platform Revenue — All Brands</CardTitle>
            <Badge className="bg-emerald-500 text-white text-[10px]">+24% MoM</Badge>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", fontSize: 12 }}
                    formatter={(v: any) => [`$${(v / 1000).toFixed(0)}k`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#7c3aed" fill="url(#rev)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by brand */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm">Revenue by Brand</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={brandRevenue} barSize={28}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "none", fontSize: 12 }}
                    formatter={(v: any) => [`$${(v / 1000).toFixed(0)}k`]} />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {brandRevenue.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#7c3aed" : i === 1 ? "#6d28d9" : i === 2 ? "#8b5cf6" : "#a78bfa"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brands quick view */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm">Brands</h2>
          <Link to="/superadmin/brands" className="text-xs text-violet-600 font-semibold flex items-center gap-1">
            View All <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {brands.map(brand => (
            <Link key={brand.id} to={`/superadmin/brands/${brand.slug}`}>
              <Card className="hover:border-violet-400/50 transition-all hover:shadow-md cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
                      {brand.name.split(" ")[1]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm">{brand.name}</p>
                        <span className="text-sm">{brand.country}</span>
                        <Badge variant={brand.status === "active" ? "success" : "secondary"} className="text-[9px]">
                          {brand.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{brand.domain}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" /> {brand.patients.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Activity className="h-3 w-3" /> {brand.doctors} doctors
                        </span>
                        <span className="text-xs font-bold text-emerald-600">{brand.mrr}</span>
                        <span className="text-[10px] font-bold text-emerald-600">{brand.growth}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Platform Alerts
            </CardTitle>
            <Link to="/superadmin/security">
              <Button variant="ghost" size="sm" className="text-violet-600 h-7 px-2 text-xs gap-1">
                View All <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${
                a.severity === "critical" ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900" :
                a.severity === "warning" ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900" :
                "bg-muted/50 border-border"}`}>
                <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                  a.severity === "critical" ? "bg-red-500 animate-pulse" :
                  a.severity === "warning" ? "bg-amber-500" : "bg-emerald-500"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold">{a.title}</p>
                    <span className="text-[10px] text-muted-foreground">{a.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                <div className="h-8 w-8 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
                  <Zap className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{a.action}</p>
                  <p className="text-[10px] text-muted-foreground">{a.brand} · {a.user}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{a.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* System health */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Server className="h-4 w-4 text-primary" /> Infrastructure Health
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "API Gateway", value: "42ms", status: "healthy" },
              { label: "Database Cluster", value: "99.99%", status: "healthy" },
              { label: "CDN", value: "18ms", status: "healthy" },
              { label: "Brand B API", value: "820ms", status: "degraded" },
            ].map((s, i) => (
              <div key={i} className={`p-3 rounded-xl border ${s.status === "healthy" ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`h-2 w-2 rounded-full ${s.status === "healthy" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{s.status}</span>
                </div>
                <p className="font-bold text-sm">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

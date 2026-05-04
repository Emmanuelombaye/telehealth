import {
  DollarSign, Users, Activity, TrendingUp, Globe, Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "../../../components/ui/shared";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, Legend
} from "recharts";

const platformRevenue = [
  { month: "Oct", brandA: 82000, brandB: 55000, brandC: 38000, brandD: 0 },
  { month: "Nov", brandA: 88000, brandB: 62000, brandC: 42000, brandD: 0 },
  { month: "Dec", brandA: 95000, brandB: 68000, brandC: 46000, brandD: 0 },
  { month: "Jan", brandA: 102000, brandB: 74000, brandC: 50000, brandD: 12000 },
  { month: "Feb", brandA: 110000, brandB: 80000, brandC: 54000, brandD: 20000 },
  { month: "Mar", brandA: 118000, brandB: 86000, brandC: 57000, brandD: 28000 },
  { month: "Apr", brandA: 124000, brandB: 91000, brandC: 59000, brandD: 32000 },
  { month: "May", brandA: 128400, brandB: 94200, brandC: 61000, brandD: 35000 },
];

const patientGrowth = [
  { month: "Jan", patients: 28400 }, { month: "Feb", patients: 31200 },
  { month: "Mar", patients: 34800 }, { month: "Apr", patients: 37600 },
  { month: "May", patients: 40700 },
];

const productPerformance = [
  { name: "Weight Loss", orders: 8420, revenue: 142000 },
  { name: "ED Treatment", orders: 6210, revenue: 98000 },
  { name: "Mental Health", orders: 4880, revenue: 76000 },
  { name: "Hair Loss", orders: 3940, revenue: 52000 },
  { name: "General Consult", orders: 2800, revenue: 38000 },
];

const geoData = [
  { country: "🇺🇸 United States", patients: 18200, pct: 45 },
  { country: "🇬🇧 United Kingdom", patients: 9800, pct: 24 },
  { country: "🇦🇪 UAE", patients: 6100, pct: 15 },
  { country: "🇧🇷 Brazil", patients: 3200, pct: 8 },
  { country: "🇫🇷 France", patients: 1900, pct: 5 },
  { country: "🌍 Other", patients: 1500, pct: 3 },
];

const brandColors: Record<string, string> = {
  brandA: "#7c3aed", brandB: "#6d28d9", brandC: "#8b5cf6", brandD: "#a78bfa",
};

const conversionData = [
  { stage: "Visited Shop", value: 100 },
  { stage: "Started Intake", value: 68 },
  { stage: "Submitted", value: 52 },
  { stage: "Doctor Approved", value: 44 },
  { stage: "Paid", value: 38 },
  { stage: "Shipped", value: 36 },
];

export function SuperAdminAnalyticsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Platform Analytics</h1>
          <p className="text-sm text-muted-foreground">All brands combined · May 2026</p>
        </div>
        <Badge variant="secondary" className="text-xs">Live Data</Badge>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Platform MRR", value: "$318,600", change: "+24%", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
          { label: "Total Patients", value: "40,700", change: "+18%", icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" },
          { label: "Total Orders", value: "10,220", change: "+31%", icon: Package, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
          { label: "Avg Conversion", value: "38%", change: "+4pts", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full">{s.change}</span>
              </div>
              <p className="text-xl font-extrabold">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue by brand stacked */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">Revenue by Brand — Monthly</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformRevenue} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", fontSize: 11 }}
                  formatter={(v: any, name: string) => [`$${(v / 1000).toFixed(0)}k`, name.replace("brand", "Brand ")]} />
                <Legend formatter={(v) => v.replace("brand", "Brand ")} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="brandA" stackId="a" fill={brandColors.brandA} radius={[0, 0, 0, 0]} />
                <Bar dataKey="brandB" stackId="a" fill={brandColors.brandB} />
                <Bar dataKey="brandC" stackId="a" fill={brandColors.brandC} />
                <Bar dataKey="brandD" stackId="a" fill={brandColors.brandD} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Patient growth */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm">Total Patient Growth</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={patientGrowth}>
                  <defs>
                    <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", fontSize: 12 }}
                    formatter={(v: any) => [v.toLocaleString(), "Patients"]} />
                  <Area type="monotone" dataKey="patients" stroke="#3b82f6" fill="url(#pg)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Geo distribution */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Patient Geography
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {geoData.map((c, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{c.country}</span>
                  <span className="text-muted-foreground">{c.patients.toLocaleString()} · {c.pct}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Product performance */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm">Top Products — All Brands</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {productPerformance.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
                  <Package className="h-4 w-4 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <span className="text-xs font-bold text-emerald-600">${(p.revenue / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(p.orders / 8420) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{p.orders.toLocaleString()} orders</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Conversion funnel */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm">Patient Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {conversionData.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground w-24 shrink-0">{s.stage}</span>
                <div className="flex-1 h-6 bg-muted rounded-lg overflow-hidden">
                  <div className="h-full rounded-lg flex items-center px-2 transition-all"
                    style={{ width: `${s.value}%`, background: `rgba(124,58,237,${0.3 + (s.value / 100) * 0.7})` }}>
                    <span className="text-[10px] font-bold text-white">{s.value}%</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

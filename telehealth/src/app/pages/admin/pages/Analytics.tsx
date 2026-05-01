import { TrendingUp, Users, DollarSign, Activity, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "../../../components/ui/shared";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const revenueData = [
  { month: "Jan", revenue: 42000, patients: 380 }, { month: "Feb", revenue: 48000, patients: 420 },
  { month: "Mar", revenue: 55000, patients: 490 }, { month: "Apr", revenue: 51000, patients: 460 },
  { month: "May", revenue: 67000, patients: 580 }, { month: "Jun", revenue: 72000, patients: 620 },
];

const topTreatments = [
  { name: "General Consult", revenue: 28000, count: 373 },
  { name: "Cardiology", revenue: 22000, count: 110 },
  { name: "Mental Health", revenue: 18000, count: 150 },
  { name: "Dermatology", revenue: 12000, count: 200 },
];

const countries = [
  { country: "🇺🇸 United States", patients: 1840, pct: 42 },
  { country: "🇬🇧 United Kingdom", patients: 620, pct: 14 },
  { country: "🇸🇦 Saudi Arabia", patients: 480, pct: 11 },
  { country: "🇧🇷 Brazil", patients: 390, pct: 9 },
  { country: "🇫🇷 France", patients: 310, pct: 7 },
];

export function AdminAnalyticsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Analytics</h1>
        <Badge variant="secondary" className="text-xs">May 2026</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Monthly Revenue", value: "$67,000", change: "+18%", icon: DollarSign, color: "text-emerald-600" },
          { label: "New Patients", value: "580", change: "+26%", icon: Users, color: "text-blue-600" },
          { label: "Consultations", value: "1,240", change: "+12%", icon: Activity, color: "text-purple-600" },
          { label: "Avg Rating", value: "4.87", change: "+0.03", icon: TrendingUp, color: "text-amber-600" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full">{s.change}</span>
              </div>
              <p className="text-xl font-extrabold">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">Revenue & Patient Growth</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} formatter={(v: any) => [`$${(v/1000).toFixed(0)}k`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="url(#rev)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Top Treatments by Revenue</CardTitle></CardHeader>
          <CardContent className="px-2 pb-4">
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTreatments} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={90} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", fontSize: 12 }} formatter={(v: any) => [`$${(v/1000).toFixed(0)}k`]} />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                    {topTreatments.map((_, i) => <Cell key={i} fill={i === 0 ? "var(--primary)" : "#cbd5e1"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Global Patient Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {countries.map((c, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{c.country}</span>
                  <span className="text-muted-foreground">{c.patients.toLocaleString()} · {c.pct}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

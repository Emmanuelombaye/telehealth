import { Link } from "react-router";
import {
  ShieldCheck, Users, Activity, Lock, Server, AlertTriangle,
  TrendingUp, Package, MessageSquare, Heart, BarChart3, ArrowUpRight,
  CheckCircle2, Database
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "../../components/ui/shared";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const systemLoad = [
  { time: "00:00", load: 32 }, { time: "04:00", load: 25 }, { time: "08:00", load: 68 },
  { time: "12:00", load: 85 }, { time: "16:00", load: 74 }, { time: "20:00", load: 45 }, { time: "Now", load: 52 },
];

const userDist = [
  { name: "Patients", value: 4500, color: "#0066FF" },
  { name: "Doctors", value: 240, color: "#10b981" },
  { name: "Staff", value: 120, color: "#f59e0b" },
];

const recentLogs = [
  { user: "Dr. Sarah Johnson", action: "Record Access", target: "Patient #8492", time: "2m ago", severity: "info" },
  { user: "Unknown IP", action: "Failed Login x50", target: "Admin Portal", time: "14m ago", severity: "critical" },
  { user: "System", action: "Backup Completed", target: "Vault-Alpha", time: "1h ago", severity: "info" },
  { user: "Nurse Maria", action: "Prescription Created", target: "Patient #2210", time: "3h ago", severity: "medium" },
];

const quickLinks = [
  { label: "Treatments", href: "/admin/treatments", icon: Heart, color: "bg-rose-100 text-rose-600 dark:bg-rose-950/40" },
  { label: "Orders", href: "/admin/orders", icon: Package, color: "bg-blue-100 text-blue-600 dark:bg-blue-950/40", badge: 5 },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, color: "bg-purple-100 text-purple-600 dark:bg-purple-950/40" },
  { label: "Finances", href: "/admin/finance", icon: TrendingUp, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40" },
  { label: "Messages", href: "/admin/messages", icon: MessageSquare, color: "bg-amber-100 text-amber-600 dark:bg-amber-950/40", badge: 8 },
  { label: "Audit Logs", href: "/admin/audit", icon: ShieldCheck, color: "bg-slate-100 text-slate-600 dark:bg-slate-950/40" },
];

export function AdminDashboard() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">System Administration</h1>
          <p className="text-sm text-muted-foreground">Global overview — Brandan Health Platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs hidden md:flex">
            <Database className="h-3.5 w-3.5" /> Backup
          </Button>
          <Button size="sm" className="rounded-xl gap-1.5 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" /> Security Audit
          </Button>
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Nodes", value: "12 / 12", icon: Server, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-950/40" },
          { label: "Total Users", value: "4,860", icon: Users, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-950/40" },
          { label: "API Latency", value: "42ms", icon: Activity, color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-950/40" },
          { label: "Security Score", value: "98/100", icon: Lock, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-950/40" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {quickLinks.map((link, i) => (
          <Link key={i} to={link.href}>
            <Card className="hover:border-primary/40 transition-colors cursor-pointer hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-3 text-center relative">
                {link.badge && <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{link.badge}</span>}
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center mx-auto mb-1.5 ${link.color}`}>
                  <link.icon className="h-4 w-4" />
                </div>
                <p className="text-[11px] font-semibold">{link.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* System Load */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-sm">Global System Load</CardTitle>
            <Badge className="bg-emerald-500 text-white text-[10px]">● All Systems Operational</Badge>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={systemLoad}>
                  <defs>
                    <linearGradient id="load" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", fontSize: 12 }} formatter={(v: any) => [`${v}%`, "Load"]} />
                  <Area type="monotone" dataKey="load" stroke="var(--primary)" fill="url(#load)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Distribution */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">User Distribution</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={userDist} innerRadius={35} outerRadius={55} paddingAngle={4} dataKey="value">
                    {userDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {userDist.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-medium">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Audit Logs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" /> Real-time Audit Logs
            </CardTitle>
            <Link to="/admin/audit">
              <Button variant="ghost" size="sm" className="text-primary h-7 px-2 text-xs gap-1">
                View All <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {recentLogs.map((log, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${log.severity === "critical" ? "bg-red-500 animate-pulse" : log.severity === "medium" ? "bg-amber-500" : "bg-emerald-500"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold">{log.user}</p>
                    <span className="text-[10px] text-muted-foreground">{log.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">{log.action}:</span> {log.target}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security Alerts */}
        <Card className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <CardTitle className="text-sm">Critical Security Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="bg-card rounded-2xl border border-red-200 dark:border-red-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="destructive" className="text-[10px]">Critical</Badge>
                <span className="text-[10px] text-muted-foreground">14:02 UTC</span>
              </div>
              <h4 className="font-bold text-sm mb-1">Brute Force Attempt Detected</h4>
              <p className="text-xs text-muted-foreground mb-3">IP 203.0.113.42 attempted 50+ failed logins on Admin Portal.</p>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" className="h-7 text-xs rounded-xl">Block IP</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs rounded-xl">Investigate</Button>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">All other systems secure</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Last full scan: 30 minutes ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { 
  ShieldCheck, 
  Users, 
  Database, 
  Activity, 
  Settings, 
  AlertTriangle,
  FileText,
  Lock,
  Search,
  ArrowUpRight,
  TrendingUp,
  Server
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "../../components/ui/shared";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

const systemUptime = [
  { time: '00:00', load: 32 },
  { time: '04:00', load: 25 },
  { time: '08:00', load: 68 },
  { time: '12:00', load: 85 },
  { time: '16:00', load: 74 },
  { time: '20:00', load: 45 },
  { time: '23:59', load: 38 },
];

const userDistribution = [
  { name: 'Patients', value: 4500, color: '#0ea5e9' },
  { name: 'Doctors', value: 240, color: '#10b981' },
  { name: 'Staff', value: 120, color: '#f59e0b' },
];

const recentLogs = [
  { id: 1, user: "Dr. Sarah Johnson", action: "Record Access", target: "Patient #8492", time: "2 mins ago", severity: "low" },
  { id: 2, user: "Admin", action: "Security Policy Update", target: "Firewall Rules", time: "15 mins ago", severity: "high" },
  { id: 3, user: "System", action: "Backup Completed", target: "Vault-Alpha", time: "1 hour ago", severity: "low" },
  { id: 4, user: "Nurse Mark", action: "Prescription Created", target: "Patient #2210", time: "3 hours ago", severity: "medium" },
];

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Administration</h1>
          <p className="text-muted-foreground">Global overview of Brandan Health infrastructure.</p>
        </div>
        <div className="flex space-x-2">
           <Button variant="outline" size="sm">
              <Database className="h-4 w-4 mr-2" />
              Backup
           </Button>
           <Button size="sm">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Security Audit
           </Button>
        </div>
      </div>

      {/* System Health Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Active Nodes", value: "12 / 12", icon: Server, color: "text-emerald-500" },
          { label: "Total Users", value: "4,860", icon: Users, color: "text-blue-500" },
          { label: "API Latency", value: "42ms", icon: Activity, color: "text-purple-500" },
          { label: "Security Score", value: "98/100", icon: Lock, color: "text-amber-500" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className={`p-3 rounded-xl bg-muted/50 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* System Load Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Global System Load</CardTitle>
            <Badge variant="success">All Systems Operational</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={systemUptime}>
                  <defs>
                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                  <RechartsTooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="load" 
                    stroke="var(--primary)" 
                    fillOpacity={1} 
                    fill="url(#colorLoad)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {userDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-3">
               {userDistribution.map((item, i) => (
                 <div key={i} className="flex items-center justify-between">
                   <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full" style={{backgroundColor: item.color}} />
                      <span className="text-sm font-medium">{item.name}</span>
                   </div>
                   <span className="text-sm text-muted-foreground font-bold">{item.value}</span>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Compliance & Audit Logs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Real-time Audit Logs</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary h-8 px-2">
               View Full Registry <ArrowUpRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               {recentLogs.map((log) => (
                 <div key={log.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border">
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                      log.severity === "high" ? "bg-destructive animate-pulse" : 
                      log.severity === "medium" ? "bg-amber-500" : "bg-emerald-500"
                    }`} />
                    <div className="flex-1 space-y-1">
                       <div className="flex justify-between items-start">
                          <p className="text-sm font-bold">{log.user}</p>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">{log.time}</span>
                       </div>
                       <p className="text-xs text-muted-foreground">
                         <span className="font-semibold text-foreground">{log.action}:</span> {log.target}
                       </p>
                    </div>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Alerts */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center space-x-2 text-destructive">
               <AlertTriangle className="h-5 w-5" />
               <CardTitle className="text-lg">Critical Security Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="bg-white/50 p-4 rounded-xl border border-destructive/10 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                   <Badge variant="destructive">Urgent</Badge>
                   <span className="text-xs text-muted-foreground">Detected: 14:02 UTC</span>
                </div>
                <h4 className="font-bold text-sm mb-1">Brute Force Attempt Detected</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  IP 192.168.1.104 attempted to access Admin Portal with 50+ failed logins.
                </p>
                <div className="flex space-x-2">
                   <Button size="sm" variant="destructive" className="h-8 text-xs">Block IP</Button>
                   <Button size="sm" variant="outline" className="h-8 text-xs">Dismiss</Button>
                </div>
             </div>

             <div className="flex items-center justify-center p-8 border-2 border-dashed border-muted text-muted-foreground">
                <div className="text-center">
                   <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-20" />
                   <p className="text-sm">Scan remaining infrastructure...</p>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

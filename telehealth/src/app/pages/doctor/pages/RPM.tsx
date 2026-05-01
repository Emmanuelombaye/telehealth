import { HeartPulse, Activity, AlertCircle, Watch, Smartphone, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../../../../components/ui/shared";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const bpData = [
  { time: "08:00", sys: 120, dia: 80 }, { time: "10:00", sys: 122, dia: 82 },
  { time: "12:00", sys: 125, dia: 84 }, { time: "14:00", sys: 135, dia: 88 },
  { time: "16:00", sys: 142, dia: 92 }, { time: "18:00", sys: 138, dia: 89 },
  { time: "Now", sys: 145, dia: 94 },
];

export function DoctorRPMPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-red-500" /> Remote Patient Monitoring
          </h1>
          <p className="text-sm text-muted-foreground">Live telemetry and vital signs from patient devices.</p>
        </div>
        <Button variant="outline" className="rounded-xl"><RefreshCw className="h-4 w-4 mr-2" /> Refresh Data</Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          { title: "Active Devices", value: "342", icon: Watch, color: "text-blue-500" },
          { title: "Critical Alerts", value: "4", icon: AlertCircle, color: "text-red-500" },
          { title: "Stable Patients", value: "89%", icon: Activity, color: "text-emerald-500" },
          { title: "App Syncs", value: "1.2k", icon: Smartphone, color: "text-purple-500" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Live Telemetry: Patient #8942 (Alice T.)</CardTitle>
            <Badge variant="destructive" className="animate-pulse">Elevated BP Alert</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bpData}>
                  <defs>
                    <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--background)" }} />
                  <Area type="monotone" dataKey="sys" name="Systolic" stroke="#ef4444" fillOpacity={1} fill="url(#colorSys)" strokeWidth={2} />
                  <Area type="monotone" dataKey="dia" name="Diastolic" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDia)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Critical Alerts Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Alice Thompson", alert: "BP > 140/90", time: "2 min ago", metric: "145/94 mmHg" },
                { name: "Robert Wilson", alert: "Low SpO2", time: "14 min ago", metric: "89%" },
                { name: "Maria Garcia", alert: "Tachycardia", time: "1 hr ago", metric: "125 BPM" },
              ].map((patient, i) => (
                <div key={i} className="p-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm text-red-900 dark:text-red-200">{patient.name}</p>
                      <p className="text-xs font-semibold text-red-700 dark:text-red-400">{patient.alert}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{patient.time}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-sm font-bold text-red-600 dark:text-red-400">{patient.metric}</span>
                    <Button size="sm" variant="outline" className="h-7 text-xs bg-white dark:bg-background">Review</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

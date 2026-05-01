import { BarChart3, TrendingUp, Users, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/shared";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const monthlyData = [
  { month: "Nov", consultations: 28, prescriptions: 18, labTests: 12 },
  { month: "Dec", consultations: 35, prescriptions: 22, labTests: 15 },
  { month: "Jan", consultations: 42, prescriptions: 30, labTests: 20 },
  { month: "Feb", consultations: 38, prescriptions: 25, labTests: 17 },
  { month: "Mar", consultations: 55, prescriptions: 40, labTests: 28 },
  { month: "Apr", consultations: 62, prescriptions: 45, labTests: 32 },
];

const deptData = [
  { dept: "Engineering", usage: 87 },
  { dept: "Sales", usage: 72 },
  { dept: "HR", usage: 95 },
  { dept: "Finance", usage: 60 },
  { dept: "Marketing", usage: 48 },
];

export function CorporateAnalyticsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-indigo-600" /> Usage Analytics</h1>
        <p className="text-sm text-muted-foreground">Understand how your employees are utilizing their health benefits.</p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Consultations", value: "260", trend: "+12%", color: "text-indigo-600" },
          { label: "Prescriptions Issued", value: "180", trend: "+8%", color: "text-emerald-500" },
          { label: "Lab Tests Ordered", value: "124", trend: "+15%", color: "text-blue-500" },
          { label: "Plan Utilization", value: "76%", trend: "+4%", color: "text-amber-500" },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-5">
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground font-semibold mt-1">{s.label}</p>
            <p className="text-xs text-emerald-600 font-bold mt-1">{s.trend} vs last period</p>
          </CardContent></Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Service Utilization</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="consultations" stroke="#6366f1" strokeWidth={2} dot={false} name="Consultations" />
                <Line type="monotone" dataKey="prescriptions" stroke="#10b981" strokeWidth={2} dot={false} name="Prescriptions" />
                <Line type="monotone" dataKey="labTests" stroke="#3b82f6" strokeWidth={2} dot={false} name="Lab Tests" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Utilization by Department (%)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={deptData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="dept" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="usage" fill="#6366f1" radius={[0, 4, 4, 0]} name="Usage %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

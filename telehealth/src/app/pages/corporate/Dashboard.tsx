import { Card, CardContent, CardHeader, CardTitle, Button } from "../../components/ui/shared";
import { Building2, Users, HeartPulse, PieChart } from "lucide-react";

export function CorporateDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Corporate Wellness Dashboard</h1>
          <p className="text-sm text-muted-foreground">Acme Corp Ltd. Benefits Portal</p>
        </div>
        <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700">Add Employees</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Enrolled Employees", value: "1,245", icon: Users, color: "text-indigo-500" },
          { title: "Active Usage", value: "68%", icon: PieChart, color: "text-blue-500" },
          { title: "Health Index", value: "84/100", icon: HeartPulse, color: "text-emerald-500" },
          { title: "Departments", value: "12", icon: Building2, color: "text-purple-500" },
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

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Program Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "General Telehealth", usage: "45%" },
                { name: "Mental Health Support", usage: "30%" },
                { name: "Wellness Coaching", usage: "15%" },
                { name: "Specialist Consults", usage: "10%" },
              ].map((prog, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">{prog.name}</span>
                    <span className="text-muted-foreground">{prog.usage}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: prog.usage }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                      E{i}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Employee ID: ***{145 + i}</p>
                      <p className="text-xs text-muted-foreground">Department: Engineering</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Active</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

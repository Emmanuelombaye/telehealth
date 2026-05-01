import { Card, CardContent, CardHeader, CardTitle, Button } from "../../components/ui/shared";
import { Activity, Users, FileText, TrendingUp } from "lucide-react";

export function PharmacyDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pharmacy Dashboard</h1>
        <Button className="rounded-xl">New Order</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Pending Rx", value: "42", icon: FileText, color: "text-blue-500" },
          { title: "Inventory Alerts", value: "12", icon: Activity, color: "text-amber-500" },
          { title: "Completed Today", value: "156", icon: TrendingUp, color: "text-emerald-500" },
          { title: "Active Staff", value: "8", icon: Users, color: "text-purple-500" },
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
            <CardTitle className="text-lg">Recent Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
                  <div>
                    <p className="font-semibold text-sm">Rx-2026-00{i}</p>
                    <p className="text-xs text-muted-foreground">Dr. Harrison Vance • Patient: Alice T.</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs">Fulfill</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Low Inventory Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Amoxicillin 500mg', 'Lisinopril 10mg', 'Metformin 500mg', 'Atorvastatin 20mg'].map((med, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <p className="font-semibold text-sm text-red-900 dark:text-red-200">{med}</p>
                  </div>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">&lt; 50 units</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

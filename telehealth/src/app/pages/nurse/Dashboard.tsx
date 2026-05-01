import { Card, CardContent, CardHeader, CardTitle, Button } from "../../components/ui/shared";
import { Stethoscope, Heart, Clock, UserCheck } from "lucide-react";

export function NurseDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nurse Triage Dashboard</h1>
        <Button className="rounded-xl bg-pink-600 hover:bg-pink-700">Start Triage</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Waiting Room", value: "14", icon: Clock, color: "text-amber-500" },
          { title: "Triaged Today", value: "42", icon: UserCheck, color: "text-emerald-500" },
          { title: "Critical Alerts", value: "2", icon: Heart, color: "text-red-500" },
          { title: "Active Doctors", value: "8", icon: Stethoscope, color: "text-blue-500" },
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Live Triage Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { id: "P-492", name: "Sarah Connor", age: 34, reason: "Severe Headache", waitTime: "12m", priority: "High" },
              { id: "P-493", name: "John Doe", age: 45, reason: "Routine Checkup", waitTime: "5m", priority: "Normal" },
              { id: "P-494", name: "Emily Clark", age: 22, reason: "Fever and Cough", waitTime: "2m", priority: "Normal" },
            ].map((patient, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex gap-4 items-center">
                  <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    patient.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {patient.priority} Priority
                  </div>
                  <div>
                    <p className="font-bold text-sm">{patient.name} <span className="text-muted-foreground font-normal">({patient.age}y)</span></p>
                    <p className="text-xs text-muted-foreground">Reason: {patient.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">Wait Time</p>
                    <p className="font-bold text-sm">{patient.waitTime}</p>
                  </div>
                  <Button variant="outline" className="rounded-lg h-9 text-xs">Admit & Vitals</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

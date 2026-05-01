import { RefreshCw, Users, ArrowRightLeft, Stethoscope, Search, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../../../../components/ui/shared";

export function DoctorReferralsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-primary" /> Specialist Referrals
          </h1>
          <p className="text-sm text-muted-foreground">Manage outgoing and incoming patient referrals.</p>
        </div>
        <Button className="rounded-xl"><Stethoscope className="h-4 w-4 mr-2" /> New Referral</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { title: "Active Outbound", value: "12", icon: ArrowRightLeft, color: "text-blue-500" },
          { title: "Incoming Referrals", value: "3", icon: Users, color: "text-emerald-500" },
          { title: "Pending Consults", value: "5", icon: RefreshCw, color: "text-amber-500" },
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Referrals</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search patients or specialists..." 
                className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { patient: "Alice Thompson", specialist: "Dr. Sarah Johnson (Cardiology)", date: "May 1, 2026", status: "Pending Booking", dir: "Outbound" },
              { patient: "James Brown", specialist: "Dr. Michael Chen (Neurology)", date: "Apr 28, 2026", status: "Consult Completed", dir: "Outbound" },
              { patient: "Emily Clark", specialist: "From Dr. Peterson (General)", date: "Apr 25, 2026", status: "Scheduled", dir: "Inbound" },
            ].map((ref, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex gap-4 items-center">
                  <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    ref.dir === 'Outbound' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {ref.dir}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{ref.patient}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{ref.specialist}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{ref.date}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      {ref.status === 'Consult Completed' && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                      <p className={`text-xs font-semibold ${ref.status === 'Consult Completed' ? 'text-emerald-600' : 'text-amber-600'}`}>{ref.status}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8">View Records</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle, Button } from "../../components/ui/shared";
import { Building2, FileCheck, DollarSign, Activity } from "lucide-react";

export function InsuranceDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Insurance & Billing Dashboard</h1>
        <Button className="rounded-xl">Submit Claim</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Claims Pending", value: "1,204", icon: FileCheck, color: "text-blue-500" },
          { title: "Prior Auths", value: "89", icon: Activity, color: "text-purple-500" },
          { title: "Paid Today", value: "$42.5k", icon: DollarSign, color: "text-emerald-500" },
          { title: "Active Members", value: "24.5k", icon: Building2, color: "text-indigo-500" },
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
          <CardTitle className="text-lg">Recent Claims</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { id: "CLM-9021", status: "Pending", amount: "$150.00", provider: "Dr. H. Vance" },
              { id: "CLM-9022", status: "Approved", amount: "$3,200.00", provider: "General Hospital" },
              { id: "CLM-9023", status: "Denied", amount: "$45.00", provider: "LabCorp" },
              { id: "CLM-9024", status: "In Review", amount: "$850.00", provider: "Dr. S. Johnson" },
            ].map((claim, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex gap-4 items-center">
                  <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    claim.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                    claim.status === 'Denied' ? 'bg-red-100 text-red-700' : 
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {claim.status}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{claim.id}</p>
                    <p className="text-xs text-muted-foreground">{claim.provider}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{claim.amount}</p>
                  <Button variant="link" className="h-auto p-0 text-xs">View Details</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Receipt, Search, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "../../../components/ui/shared";

export function InsuranceAuthorizationsPage() {
  const auths = [
    { id: "PA-7741", patient: "Alice Thompson", procedure: "MRI Brain (CPT 70553)", provider: "Dr. Harrison Vance", submitted: "May 1, 2026", urgency: "Routine", status: "approved" },
    { id: "PA-7740", patient: "Robert Wilson", procedure: "Physical Therapy x12 (CPT 97110)", provider: "Dr. Sarah Kim", submitted: "Apr 30, 2026", urgency: "Routine", status: "pending" },
    { id: "PA-7739", patient: "Maria Garcia", procedure: "Spinal Surgery (CPT 22840)", provider: "Dr. John Peters", submitted: "Apr 28, 2026", urgency: "Urgent", status: "review" },
    { id: "PA-7738", patient: "James Brown", procedure: "Chemotherapy Cycle 3 (CPT 96413)", provider: "Dr. Lisa Chen", submitted: "Apr 25, 2026", urgency: "Urgent", status: "approved" },
    { id: "PA-7737", patient: "Emily Clark", procedure: "Bariatric Surgery (CPT 43644)", provider: "Dr. Mark Singh", submitted: "Apr 20, 2026", urgency: "Elective", status: "denied" },
  ];

  const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
    approved: { label: "Approved", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700" },
    pending: { label: "Pending", icon: Clock, className: "bg-amber-100 text-amber-700" },
    review: { label: "Under Review", icon: AlertCircle, className: "bg-blue-100 text-blue-700" },
    denied: { label: "Denied", icon: XCircle, className: "bg-red-100 text-red-700" },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Receipt className="h-6 w-6 text-blue-600" /> Prior Authorizations</h1>
          <p className="text-sm text-muted-foreground">Review and manage pre-authorization requests for procedures.</p>
        </div>
        <Button className="rounded-xl">New Authorization</Button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Approved", value: "142", color: "text-emerald-500" },
          { label: "Pending Review", value: "28", color: "text-amber-500" },
          { label: "Under Review", value: "9", color: "text-blue-500" },
          { label: "Denied", value: "11", color: "text-red-500" },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-5 text-center">
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground font-semibold mt-1">{s.label}</p>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Authorization Requests</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" placeholder="Search patient or PA ID..." />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b"><tr>{["PA ID","Patient","Procedure","Provider","Submitted","Urgency","Status","Action"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {auths.map((a, i) => {
                const s = statusConfig[a.status];
                return (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold">{a.id}</td>
                    <td className="px-4 py-3 font-semibold">{a.patient}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{a.procedure}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.provider}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.submitted}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded ${a.urgency === "Urgent" ? "bg-red-100 text-red-700" : a.urgency === "Elective" ? "bg-slate-100 text-slate-600" : "bg-muted text-muted-foreground"}`}>{a.urgency}</span></td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${s.className}`}><s.icon className="h-3 w-3" />{s.label}</span></td>
                    <td className="px-4 py-3"><Button variant="outline" size="sm" className="h-7 text-xs">Review</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

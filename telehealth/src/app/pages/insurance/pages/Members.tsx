import { Users, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "../../../components/ui/shared";

export function InsuranceMembersPage() {
  const members = [
    { id: "MBR-00412", name: "Alice Thompson", plan: "Gold Premium", group: "BH-Corporate-01", joined: "Jan 1, 2024", status: "active", claims: 3 },
    { id: "MBR-00411", name: "Robert Wilson", plan: "Silver Standard", group: "Individual", joined: "Mar 15, 2023", status: "active", claims: 12 },
    { id: "MBR-00410", name: "Maria Garcia", plan: "Gold Premium", group: "BH-Corporate-01", joined: "Jan 1, 2024", status: "active", claims: 7 },
    { id: "MBR-00409", name: "James Brown", plan: "Bronze Basic", group: "Individual", joined: "Jun 1, 2022", status: "lapsed", claims: 2 },
    { id: "MBR-00408", name: "Emily Clark", plan: "Silver Standard", group: "BH-SME-05", joined: "Apr 1, 2025", status: "active", claims: 1 },
    { id: "MBR-00407", name: "David Lee", plan: "Gold Premium", group: "BH-Corporate-02", joined: "Feb 1, 2024", status: "active", claims: 5 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-blue-600" /> Member Management</h1>
          <p className="text-sm text-muted-foreground">View and manage all insured members and their plans.</p>
        </div>
        <Button className="rounded-xl">Enroll New Member</Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Members", value: "18,420", color: "text-blue-600" },
          { label: "Active Plans", value: "17,891", color: "text-emerald-500" },
          { label: "Lapsed / Inactive", value: "529", color: "text-red-500" },
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
            <CardTitle>Member Directory</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none" placeholder="Search name or ID..." />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b"><tr>{["Member ID","Full Name","Plan","Group","Since","Claims","Status","Action"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {members.map((m, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold">{m.id}</td>
                  <td className="px-4 py-3 font-semibold">{m.name}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded ${m.plan.startsWith("Gold") ? "bg-amber-100 text-amber-700" : m.plan.startsWith("Silver") ? "bg-slate-200 text-slate-700" : "bg-orange-100 text-orange-700"}`}>{m.plan}</span></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{m.group}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.joined}</td>
                  <td className="px-4 py-3 text-center font-bold">{m.claims}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${m.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{m.status === "active" ? "Active" : "Lapsed"}</span></td>
                  <td className="px-4 py-3"><Button variant="outline" size="sm" className="h-7 text-xs">View</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

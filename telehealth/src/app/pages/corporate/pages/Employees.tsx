import { Users, Search, Activity, Shield, Phone, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "../../../components/ui/shared";

export function CorporateEmployeesPage() {
  const employees = [
    { id: "EMP-001", name: "Sarah Johnson", dept: "Engineering", plan: "Gold Premium", lastVisit: "Apr 28, 2026", visits: 4, status: "active" },
    { id: "EMP-002", name: "Marcus Williams", dept: "Sales", plan: "Silver Standard", lastVisit: "Mar 15, 2026", visits: 2, status: "active" },
    { id: "EMP-003", name: "Linda Chen", dept: "HR", plan: "Gold Premium", lastVisit: "May 1, 2026", visits: 7, status: "active" },
    { id: "EMP-004", name: "Daniel Okafor", dept: "Finance", plan: "Gold Premium", lastVisit: "Apr 10, 2026", visits: 1, status: "active" },
    { id: "EMP-005", name: "Rachel Kim", dept: "Marketing", plan: "Bronze Basic", lastVisit: "Jan 20, 2026", visits: 0, status: "inactive" },
    { id: "EMP-006", name: "James Anderson", dept: "Engineering", plan: "Silver Standard", lastVisit: "Apr 22, 2026", visits: 3, status: "active" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-indigo-600" /> Employee Wellness</h1>
          <p className="text-sm text-muted-foreground">Manage employee health plans and utilization across your organization.</p>
        </div>
        <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700">Invite Employee</Button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Enrolled", value: "248", color: "text-indigo-600" },
          { label: "Active This Month", value: "189", color: "text-emerald-500" },
          { label: "Avg. Visits/Employee", value: "3.2", color: "text-blue-500" },
          { label: "Unused Plans", value: "59", color: "text-amber-500" },
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
            <CardTitle>Employee Directory</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none" placeholder="Search employee..." />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b"><tr>{["ID","Name","Dept","Health Plan","Last Visit","Visits","Status","Action"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {employees.map((e, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold">{e.id}</td>
                  <td className="px-4 py-3 font-semibold">{e.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.dept}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded ${e.plan.startsWith("Gold") ? "bg-amber-100 text-amber-700" : e.plan.startsWith("Silver") ? "bg-slate-200 text-slate-700" : "bg-orange-100 text-orange-700"}`}>{e.plan}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{e.lastVisit}</td>
                  <td className="px-4 py-3 text-center font-bold">{e.visits}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${e.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{e.status === "active" ? "Active" : "Inactive"}</span></td>
                  <td className="px-4 py-3"><Button variant="outline" size="sm" className="h-7 text-xs">Manage</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

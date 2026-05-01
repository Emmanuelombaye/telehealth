import { Search, Filter, Video, MessageSquare, FileText, ChevronRight, Activity } from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../../components/ui/shared";

const patients = [
  { id: 1, name: "Alice Thompson", age: 34, condition: "Hypertension", lastVisit: "May 1", status: "Active", avatar: "AT", risk: "low" },
  { id: 2, name: "Robert Wilson", age: 58, condition: "Type 2 Diabetes", lastVisit: "Apr 28", status: "Active", avatar: "RW", risk: "high" },
  { id: 3, name: "Sarah Miller", age: 27, condition: "Anxiety Disorder", lastVisit: "Apr 22", status: "Active", avatar: "SM", risk: "medium" },
  { id: 4, name: "James Brown", age: 45, condition: "Hyperlipidemia", lastVisit: "Apr 15", status: "Inactive", avatar: "JB", risk: "low" },
  { id: 5, name: "Maria Garcia", age: 62, condition: "Atrial Fibrillation", lastVisit: "May 5", status: "Active", avatar: "MG", risk: "high" },
];

const riskColors = { low: "bg-emerald-100 text-emerald-700", medium: "bg-amber-100 text-amber-700", high: "bg-red-100 text-red-700" };

export function DoctorPatientsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Patient Management</h1>
        <span className="text-sm text-muted-foreground">{patients.length} patients</span>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Search patients..." />
        </div>
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5"><Filter className="h-4 w-4" /> Filter</Button>
      </div>
      <div className="space-y-2">
        {patients.map(p => (
          <Card key={p.id} className="hover:border-primary/40 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">{p.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{p.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${riskColors[p.risk as keyof typeof riskColors]}`}>{p.risk} risk</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.condition} · Age {p.age} · Last: {p.lastVisit}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl text-primary"><Video className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl"><MessageSquare className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl"><FileText className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

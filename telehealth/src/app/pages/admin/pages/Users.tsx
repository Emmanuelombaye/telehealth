import { Users, Search, Filter, Edit2, ShieldOff, MoreVertical, Shield } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared";

const users = [
  { id: 1, name: "Alice Thompson", email: "alice@email.com", role: "patient", status: "active", joined: "Jan 15, 2026", country: "🇺🇸" },
  { id: 2, name: "Dr. Sarah Johnson", email: "sarah.j@brandanhealth.com", role: "doctor", status: "active", joined: "Dec 1, 2025", country: "🇺🇸" },
  { id: 3, name: "Robert Wilson", email: "robert.w@email.com", role: "patient", status: "active", joined: "Feb 20, 2026", country: "🇬🇧" },
  { id: 4, name: "Dr. Michael Chen", email: "m.chen@brandanhealth.com", role: "doctor", status: "active", joined: "Nov 15, 2025", country: "🇨🇳" },
  { id: 5, name: "James Brown", email: "james.b@email.com", role: "patient", status: "suspended", joined: "Mar 5, 2026", country: "🇺🇸" },
  { id: 6, name: "Nurse Maria Lopez", email: "m.lopez@brandanhealth.com", role: "staff", status: "active", joined: "Jan 8, 2026", country: "🇪🇸" },
];

const roleColors = { patient: "bg-blue-100 text-blue-700 dark:bg-blue-950/40", doctor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40", staff: "bg-purple-100 text-purple-700 dark:bg-purple-950/40", admin: "bg-slate-100 text-slate-700 dark:bg-slate-950/40" };

export function AdminUsersPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">User Management</h1>
        <Button size="sm" className="rounded-full gap-1.5 text-xs"><Users className="h-3.5 w-3.5" /> Invite User</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{ label: "Total Users", value: "4,860", color: "text-primary" }, { label: "Patients", value: "4,500", color: "text-blue-600" }, { label: "Doctors", value: "240", color: "text-emerald-600" }, { label: "Staff", value: "120", color: "text-purple-600" }].map((s, i) => (
          <Card key={i} className="border-none bg-muted/50"><CardContent className="p-3 text-center"><p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p><p className="text-[11px] text-muted-foreground">{s.label}</p></CardContent></Card>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Search users..." />
        </div>
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5"><Filter className="h-4 w-4" /></Button>
      </div>
      <div className="space-y-2">
        {users.map(u => (
          <Card key={u.id} className="hover:border-primary/40 transition-colors">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                  {u.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm">{u.name}</p>
                    <span className="text-sm">{u.country}</span>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize", roleColors[u.role as keyof typeof roleColors])}>{u.role}</span>
                    {u.status === "suspended" && <Badge variant="destructive" className="text-[10px]">Suspended</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{u.email} · Joined {u.joined}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl"><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl text-destructive"><ShieldOff className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

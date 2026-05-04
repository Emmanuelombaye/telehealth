import { useState } from "react";
import {
  Users, Search, Filter, Edit2, ShieldOff, Shield,
  ChevronDown, UserCheck, Building2, Eye
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared";

const users = [
  { id: 1, name: "Alice Thompson", email: "alice@branda.health", role: "patient", brand: "Brand A", status: "active", joined: "Jan 15, 2026", country: "🇺🇸", lastSeen: "2m ago" },
  { id: 2, name: "Dr. Sarah Johnson", email: "sarah.j@branda.health", role: "doctor", brand: "Brand A", status: "active", joined: "Dec 1, 2025", country: "🇺🇸", lastSeen: "Online" },
  { id: 3, name: "Robert Wilson", email: "robert.w@brandb.care", role: "patient", brand: "Brand B", status: "active", joined: "Feb 20, 2026", country: "🇬🇧", lastSeen: "1h ago" },
  { id: 4, name: "Dr. Michael Chen", email: "m.chen@brandb.care", role: "doctor", brand: "Brand B", status: "active", joined: "Nov 15, 2025", country: "🇨🇳", lastSeen: "Online" },
  { id: 5, name: "James Brown", email: "james.b@branda.health", role: "patient", brand: "Brand A", status: "suspended", joined: "Mar 5, 2026", country: "🇺🇸", lastSeen: "3d ago" },
  { id: 6, name: "Admin Carlos", email: "carlos@brandc.med", role: "admin", brand: "Brand C", status: "active", joined: "Jun 10, 2025", country: "🇦🇪", lastSeen: "Online" },
  { id: 7, name: "Priya Sharma", email: "priya@brandc.med", role: "patient", brand: "Brand C", status: "active", joined: "Apr 2, 2026", country: "🇮🇳", lastSeen: "30m ago" },
  { id: 8, name: "Dr. Ana Lima", email: "ana@brandd.clinic", role: "doctor", brand: "Brand D", status: "active", joined: "Apr 20, 2026", country: "🇧🇷", lastSeen: "Online" },
  { id: 9, name: "Lucas Oliveira", email: "lucas@brandd.clinic", role: "patient", brand: "Brand D", status: "active", joined: "May 1, 2026", country: "🇧🇷", lastSeen: "5m ago" },
  { id: 10, name: "Sophie Bennett", email: "sophie@branda.health", role: "patient", brand: "Brand A", status: "active", joined: "May 10, 2026", country: "🇺🇸", lastSeen: "Online" },
];

const roleColors: Record<string, string> = {
  patient: "bg-blue-100 text-blue-700 dark:bg-blue-950/40",
  doctor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40",
  admin: "bg-violet-100 text-violet-700 dark:bg-violet-950/40",
  staff: "bg-amber-100 text-amber-700 dark:bg-amber-950/40",
};

const brandColors: Record<string, string> = {
  "Brand A": "bg-purple-100 text-purple-700 dark:bg-purple-950/40",
  "Brand B": "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40",
  "Brand C": "bg-pink-100 text-pink-700 dark:bg-pink-950/40",
  "Brand D": "bg-orange-100 text-orange-700 dark:bg-orange-950/40",
};

export function SuperAdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchBrand = brandFilter === "all" || u.brand === brandFilter;
    return matchSearch && matchRole && matchBrand;
  });

  const counts = {
    total: users.length,
    patients: users.filter(u => u.role === "patient").length,
    doctors: users.filter(u => u.role === "doctor").length,
    admins: users.filter(u => u.role === "admin").length,
    suspended: users.filter(u => u.status === "suspended").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">All Users</h1>
          <p className="text-sm text-muted-foreground">Across all brands</p>
        </div>
        <Button size="sm" className="rounded-full gap-1.5 text-xs bg-violet-600 hover:bg-violet-700">
          <Users className="h-3.5 w-3.5" /> Invite User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total", value: counts.total, color: "text-primary" },
          { label: "Patients", value: counts.patients, color: "text-blue-600" },
          { label: "Doctors", value: counts.doctors, color: "text-emerald-600" },
          { label: "Admins", value: counts.admins, color: "text-violet-600" },
          { label: "Suspended", value: counts.suspended, color: "text-red-600" },
        ].map((s, i) => (
          <Card key={i} className="border-none bg-muted/50">
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
            placeholder="Search users..." />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-violet-500">
          <option value="all">All Roles</option>
          <option value="patient">Patients</option>
          <option value="doctor">Doctors</option>
          <option value="admin">Admins</option>
        </select>
        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
          className="border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-violet-500">
          <option value="all">All Brands</option>
          <option value="Brand A">Brand A</option>
          <option value="Brand B">Brand B</option>
          <option value="Brand C">Brand C</option>
          <option value="Brand D">Brand D</option>
        </select>
      </div>

      {/* User list */}
      <div className="space-y-2">
        {filtered.map(u => (
          <Card key={u.id} className="hover:border-violet-400/40 transition-colors">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center font-bold text-violet-700 text-xs shrink-0">
                  {u.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm">{u.name}</p>
                    <span className="text-sm">{u.country}</span>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize", roleColors[u.role])}>{u.role}</span>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", brandColors[u.brand])}>{u.brand}</span>
                    {u.status === "suspended" && <Badge variant="destructive" className="text-[10px]">Suspended</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <span className={cn("text-[10px] font-semibold shrink-0",
                      u.lastSeen === "Online" ? "text-emerald-600" : "text-muted-foreground")}>
                      {u.lastSeen === "Online" ? "● Online" : u.lastSeen}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl text-violet-600" title="Impersonate">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl">
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl text-destructive">
                    <ShieldOff className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

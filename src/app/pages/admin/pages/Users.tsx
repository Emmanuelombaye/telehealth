import { useEffect, useMemo, useState } from "react";
import { Users, Search, Filter, Edit2, ShieldOff, Loader2 } from "lucide-react";
import { Card, CardContent, Button, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib/auth-store";

type ProfileRow = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  role: string;
  brand_id?: string | null;
  created_at?: string | null;
};

const roleColors: Record<string, string> = {
  patient: "bg-violet-100 text-violet-700 dark:bg-violet-950/40",
  doctor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40",
  brand_admin: "bg-slate-100 text-slate-700 dark:bg-slate-950/40",
  super_admin: "bg-blue-100 text-blue-700 dark:bg-blue-950/40",
  pharmacy: "bg-amber-100 text-amber-800 dark:bg-amber-950/40",
  affiliate: "bg-purple-100 text-purple-700 dark:bg-purple-950/40",
  staff: "bg-purple-100 text-purple-700 dark:bg-purple-950/40",
  admin: "bg-slate-100 text-slate-700 dark:bg-slate-950/40",
};

function displayName(u: ProfileRow) {
  if (u.full_name?.trim()) return u.full_name.trim();
  const n = `${u.first_name || ""} ${u.last_name || ""}`.trim();
  return n || u.email || "User";
}

export function AdminUsersPage() {
  const role = useAuthStore((s) => s.role);
  const brandId = useAuthStore((s) => s.brandId);
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        let query = supabase
          .from("profiles")
          .select("id, email, first_name, last_name, role, brand_id, created_at")
          .order("created_at", { ascending: false });

        if (role === "brand_admin" && brandId) {
          query = query.eq("brand_id", brandId);
        }

        const { data, error } = await query;
        if (error) throw error;
        if (!cancelled) setRows((data || []) as ProfileRow[]);
      } catch (e) {
        console.error(e);
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role, brandId]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (u) =>
        displayName(u).toLowerCase().includes(s) ||
        (u.email || "").toLowerCase().includes(s) ||
        (u.role || "").toLowerCase().includes(s)
    );
  }, [rows, q]);

  const counts = useMemo(() => {
    return {
      total: filtered.length,
      patients: filtered.filter((u) => u.role === "patient").length,
      doctors: filtered.filter((u) => u.role === "doctor").length,
      staff: filtered.filter((u) => u.role === "brand_admin" || u.role === "super_admin").length,
    };
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading directory…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">User Management</h1>
        <Button size="sm" className="gap-1.5 rounded-full text-xs">
          <Users className="h-3.5 w-3.5" /> Invite User
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total Users", value: String(counts.total), color: "text-primary" },
          { label: "Patients", value: String(counts.patients), color: "text-violet-600" },
          { label: "Doctors", value: String(counts.doctors), color: "text-emerald-600" },
          { label: "Staff / Admins", value: String(counts.staff), color: "text-purple-600" },
        ].map((s, i) => (
          <Card key={i} className="border-none bg-muted/50">
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full rounded-xl bg-muted py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Search users…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {!filtered.length && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No profiles returned. Check Row Level Security on <code className="rounded bg-muted px-1">profiles</code> and that{" "}
          <code className="rounded bg-muted px-1">brand_id</code> is set for users in your brand.
        </p>
      )}

      <div className="space-y-2">
        {filtered.map((u) => {
          const rc = roleColors[u.role] || "bg-slate-100 text-slate-700";
          return (
            <Card key={u.id} className="transition-colors hover:border-primary/40">
              <CardContent className="p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xs font-bold text-primary">
                    {displayName(u)
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold">{displayName(u)}</p>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold capitalize", rc)}>{u.role}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {u.email}
                      {u.created_at ? ` · Joined ${new Date(u.created_at).toLocaleDateString()}` : ""}
                      {u.brand_id ? ` · Brand: ${u.brand_id}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 rounded-xl p-0">
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 rounded-xl p-0 text-destructive">
                      <ShieldOff className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

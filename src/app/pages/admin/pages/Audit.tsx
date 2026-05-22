import { useEffect, useMemo, useState } from "react";
import {
  Download, Filter, Search, AlertTriangle, Info, AlertCircle, Lock, Loader2,
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { downloadBrandedReportPdf } from "../../../../lib/brandedExport";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib/auth-store";

type AuditRow = {
  id: string;
  created_at: string;
  actor_email: string | null;
  role: string;
  brand_scope: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  detail: Record<string, unknown> | null;
};

const severityConfig = {
  info: { color: "text-violet-600", bg: "bg-violet-100 dark:bg-violet-950/40", dot: "bg-violet-500", icon: Info },
  medium: { color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/40", dot: "bg-amber-500", icon: AlertCircle },
  high: { color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-950/40", dot: "bg-orange-500", icon: AlertTriangle },
  critical: { color: "text-red-600", bg: "bg-red-100 dark:bg-red-950/40", dot: "bg-red-500 animate-pulse", icon: AlertTriangle },
};

function inferSeverity(action: string): keyof typeof severityConfig {
  const a = action.toLowerCase();
  if (a.includes("suspend") || a.includes("delete") || a.includes("security")) return "critical";
  if (a.includes("refund") || a.includes("export")) return "high";
  if (a.includes("update") || a.includes("note")) return "medium";
  return "info";
}

export function AdminAuditPage() {
  const role = useAuthStore((s) => s.role);
  const brandId = useAuthStore((s) => s.brandId);
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("admin_audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(400);

        if (error?.code === "42P01" || error?.message?.toLowerCase().includes("does not exist")) {
          if (!cancelled) {
            setTableMissing(true);
            setLogs([]);
          }
          return;
        }
        if (error) throw error;

        let rows = (data || []) as AuditRow[];
        if (role === "brand_admin" && brandId) {
          rows = rows.filter((r) => !r.brand_scope || r.brand_scope === brandId);
        }
        if (!cancelled) setLogs(rows);
      } catch (e) {
        console.error(e);
        if (!cancelled) setLogs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchLogs();

    const channel = supabase
      .channel('audit_sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_audit_logs' }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [role, brandId]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return logs;
    return logs.filter(
      (r) =>
        (r.action || "").toLowerCase().includes(s) ||
        (r.actor_email || "").toLowerCase().includes(s) ||
        (r.target_id || "").toLowerCase().includes(s) ||
        (r.role || "").toLowerCase().includes(s)
    );
  }, [logs, q]);

  const exportPdf = async () => {
    const date = new Date().toISOString().slice(0, 10);
    await downloadBrandedReportPdf({
      filename: `admin-audit-${date}.pdf`,
      title: "Admin Audit Trail",
      subtitle: `${filtered.length} events · ${date}`,
      sections: [
        {
          kind: "table",
          headers: ["Time", "Role", "Actor", "Action", "Target", "Brand"],
          rows: filtered.map((r) => [
            r.created_at ? new Date(r.created_at).toLocaleString() : "",
            r.role || "",
            r.actor_email || "",
            r.action || "",
            `${r.target_type || ""} ${r.target_id || ""}`.trim(),
            r.brand_scope || "",
          ]),
        },
      ],
    });
  };

  const counts = useMemo(() => {
    return {
      total: filtered.length,
      critical: filtered.filter((r) => inferSeverity(r.action) === "critical").length,
      high: filtered.filter((r) => inferSeverity(r.action) === "high").length,
    };
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading audit trail…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Audit Logs</h1>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-600">Non-clinical admin actions</span>
          </div>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 rounded-xl text-xs" onClick={exportPdf} disabled={!filtered.length}>
          <Download className="h-3.5 w-3.5" /> Export PDF
        </Button>
      </div>

      {tableMissing && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="p-4 text-sm text-amber-900">
            The <code className="rounded bg-white/80 px-1">admin_audit_logs</code> table is not installed. Run{" "}
            <code className="rounded bg-white/80 px-1">supabase_admin_audit_and_scope.sql</code> in the database SQL editor to
            enable persistent logging.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total Events", value: String(counts.total), color: "text-primary" },
          { label: "Critical", value: String(counts.critical), color: "text-red-600" },
          { label: "High", value: String(counts.high), color: "text-orange-600" },
          { label: "Filtered", value: String(filtered.length), color: "text-violet-600" },
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
            placeholder="Search actions, actors, targets…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>

      <div className="space-y-2">
        {!filtered.length && !tableMissing && (
          <p className="py-10 text-center text-sm text-muted-foreground">No audit events recorded yet.</p>
        )}
        {filtered.map((log) => {
          const sev = inferSeverity(log.action);
          const cfg = severityConfig[sev];
          const Icon = cfg.icon;
          const target = [log.target_type, log.target_id].filter(Boolean).join(" · ");
          const time = new Date(log.created_at).toISOString().replace("T", " ").slice(0, 19) + " UTC";
          return (
            <Card key={log.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", cfg.bg)}>
                    <Icon className={cn("h-4 w-4", cfg.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold">{log.actor_email || "unknown actor"}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {log.role}
                        </Badge>
                        {log.brand_scope && (
                          <Badge variant="outline" className="text-[10px]">
                            {log.brand_scope}
                          </Badge>
                        )}
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold capitalize", cfg.bg, cfg.color)}>
                          {sev}
                        </span>
                      </div>
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{time}</span>
                    </div>
                    <p className="mt-0.5 text-xs">
                      <span className="font-semibold">{log.action}</span>
                      {target ? <span className="text-muted-foreground"> — {target}</span> : null}
                    </p>
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

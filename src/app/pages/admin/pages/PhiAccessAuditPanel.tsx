import { useEffect, useMemo, useState } from "react";
import { Download, Search, Shield, Loader2 } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { downloadBrandedReportPdf } from "../../../../lib/brandedExport";
import type { PhiAccessLogRow } from "../../../../lib/phiAccessAudit";

export function PhiAccessAuditPanel() {
  const [logs, setLogs] = useState<PhiAccessLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("phi_access_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);
        if (cancelled) return;
        if (error) {
          if (error.code === "42P01" || error.message?.includes("does not exist")) {
            setTableMissing(true);
            setLogs([]);
            return;
          }
          throw error;
        }
        setTableMissing(false);
        setLogs((data || []) as PhiAccessLogRow[]);
      } catch (err) {
        console.error("PHI audit fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchLogs();
    const ch = supabase
      .channel("phi_audit_sync")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "phi_access_logs" }, fetchLogs)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return logs;
    return logs.filter(
      (r) =>
        (r.actor_email || "").toLowerCase().includes(s) ||
        r.role.toLowerCase().includes(s) ||
        r.action.toLowerCase().includes(s) ||
        r.resource_type.toLowerCase().includes(s) ||
        (r.resource_id || "").toLowerCase().includes(s) ||
        (r.route_path || "").toLowerCase().includes(s),
    );
  }, [logs, q]);

  const exportPdf = async () => {
    const date = new Date().toISOString().slice(0, 10);
    await downloadBrandedReportPdf({
      filename: `phi-access-audit-${date}.pdf`,
      title: "PHI Access Audit Trail",
      subtitle: `${filtered.length} events · ${date}`,
      sections: [
        {
          kind: "table",
          headers: ["Time", "Actor", "Role", "Action", "Resource", "Subject", "Route"],
          rows: filtered.map((r) => [
            new Date(r.created_at).toISOString().replace("T", " ").slice(0, 19),
            r.actor_email || r.actor_id.slice(0, 8),
            r.role,
            r.action,
            `${r.resource_type}${r.resource_id ? ` · ${r.resource_id}` : ""}`,
            r.subject_user_id ? r.subject_user_id.slice(0, 8) : "—",
            (r.route_path || "").slice(0, 48),
          ]),
        },
      ],
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading PHI access trail…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-600" />
          <p className="text-xs text-muted-foreground max-w-lg">
            Workforce and patient self-service access to clinical routes. Logged on navigation and sensitive exports.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 rounded-xl text-xs shrink-0"
          onClick={exportPdf}
          disabled={!filtered.length}
        >
          <Download className="h-3.5 w-3.5" /> Export PDF
        </Button>
      </div>

      {tableMissing && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="p-4 text-sm text-amber-900">
            Run <code className="rounded bg-white/80 px-1">scripts/sql/RUN_IN_SUPABASE_phi_access_logs.sql</code> in Supabase
            to enable PHI access logging.
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="w-full rounded-xl bg-muted py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Search actor, action, resource, route…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {!filtered.length && !tableMissing && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No PHI access events yet. Open clinical screens while logged in to generate entries.
          </p>
        )}
        {filtered.map((log) => {
          const time = new Date(log.created_at).toISOString().replace("T", " ").slice(0, 19) + " UTC";
          const resource = [log.resource_type, log.resource_id].filter(Boolean).join(" · ");
          return (
            <Card key={log.id} className="hover:border-emerald-200/60 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold">{log.actor_email || log.actor_id.slice(0, 8)}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {log.role}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        log.access_type === "staff" ? "border-emerald-200 text-emerald-700" : "border-slate-200",
                      )}
                    >
                      {log.access_type}
                    </Badge>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">{time}</span>
                </div>
                <p className="mt-1 text-xs">
                  <span className="font-semibold">{log.action}</span>
                  <span className="text-muted-foreground"> — {resource}</span>
                  {log.subject_user_id ? (
                    <span className="text-muted-foreground"> · subject {log.subject_user_id.slice(0, 8)}…</span>
                  ) : null}
                </p>
                {log.route_path ? (
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground truncate">{log.route_path}</p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

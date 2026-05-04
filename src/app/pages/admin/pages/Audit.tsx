import { ShieldCheck, Download, Filter, Search, AlertTriangle, Info, AlertCircle, Lock } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared";

const logs = [
  { id: 1, user: "Dr. Sarah Johnson", action: "Record Access", target: "Patient #8492 — Alice Thompson", ip: "192.168.1.10", time: "2026-05-19 10:02:14 UTC", severity: "info", category: "PHI Access" },
  { id: 2, user: "Admin", action: "Security Policy Update", target: "Firewall Rules — Rule #44", ip: "10.0.0.1", time: "2026-05-19 09:47:33 UTC", severity: "high", category: "Security" },
  { id: 3, user: "System", action: "Automated Backup", target: "Vault-Alpha — 2.4GB", ip: "internal", time: "2026-05-19 03:00:00 UTC", severity: "info", category: "System" },
  { id: 4, user: "Nurse Maria Lopez", action: "Prescription Created", target: "Patient #2210 — Robert Wilson", ip: "192.168.1.22", time: "2026-05-18 14:30:55 UTC", severity: "medium", category: "Clinical" },
  { id: 5, user: "Unknown", action: "Failed Login Attempt (x50)", target: "Admin Portal", ip: "203.0.113.42", time: "2026-05-18 14:02:11 UTC", severity: "critical", category: "Security" },
  { id: 6, user: "Dr. Michael Chen", action: "Lab Order Created", target: "Patient #3301 — Maria Garcia", ip: "192.168.1.15", time: "2026-05-18 11:20:44 UTC", severity: "info", category: "Clinical" },
  { id: 7, user: "Alice Thompson", action: "Patient Login", target: "Patient Portal", ip: "98.12.44.201", time: "2026-05-18 09:15:02 UTC", severity: "info", category: "Auth" },
  { id: 8, user: "Admin", action: "User Account Suspended", target: "James Brown — Patient #1102", ip: "10.0.0.1", time: "2026-05-17 16:44:18 UTC", severity: "high", category: "User Management" },
];

const severityConfig = {
  info: { color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950/40", dot: "bg-blue-500", icon: Info },
  medium: { color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/40", dot: "bg-amber-500", icon: AlertCircle },
  high: { color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-950/40", dot: "bg-orange-500", icon: AlertTriangle },
  critical: { color: "text-red-600", bg: "bg-red-100 dark:bg-red-950/40", dot: "bg-red-500 animate-pulse", icon: AlertTriangle },
};

export function AdminAuditPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Audit Logs</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Lock className="h-3 w-3 text-emerald-500" />
            <span className="text-xs text-emerald-600 font-medium">HIPAA Compliant · Tamper-proof</span>
          </div>
        </div>
        <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-xs"><Download className="h-3.5 w-3.5" /> Export</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: "12,840", color: "text-primary" },
          { label: "Critical", value: "3", color: "text-red-600" },
          { label: "High", value: "18", color: "text-orange-600" },
          { label: "PHI Accesses", value: "2,340", color: "text-blue-600" },
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Search logs..." />
        </div>
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5"><Filter className="h-4 w-4" /> Filter</Button>
      </div>

      <div className="space-y-2">
        {logs.map(log => {
          const cfg = severityConfig[log.severity as keyof typeof severityConfig];
          const Icon = cfg.icon;
          return (
            <Card key={log.id} className={cn("hover:border-primary/30 transition-colors", log.severity === "critical" && "border-red-300 dark:border-red-800")}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
                    <Icon className={cn("h-4 w-4", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold">{log.user}</p>
                        <Badge variant="outline" className="text-[10px]">{log.category}</Badge>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize", cfg.bg, cfg.color)}>{log.severity}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-mono">{log.time.split(" ")[1]}</span>
                    </div>
                    <p className="text-xs mt-0.5">
                      <span className="font-semibold">{log.action}:</span>{" "}
                      <span className="text-muted-foreground">{log.target}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">IP: {log.ip} · {log.time}</p>
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

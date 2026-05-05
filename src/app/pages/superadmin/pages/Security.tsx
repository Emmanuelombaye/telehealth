import { useState } from "react";
import {
  Shield, AlertTriangle, Lock, Search, Filter,
  CheckCircle2, XCircle, Eye, Ban, Globe, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, cn } from "../../../components/ui/shared";

const threats = [
  { id: 1, type: "Brute Force", brand: "Brand B", ip: "203.0.113.42", country: "🇷🇺 Russia", attempts: 82, time: "4m ago", status: "active" },
  { id: 2, type: "Suspicious Login", brand: "Brand A", ip: "198.51.100.7", country: "🇨🇳 China", attempts: 12, time: "1h ago", status: "blocked" },
  { id: 3, type: "API Abuse", brand: "Brand C", ip: "192.0.2.88", country: "🇧🇷 Brazil", attempts: 340, time: "3h ago", status: "blocked" },
];

const auditLogs = [
  { user: "Dr. Sarah Johnson", brand: "Brand A", action: "Prescription Created", target: "Patient #8492", time: "2m ago", severity: "info" },
  { user: "Unknown IP 203.0.113.42", brand: "Brand B", action: "Failed Login ×82", target: "Admin Portal", time: "4m ago", severity: "critical" },
  { user: "Admin Carlos", brand: "Brand C", action: "Product Published", target: "Weight Loss Program", time: "22m ago", severity: "info" },
  { user: "System", brand: "All", action: "Backup Completed", target: "Vault-Alpha", time: "1h ago", severity: "info" },
  { user: "Dr. Ana Lima", brand: "Brand D", action: "Doctor Verified", target: "License #BR-4421", time: "2h ago", severity: "info" },
  { user: "Finance System", brand: "Brand B", action: "Payout Processed", target: "$94,200 → Stripe", time: "3h ago", severity: "medium" },
  { user: "Unknown IP 198.51.100.7", brand: "Brand A", action: "Suspicious Login", target: "Patient Portal", time: "1h ago", severity: "critical" },
];

const blockedIPs = [
  { ip: "203.0.113.42", reason: "Brute Force", brand: "Brand B", blockedAt: "Today 14:02", country: "🇷🇺" },
  { ip: "198.51.100.7", reason: "Suspicious Login", brand: "Brand A", blockedAt: "Today 13:10", country: "🇨🇳" },
  { ip: "192.0.2.88", reason: "API Abuse", brand: "Brand C", blockedAt: "Today 11:30", country: "🇧🇷" },
];

export function SuperAdminSecurityPage() {
  const [tab, setTab] = useState<"threats" | "audit" | "blocked">("threats");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Security Center</h1>
          <p className="text-sm text-muted-foreground">Platform-wide threat monitoring</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-red-500 text-white text-xs gap-1.5 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse inline-block" />
            2 Active Threats
          </Badge>
        </div>
      </div>

      {/* Security score */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Security Score", value: "94/100", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
          { label: "Active Threats", value: "2", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/40" },
          { label: "Blocked IPs", value: "3", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
          { label: "Last Full Scan", value: "30m ago", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
        ].map((s, i) => (
          <Card key={i} className="border-none">
            <CardContent className={`p-4 rounded-xl ${s.bg}`}>
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-muted rounded-2xl p-1 gap-1">
        {(["threats", "audit", "blocked"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 py-2 text-sm font-semibold rounded-xl transition-all capitalize",
              tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>
            {t === "threats" ? `Threats (${threats.filter(x => x.status === "active").length})` :
              t === "audit" ? "Audit Log" : "Blocked IPs"}
          </button>
        ))}
      </div>

      {tab === "threats" && (
        <div className="space-y-3">
          {threats.map(t => (
            <Card key={t.id} className={cn(t.status === "active" && "border-red-300 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10")}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                    t.status === "active" ? "bg-red-100 dark:bg-red-950/40" : "bg-muted")}>
                    <AlertTriangle className={cn("h-5 w-5", t.status === "active" ? "text-red-600" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm">{t.type}</p>
                      <Badge variant={t.status === "active" ? "destructive" : "secondary"} className="text-[10px]">{t.status}</Badge>
                      <span className="text-xs text-muted-foreground">{t.brand}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      IP: <span className="font-mono font-semibold">{t.ip}</span> · {t.country} · {t.attempts} attempts · {t.time}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {t.status === "active" && (
                      <Button size="sm" variant="destructive" className="rounded-xl text-xs h-8 gap-1">
                        <Ban className="h-3.5 w-3.5" /> Block IP
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="rounded-xl text-xs h-8">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "audit" && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="Search audit logs..." />
          </div>
          {auditLogs.map((log, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors border border-border/50">
              <div className={cn("mt-1 h-2 w-2 rounded-full shrink-0",
                log.severity === "critical" ? "bg-red-500 animate-pulse" :
                log.severity === "medium" ? "bg-amber-500" : "bg-emerald-500")} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold">{log.user}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[9px]">{log.brand}</Badge>
                    <span className="text-[10px] text-muted-foreground">{log.time}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{log.action}:</span> {log.target}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "blocked" && (
        <div className="space-y-2">
          {blockedIPs.map((ip, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center shrink-0">
                    <Ban className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-bold text-sm">{ip.ip}</p>
                      <span className="text-sm">{ip.country}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{ip.reason} · {ip.brand} · Blocked {ip.blockedAt}</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs h-8 text-emerald-600 border-emerald-300">
                    Unblock
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

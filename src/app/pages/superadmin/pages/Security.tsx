import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Server,
  Search,
  Smartphone,
  Fingerprint,
  Key,
  ShieldCheck,
  Cloud,
  Zap,
  Shield,
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { motion, AnimatePresence } from "framer-motion";
import { SuperAdminShell, saPanel } from "../../../components/superadmin/SuperAdminShell.tsx";

const threats = [
  { id: 1, type: "Brute Force", brand: "Peak Health", ip: "203.0.113.42", country: "🇷🇺 Russia", attempts: 82, time: "4m ago", status: "active" },
  { id: 2, type: "Suspicious Login", brand: "Bio-Optimizers", ip: "198.51.100.7", country: "🇨🇳 China", attempts: 12, time: "1h ago", status: "blocked" },
];

const auditLogs = [
  { user: "Dr. Sarah Johnson", brand: "Peak Health", action: "Prescription Signed", target: "Patient #8492", time: "2m ago", severity: "info" },
  { user: "Unknown IP 203.0.113.42", brand: "Bio-Optimizers", action: "Failed Login ×82", target: "Admin Portal", time: "4m ago", severity: "critical" },
  { user: "System", brand: "All", action: "Vault Backup", target: "S3-VAULT-ALPHA", time: "1h ago", severity: "info" },
];

export function SuperAdminSecurityPage() {
  const [tab, setTab] = useState<"threats" | "audit" | "vaults" | "auth">("threats");
  const [require2fa, setRequire2fa] = useState(true);

  return (
    <SuperAdminShell
      eyebrow="Security"
      title="Threat surface & access"
      description="Sample incidents and policy toggles for demonstration. Connect SIEM, Supabase Auth logs, and storage metrics for production."
      actions={
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="h-8 border-red-200 bg-red-50 text-xs font-medium text-red-800">
            {threats.length} demo alerts
          </Badge>
          <Button size="sm" className="h-9 rounded-lg bg-slate-900 text-sm font-medium text-white hover:bg-slate-800">
            Run scan (demo)
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {[
          { label: "Security score", value: "94/100", icon: ShieldCheck, tone: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "Open alerts", value: String(threats.length), icon: AlertTriangle, tone: "text-red-700", bg: "bg-red-50" },
          { label: "Vault posture", value: "OK", icon: Server, tone: "text-slate-800", bg: "bg-slate-100" },
          { label: "Last review", value: "14m ago", icon: Clock, tone: "text-blue-700", bg: "bg-blue-50" },
        ].map((s, i) => (
          <Card key={i} className={saPanel}>
            <CardContent className="flex flex-col gap-2 p-4">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", s.bg, s.tone)}>
                <s.icon className="h-4 w-4" />
              </div>
              <p className="text-xl font-semibold tabular-nums text-slate-900">{s.value}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1">
        {(["threats", "audit", "vaults", "auth"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "min-h-9 flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium transition-colors sm:text-[13px]",
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
            )}
          >
            {t === "threats" ? "Threats" : t === "audit" ? "Audit" : t === "vaults" ? "Storage" : "Auth policy"}
          </button>
        ))}
      </div>

      <div className="min-h-[360px]">
        <AnimatePresence mode="wait">
          {tab === "threats" && (
            <motion.div
              key="threats"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid gap-4"
            >
              {threats.map((t) => (
                <Card key={t.id} className={saPanel}>
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">{t.type}</h3>
                          <Badge className="text-[10px] font-medium">{t.status}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          {t.country} · {t.ip} · {t.attempts} attempts · {t.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
                        Block
                      </Button>
                      <Button size="sm" className="h-9 rounded-lg bg-slate-900 text-xs text-white hover:bg-slate-800">
                        Investigate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}

          {tab === "audit" && (
            <motion.div key="audit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Card className={cn(saPanel, "overflow-hidden")}>
                <div className="border-b border-slate-100 px-4 py-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-emerald-500/20 focus:ring-2"
                      placeholder="Filter demo audit entries…"
                      readOnly
                    />
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {auditLogs.map((log, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-slate-50/80 sm:gap-4">
                      <div
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          log.severity === "critical" ? "bg-red-500" : "bg-emerald-500",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900">{log.user}</p>
                        <p className="text-xs text-slate-500">
                          {log.action} · {log.target}
                        </p>
                      </div>
                      <div className="ml-auto text-right">
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {log.brand}
                        </Badge>
                        <p className="mt-0.5 text-[11px] text-slate-400">{log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {tab === "auth" && (
            <motion.div key="auth" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
              <Card className={saPanel}>
                <CardContent className="space-y-6 p-5 sm:p-6">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Authentication policy</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      UI preview only — persist requirements via your auth provider and Edge policies.
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                        <Fingerprint className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Require two-factor authentication</p>
                        <p className="text-xs text-slate-500">Recommended for all staff accounts</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setRequire2fa(!require2fa)} className="shrink-0 p-1" aria-pressed={require2fa}>
                      <div
                        className={cn(
                          "flex h-8 w-14 items-center rounded-full px-1 transition-colors",
                          require2fa ? "bg-emerald-600" : "bg-slate-300",
                        )}
                      >
                        <motion.div layout className="h-6 w-6 rounded-full bg-white shadow" animate={{ x: require2fa ? 22 : 0 }} />
                      </div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 opacity-90">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-800 shadow-sm">
                        <Key className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Credential issuance</p>
                        <p className="text-xs text-emerald-800/90">Tie to payment / enrollment completion in your workflows</p>
                      </div>
                    </div>
                    <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {tab === "vaults" && (
            <motion.div
              key="vaults"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid gap-4 md:grid-cols-2"
            >
              {[
                { name: "S3-VAULT-PATIENT", region: "us-east-1", files: "142k", status: "AES-256", icon: Cloud },
                { name: "S3-VAULT-LOGS", region: "us-east-1", files: "4.2M", status: "WORM", icon: Server },
                { name: "S3-VAULT-SCRIPTS", region: "us-west-2", files: "89k", status: "Encrypted", icon: Zap },
                { name: "S3-VAULT-IDENTITY", region: "eu-central-1", files: "41k", status: "RBAC", icon: Shield },
              ].map((v, i) => (
                <Card key={i} className={saPanel}>
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                        <v.icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-medium">
                        {v.status}
                      </Badge>
                    </div>
                    <h3 className="font-mono text-sm font-semibold text-slate-900">{v.name}</h3>
                    <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs">
                      <div>
                        <p className="text-slate-500">Region</p>
                        <p className="font-medium text-slate-900">{v.region}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Objects</p>
                        <p className="font-medium text-slate-900">{v.files}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SuperAdminShell>
  );
}

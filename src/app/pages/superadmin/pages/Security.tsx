import { useState, useEffect } from "react";
import {
  Shield, AlertTriangle, Lock, Search, Filter,
  CheckCircle2, XCircle, Eye, Ban, Globe, Clock, Server, Cloud, Smartphone,
  Activity, ShieldCheck, Zap, Globe2, Fingerprint, Radar, Key, EyeOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* SECURITY COCKPIT HEADER */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 bg-white p-10 rounded-[48px] shadow-2xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
             <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
             <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600">Active Threat Mitigation</h1>
          </div>
          <h2 className="text-4xl font-black text-[#0A2E1F] tracking-tight">Security Command</h2>
        </div>

        <div className="flex items-center gap-4 relative z-10">
           <Badge className="bg-red-50 text-red-600 border-red-100 px-6 py-2.5 rounded-full font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">
              2 Platform Threats Active
           </Badge>
           <Button className="h-14 rounded-2xl bg-[#0A2E1F] text-white px-8 font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-emerald-900/10">
              Run Global Scan
           </Button>
        </div>
      </div>

      {/* SECURITY SCORE & MONITORING */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Security Score", value: "94/100", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Active Threats", value: "2", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
          { label: "Vault Integrity", value: "Optimal", icon: Server, color: "text-[#0A2E1F]", bg: "bg-slate-50" },
          { label: "Last Audit", value: "14m ago", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-100/50 rounded-[40px] bg-white p-8 group hover:shadow-emerald-900/5 transition-all">
            <div className={cn("h-14 w-14 rounded-[20px] mb-6 flex items-center justify-center bg-slate-50", s.color)}>
               <s.icon className="h-7 w-7" />
            </div>
            <h3 className="text-3xl font-black text-[#0A2E1F] tracking-tighter">{s.value}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* CONTROL TABS */}
      <div className="flex bg-slate-50 p-2 rounded-[32px] border border-slate-100 gap-2 max-w-4xl mx-auto">
        {(["threats", "audit", "vaults", "auth"] as const).map(t => (
          <button 
            key={t} 
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-4 px-6 rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] transition-all",
              tab === t ? "bg-[#0A2E1F] text-white shadow-2xl shadow-emerald-900/20" : "text-slate-400 hover:text-slate-600"
            )}
          >
            {t === "threats" ? "Active Threats" : t === "audit" ? "Audit Ledger" : t === "vaults" ? "Cloud Vaults" : "Auth Control"}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="max-w-6xl mx-auto min-h-[500px]">
        <AnimatePresence mode="wait">
          {tab === "threats" && (
            <motion.div 
              key="threats"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="grid gap-6"
            >
              {threats.map(t => (
                <Card key={t.id} className="border-none shadow-2xl shadow-slate-100/50 rounded-[48px] bg-white p-10 group overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-30 group-hover:opacity-60 transition-opacity"></div>
                   <div className="flex items-center gap-8 relative z-10">
                      <div className="h-16 w-16 rounded-[24px] bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                         <AlertTriangle className="h-8 w-8" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-2xl font-black text-[#0A2E1F] tracking-tight uppercase">{t.type}</h3>
                            <Badge className="bg-red-500 text-white border-none font-black text-[9px] px-2">{t.status}</Badge>
                         </div>
                         <p className="text-slate-400 font-bold text-sm">
                           Origin: <span className="text-[#0A2E1F] font-black">{t.country} ({t.ip})</span> · {t.attempts} failed attempts · {t.time}
                         </p>
                      </div>
                      <div className="flex gap-3">
                         <Button variant="outline" className="h-12 rounded-xl border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600">Block Identity</Button>
                         <Button className="h-12 rounded-xl bg-[#0A2E1F] text-white px-6">Investigate</Button>
                      </div>
                   </div>
                </Card>
              ))}
            </motion.div>
          )}

          {tab === "audit" && (
            <motion.div 
              key="audit"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[48px] bg-white overflow-hidden">
                 <div className="p-8 border-b border-slate-50">
                    <div className="relative">
                       <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                       <input className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 transition-all"
                         placeholder="Search operational audit logs..." />
                    </div>
                 </div>
                 <div className="divide-y divide-slate-50">
                    {auditLogs.map((log, i) => (
                      <div key={i} className="flex items-center gap-6 p-8 hover:bg-slate-50/50 transition-colors">
                         <div className={cn("h-3 w-3 rounded-full shrink-0", 
                           log.severity === 'critical' ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-emerald-500')} />
                         <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-[#0A2E1F] uppercase tracking-tight">{log.user}</p>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                               {log.action} <span className="mx-2 text-slate-200">|</span> {log.target}
                            </p>
                         </div>
                         <div className="text-right">
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest">{log.brand}</Badge>
                            <p className="text-[10px] font-black text-slate-300 mt-1 uppercase">{log.time}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </Card>
            </motion.div>
          )}

          {tab === "auth" && (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[56px] bg-white p-12 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
                    <Smartphone size={200} />
                 </div>
                 <div className="relative z-10 max-w-2xl">
                    <h3 className="text-3xl font-black text-[#0A2E1F] tracking-tighter mb-4">Multi-Factor Protocol</h3>
                    <p className="text-slate-400 font-medium text-lg leading-relaxed mb-10">
                       Enforce high-fidelity authentication across all platform brand nodes to prevent unauthorized operational access.
                    </p>
                    
                    <div className="space-y-6">
                       <div className="flex items-center justify-between p-8 rounded-[32px] bg-slate-50 border border-slate-100 group hover:border-emerald-500/30 transition-all">
                          <div className="flex items-center gap-6">
                             <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600">
                                <Fingerprint size={28} />
                             </div>
                             <div>
                                <p className="text-lg font-black text-[#0A2E1F] uppercase tracking-tight">Require 2FA</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">All new staff & patient accounts</p>
                             </div>
                          </div>
                          <button onClick={() => setRequire2fa(!require2fa)} className="shrink-0 p-1">
                             <div className={cn("w-16 h-9 rounded-full transition-all flex items-center px-1.5", require2fa ? "bg-emerald-600" : "bg-slate-200")}>
                               <motion.div animate={{ x: require2fa ? 28 : 0 }} className="w-6 h-6 bg-white rounded-full shadow-lg" />
                             </div>
                          </button>
                       </div>

                       <div className="flex items-center justify-between p-8 rounded-[32px] bg-emerald-50 border border-emerald-100 opacity-60">
                          <div className="flex items-center gap-6">
                             <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#0A2E1F]">
                                <Key size={28} />
                             </div>
                             <div>
                                <p className="text-lg font-black text-[#0A2E1F] uppercase tracking-tight">Credential Generation</p>
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1">Strictly AFTER payment gateway success</p>
                             </div>
                          </div>
                          <ShieldCheck size={32} className="text-emerald-600" />
                       </div>
                    </div>
                 </div>
              </Card>
            </motion.div>
          )}
          
          {tab === "vaults" && (
            <motion.div 
              key="vaults"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-2 gap-8"
            >
              {[
                { name: "S3-VAULT-PATIENT", region: "us-east-1", files: "142k", status: "AES-256", icon: Cloud },
                { name: "S3-VAULT-LOGS", region: "us-east-1", files: "4.2M", status: "WORM-LOCK", icon: Server },
                { name: "S3-VAULT-SCRIPTS", region: "us-west-2", files: "89k", status: "ENCRYPTED", icon: Zap },
                { name: "S3-VAULT-IDENTITY", region: "eu-central-1", files: "41k", status: "STRICT-RBAC", icon: ShieldCheck },
              ].map((v, i) => (
                <Card key={i} className="border-none shadow-2xl shadow-slate-100/50 rounded-[48px] bg-white p-10 group hover:-translate-y-2 transition-all">
                   <div className="flex items-center justify-between mb-8">
                      <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-[#0A2E1F] group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                         <v.icon size={28} />
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-700 border-none font-black text-[9px] uppercase tracking-widest px-3">{v.status}</Badge>
                   </div>
                   <h3 className="text-xl font-black text-[#0A2E1F] tracking-tight uppercase mb-6">{v.name}</h3>
                   <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                      <div>
                         <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Node Region</p>
                         <p className="text-sm font-black text-[#0A2E1F] uppercase">{v.region}</p>
                      </div>
                      <div>
                         <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Object Count</p>
                         <p className="text-sm font-black text-[#0A2E1F]">{v.files}</p>
                      </div>
                   </div>
                </Card>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}

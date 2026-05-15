import { useState } from "react";
import { 
  Pill, MapPin, Clock, Loader2, ShoppingBag, 
  ChevronRight, Stethoscope, ShieldCheck, ArrowRight, 
  Download, RefreshCw, Activity, MessageSquare, 
  Phone, AlertCircle, FileText, CheckCircle2,
  Calendar, Lock, Search
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { usePatientStore } from "../../../../lib/patient-store";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";

export function PrescriptionsPage() {
  const navigate = useNavigate();
  const prescriptions = usePatientStore(state => state.prescriptions);
  const fetchPrescriptions = usePatientStore(state => state.fetchPrescriptions);
  const [filter, setFilter] = useState<"all" | "active" | "history">("active");

  const activePrescriptions = prescriptions.filter(p => p.status === 'active');
  const pastPrescriptions = prescriptions.filter(p => p.status !== 'active');

  const getStatusConfig = (s: string) => {
    const config: Record<string, { label: string; color: string; bg: string }> = {
      active: { label: 'Validated', color: 'text-emerald-700', bg: 'bg-emerald-50' },
      fulfilled: { label: 'Fulfilled', color: 'text-blue-700', bg: 'bg-blue-50' },
      expired: { label: 'Expired', color: 'text-slate-400', bg: 'bg-slate-50' },
    };
    return config[s] || { label: s, color: 'text-slate-600', bg: 'bg-slate-50' };
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-10 pb-32 animate-in fade-in duration-700">
      
      {/* ── PRECISION HEADER ── */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-6 border-b border-slate-100 pb-10">
        <div className="space-y-4 text-center md:text-left">
           <div className="flex items-center justify-center md:justify-start gap-2">
              <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-emerald-100 bg-emerald-50 text-[#0A2E1F] px-3 py-1">
                Clinical Ledger
              </Badge>
              <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-100 bg-slate-50 text-slate-400 px-3 py-1">
                PHI Encrypted
              </Badge>
           </div>
           <h1 className="text-3xl font-black text-[#0A2E1F] tracking-tighter uppercase italic">
             Prescription <span className="text-emerald-600 font-serif italic font-normal">Records</span>
           </h1>
           <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">
             Authorized history of active and historical therapies
           </p>
        </div>
        
        <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
           {(["active", "history", "all"] as const).map(f => (
             <button 
               key={f} 
               onClick={() => setFilter(f)}
               className={cn(
                 "px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                 filter === f ? "bg-white text-[#0A2E1F] shadow-sm" : "text-slate-400 hover:text-slate-600"
               )}
             >
                {f} {f === 'active' && activePrescriptions.length > 0 && `(${activePrescriptions.length})`}
             </button>
           ))}
        </div>
      </div>

      {/* ── LISTING SECTION ── */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {(filter === "active" ? activePrescriptions : filter === "history" ? pastPrescriptions : prescriptions).length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center"
            >
               <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-6">
                 <Pill className="h-6 w-6 text-slate-200" />
               </div>
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No Active Therapies</p>
               <p className="text-xs text-slate-400 mt-2">Browse the shop to request a consultation.</p>
            </motion.div>
          ) : (
            <div className="grid gap-4">
              {(filter === "active" ? activePrescriptions : filter === "history" ? pastPrescriptions : prescriptions).map((rx, idx) => {
                const config = getStatusConfig(rx.status);
                return (
                  <motion.div
                    key={rx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Card className="group border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden relative">
                       <CardContent className="p-8">
                          <div className="flex flex-col lg:flex-row items-center gap-10">
                             <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 border", config.bg, "border-slate-50 group-hover:scale-105 transition-transform duration-500")}>
                                <Pill className={cn("h-8 w-8", config.color)} />
                             </div>

                             <div className="flex-1 min-w-0 space-y-4 text-center lg:text-left">
                                <div className="flex flex-col lg:flex-row items-center gap-4">
                                   <h2 className="text-xl font-black text-[#0A2E1F] tracking-tight uppercase italic">{rx.medication}</h2>
                                   <Badge className={cn("px-3 py-0.5 rounded-lg text-[8px] font-black uppercase border-none", config.bg, config.color)}>
                                     {config.label}
                                   </Badge>
                                </div>
                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                   <span className="flex items-center gap-1.5"><Stethoscope size={12} className="text-emerald-500" /> Dr. Marcus Thorne</span>
                                   <span className="flex items-center gap-1.5"><MapPin size={12} className="text-blue-400" /> {rx.pharmacy_name || "VialsRX Express"}</span>
                                   <span className="flex items-center gap-1.5"><RefreshCw size={12} className="text-amber-500" /> {rx.refills_remaining || 0} Refills Left</span>
                                </div>
                                <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-50">
                                   <p className="text-[10px] font-medium text-slate-600 italic">"{rx.dosage} · {rx.frequency}"</p>
                                </div>
                             </div>

                             <div className="shrink-0 flex items-center gap-3">
                                <Button variant="ghost" size="sm" className="h-10 rounded-xl text-slate-400 font-black uppercase text-[9px] tracking-widest px-4 gap-2 hover:bg-slate-50">
                                  <Download size={12} /> PDF
                                </Button>
                                <Button size="sm" className="h-10 rounded-xl bg-[#0A2E1F] hover:bg-emerald-950 text-white font-black uppercase text-[9px] tracking-widest px-6 shadow-lg shadow-emerald-900/10 gap-2">
                                  Request Refill <RefreshCw size={12} />
                                </Button>
                             </div>
                          </div>
                       </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ── CONCIERGE BAR ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-10 rounded-[2.5rem] bg-[#0A2E1F] text-white overflow-hidden relative group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] -mr-16 -mt-16" />
         <div className="relative z-10 flex items-center gap-6">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
               <Activity size={24} className="text-emerald-400" />
            </div>
            <div>
               <p className="text-sm font-black uppercase tracking-tight italic">Clinical Concierge</p>
               <p className="text-[10px] font-medium text-emerald-100/40 uppercase tracking-widest mt-1">24/7 Pharmacy & Medical Board Support</p>
            </div>
         </div>
         <div className="relative z-10 flex gap-4">
            <Button size="sm" className="h-11 rounded-xl bg-white text-[#0A2E1F] hover:bg-emerald-50 font-black uppercase text-[9px] tracking-widest px-6 shadow-xl" onClick={() => navigate('/patient/messages')}>
               Secure Message
            </Button>
            <Button size="sm" variant="outline" className="h-11 rounded-xl border-white/20 text-white hover:bg-white/10 font-black uppercase text-[9px] tracking-widest px-6">
               Call Board
            </Button>
         </div>
      </div>

    </div>
  );
}

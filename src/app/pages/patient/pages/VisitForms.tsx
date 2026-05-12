import { useState } from "react";
import { 
  FileCheck, Clock, CheckCircle2, ChevronRight, 
  Loader2, AlertCircle, ShieldCheck, ArrowRight,
  ClipboardList, Activity, Sparkles, FileText,
  Calendar, Lock
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { usePatientStore } from "../../../../lib/patient-store";
import { motion, AnimatePresence } from "framer-motion";

export function VisitFormsPage() {
  const visitForms = usePatientStore(state => state.visitForms);
  const [loading] = useState(false); // Managed globally via AppLayout polling

  const pendingForms = visitForms.filter(f => f.status === 'pending');
  const completedForms = visitForms.filter(f => f.status === 'completed');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <div className="h-16 w-16 rounded-[2rem] border-4 border-[#0A2E1F]/10 border-t-[#0A2E1F] animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Syncing Clinical Documents</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-12 pb-32 animate-in fade-in duration-1000">
      
      {/* ── LUXURY HEADER ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-10 border-b border-slate-50 pb-12">
        <div className="text-center md:text-left">
           <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-xl bg-emerald-50 text-[#0A2E1F] border border-emerald-100">
                Authorized Documentation
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                SSL SECURED
              </span>
           </div>
           <h1 className="text-5xl font-black text-[#0A2E1F] tracking-tighter uppercase italic leading-none">
             Visit <span className="text-emerald-600 font-serif italic font-normal">Forms</span>
           </h1>
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em] mt-4">
             Clinical Questionnaires & Consent Records
           </p>
        </div>
        <div className="flex items-center gap-6">
           <div className="h-16 w-16 rounded-[2rem] bg-white shadow-xl shadow-slate-200/50 border border-slate-50 flex items-center justify-center">
              <Lock className="h-6 w-6 text-slate-300" />
           </div>
           <div className="h-16 w-16 rounded-[2rem] bg-[#0A2E1F] shadow-2xl shadow-emerald-900/20 flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-white" />
           </div>
        </div>
      </div>

      {/* ── EXECUTIVE STATUS MATRIX ── */}
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[3rem] p-10 bg-white group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
            <Clock size={80} />
          </div>
          <div className="flex items-center gap-4 mb-8">
             <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100">
                <AlertCircle className="h-6 w-6 text-amber-600" />
             </div>
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Pending Actions</h3>
          </div>
          <p className="text-6xl font-black text-[#0A2E1F] tracking-tighter italic">{pendingForms.length}</p>
          <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mt-4">Immediate Attention Required</p>
        </Card>

        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[3rem] p-10 bg-white group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 size={80} />
          </div>
          <div className="flex items-center gap-4 mb-8">
             <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                <FileCheck className="h-6 w-6 text-emerald-600" />
             </div>
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Clinical Clearances</h3>
          </div>
          <p className="text-6xl font-black text-[#0A2E1F] tracking-tighter italic">{completedForms.length}</p>
          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-4">Verified & Archived</p>
        </Card>
      </div>

      {/* ── AUTHORITATIVE FORM LIST ── */}
      <div className="space-y-8">
        {visitForms.length === 0 ? (
          <Card className="border-none bg-white shadow-2xl shadow-slate-100/50 rounded-[4rem] p-32 text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent" />
             <div className="relative z-10 max-w-lg mx-auto">
                <div className="h-32 w-32 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mx-auto mb-10 shadow-inner border border-slate-100">
                  <ClipboardList className="h-14 w-14 text-slate-200" />
                </div>
                <h3 className="text-3xl font-black text-[#0A2E1F] italic uppercase tracking-tighter leading-none mb-6">No Records <span className="text-slate-300">Found</span></h3>
                <p className="text-slate-400 text-base font-medium leading-relaxed mb-12">
                  Your clinical file is currently up to date. Your attending physician will notify you if additional documentation or consent is required.
                </p>
                <div className="flex items-center justify-center gap-4 text-[9px] font-black text-[#0A2E1F] uppercase tracking-[0.4em] opacity-40">
                   <ShieldCheck size={16} /> Identity Verified • AES-256 Encrypted
                </div>
             </div>
          </Card>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {visitForms.map((form, idx) => {
                const isPending = form.status === 'pending';
                return (
                  <motion.div
                    key={form.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={cn(
                      "group border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.08)] transition-all duration-500 rounded-[2.5rem] overflow-hidden",
                      form.urgent && isPending ? "ring-2 ring-amber-500/20" : ""
                    )}>
                      <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                          <div className={cn(
                            "h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                            isPending ? "bg-amber-50 text-amber-600 shadow-xl shadow-amber-500/10" : "bg-emerald-50 text-emerald-600 shadow-xl shadow-emerald-500/10"
                          )}>
                            {isPending ? <Clock className="h-8 w-8" /> : <CheckCircle2 className="h-8 w-8" />}
                          </div>
                          
                          <div className="flex-1 min-w-0 text-center md:text-left">
                             <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                                <h3 className="font-black text-xl text-[#0A2E1F] uppercase italic tracking-tight">{form.title}</h3>
                                {form.urgent && isPending && (
                                  <span className="px-3 py-1 rounded-lg bg-red-50 text-red-600 text-[8px] font-black uppercase tracking-widest animate-pulse border border-red-100">
                                    Urgent Action
                                  </span>
                                )}
                             </div>
                             <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <div className="flex items-center gap-2">
                                   <Activity size={14} className="text-emerald-500" />
                                   <span>{form.visit_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                   <Calendar size={14} className="text-slate-300" />
                                   <span>Assigned {new Date(form.created_at).toLocaleDateString()}</span>
                                </div>
                             </div>
                          </div>

                          <div className="shrink-0 w-full md:w-auto">
                             {isPending ? (
                               <Button className="w-full md:w-auto h-14 rounded-2xl bg-[#0A2E1F] hover:bg-emerald-950 text-white font-black uppercase text-[10px] tracking-widest px-10 shadow-xl shadow-emerald-900/10 gap-3 group">
                                 Complete Now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                               </Button>
                             ) : (
                               <Button variant="ghost" className="w-full md:w-auto h-14 rounded-2xl border border-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest px-10 gap-3 hover:bg-slate-50">
                                 Review Record <FileText size={14} />
                               </Button>
                             )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── CLINICAL AUTHORITY FOOTER ── */}
      <Card className="border-none bg-slate-50 rounded-[3rem] p-12 text-center relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0A2E1F]/10 to-transparent" />
         <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto">
            <Sparkles className="h-8 w-8 text-emerald-600 opacity-20" />
            <h4 className="text-sm font-black text-[#0A2E1F] uppercase tracking-[0.3em]">Institutional Verification</h4>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed uppercase tracking-widest">
              All documentation is processed through our HIPAA-compliant clinical matrix. Records are digitally signed and verified by the attending physician board.
            </p>
         </div>
      </Card>

    </div>
  );
}

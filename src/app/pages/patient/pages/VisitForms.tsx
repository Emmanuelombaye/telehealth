import { useState } from "react";
import { 
  FileCheck, Clock, CheckCircle2, ChevronRight, 
  Loader2, AlertCircle, ShieldCheck, ArrowRight,
  ClipboardList, Activity, FileText, Lock,
  Search, Filter, History
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { usePatientStore } from "../../../../lib/patient-store";
import { motion, AnimatePresence } from "framer-motion";

export function VisitFormsPage() {
  const visitForms = usePatientStore(state => state.visitForms);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const filteredForms = visitForms.filter(f => {
    if (filter === "all") return true;
    return f.status === filter;
  });

  const pendingCount = visitForms.filter(f => f.status === 'pending').length;

  return (
    <div className="max-w-[1000px] mx-auto space-y-10 pb-32 animate-in fade-in duration-700">
      
      {/* ── PRECISION HEADER ── */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-6 border-b border-slate-100 pb-10">
        <div className="space-y-4 text-center md:text-left">
           <div className="flex items-center justify-center md:justify-start gap-2">
              <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-emerald-100 bg-emerald-50 text-[#0A2E1F] px-3 py-1">
                Clinical Documentation
              </Badge>
              <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-100 bg-slate-50 text-slate-400 px-3 py-1">
                Verified Profile
              </Badge>
           </div>
           <h1 className="text-3xl font-black text-[#0A2E1F] tracking-tighter uppercase italic">
             Visit <span className="text-emerald-600 font-serif italic font-normal">Questionnaires</span>
           </h1>
           <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">
             Manage assigned clinical consent and history forms
           </p>
        </div>
        
        <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
           {(["all", "pending", "completed"] as const).map(f => (
             <button 
               key={f} 
               onClick={() => setFilter(f)}
               className={cn(
                 "px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                 filter === f ? "bg-white text-[#0A2E1F] shadow-sm" : "text-slate-400 hover:text-slate-600"
               )}
             >
                {f} {f === 'pending' && pendingCount > 0 && `(${pendingCount})`}
             </button>
           ))}
        </div>
      </div>

      {/* ── HIGH-DENSITY GRID ── */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredForms.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center"
            >
               <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-6">
                 <FileText className="h-6 w-6 text-slate-200" />
               </div>
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No Documentation Required</p>
               <p className="text-xs text-slate-400 mt-2">Your clinical file is currently up to date.</p>
            </motion.div>
          ) : (
            <div className="grid gap-3">
              {filteredForms.map((form, idx) => {
                const isPending = form.status === 'pending';
                return (
                  <motion.div
                    key={form.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Card className={cn(
                      "group border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden",
                      form.urgent && isPending ? "border-l-4 border-l-amber-500" : "border-l-4 border-l-slate-100"
                    )}>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-6">
                          <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                            isPending ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                          )}>
                            {isPending ? <Clock className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-3 mb-0.5">
                                <h3 className="font-bold text-sm text-[#0A2E1F] uppercase tracking-tight truncate">{form.title}</h3>
                                {form.urgent && isPending && (
                                  <Badge className="bg-amber-100 text-amber-700 text-[8px] font-black uppercase border-none px-2 h-4">Priority</Badge>
                                )}
                             </div>
                             <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><Activity size={12} className="text-emerald-500" /> {form.visit_name}</span>
                                <span className="text-slate-200">|</span>
                                <span>Assigned {new Date(form.created_at).toLocaleDateString()}</span>
                             </div>
                          </div>

                          <div className="shrink-0">
                             {isPending ? (
                               <Button size="sm" className="h-10 rounded-xl bg-[#0A2E1F] hover:bg-emerald-950 text-white font-black uppercase text-[9px] tracking-widest px-6 shadow-lg shadow-emerald-900/10 gap-2">
                                 Start <ArrowRight size={12} />
                               </Button>
                             ) : (
                               <Button variant="ghost" size="sm" className="h-10 rounded-xl text-slate-400 font-black uppercase text-[9px] tracking-widest px-4 gap-2 hover:bg-slate-50">
                                 Review <ChevronRight size={12} />
                               </Button>
                             )}
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

      {/* ── SECURITY FOOTER ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-[2rem] bg-slate-50/50 border border-slate-100">
         <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-slate-100 shadow-sm">
               <ShieldCheck size={18} className="text-emerald-600" />
            </div>
            <div>
               <p className="text-[10px] font-black text-[#0A2E1F] uppercase tracking-widest">Digital Sign-off Required</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Validated against your clinical record</p>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Security Protocol</p>
               <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Active Encryption</p>
            </div>
            <Lock size={16} className="text-slate-200" />
         </div>
      </div>

    </div>
  );
}

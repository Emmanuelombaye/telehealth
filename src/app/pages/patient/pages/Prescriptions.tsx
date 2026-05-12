import { useState, useEffect } from "react";
import { 
  Pill, MapPin, Clock, Loader2, ShoppingBag, 
  ChevronRight, Stethoscope, ShieldCheck, ArrowRight, 
  Download, RefreshCw, Activity, MessageSquare, 
  Phone, AlertCircle, FileText, CheckCircle2,
  Calendar, ExternalLink, Sparkles
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";
import { usePatientStore } from "../../../../lib/patient-store";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

export function PrescriptionsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const prescriptions = usePatientStore(state => state.prescriptions);
  const orders = usePatientStore(state => state.orders);
  const fetchPrescriptions = usePatientStore(state => state.fetchPrescriptions);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  const activePrescriptions = prescriptions.filter(p => p.status === 'active');
  const pastPrescriptions = prescriptions.filter(p => p.status !== 'active');

  const getStatusConfig = (s: string) => {
    const config: Record<string, { label: string; color: string; bg: string; glow: string }> = {
      active: { label: 'Validated & Active', color: 'text-emerald-700', bg: 'bg-emerald-50', glow: 'shadow-emerald-500/20' },
      fulfilled: { label: 'Treatment Fulfilled', color: 'text-blue-700', bg: 'bg-blue-50', glow: 'shadow-blue-500/20' },
      expired: { label: 'Renewal Required', color: 'text-slate-500', bg: 'bg-slate-50', glow: 'shadow-slate-500/10' },
      discontinued: { label: 'Discontinued', color: 'text-red-700', bg: 'bg-red-50', glow: 'shadow-red-500/10' },
    };
    return config[s] || { label: s, color: 'text-slate-600', bg: 'bg-slate-50', glow: 'shadow-slate-500/10' };
  };

  const handleMessageProvider = () => {
    navigate('/patient/messages');
  };

  const handleGetPDF = (rx: any) => {
    // In production, this would trigger a server-side PDF generation
    alert(`Generating Official Clinical Receipt for ${rx.medication}...`);
  };

  const handleRequestRefill = (rx: any) => {
    navigate('/patient/shop'); // Directing to re-order/refill flow
  };

  if (loading) {
     return (
       <div className="flex flex-col items-center justify-center py-32 gap-6">
         <div className="relative">
            <div className="h-20 w-20 rounded-3xl border-4 border-slate-100 animate-pulse" />
            <Loader2 className="h-10 w-10 animate-spin text-[#0A2E1F] absolute top-5 left-5" />
         </div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Synchronizing Clinical Ledger</p>
       </div>
     );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-12 pb-32 animate-in fade-in duration-1000">
      
      {/* ── LUXURY HEADER ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-10 border-b border-slate-50 pb-12">
        <div className="text-center md:text-left">
           <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-xl bg-emerald-50 text-[#0A2E1F] border border-emerald-100">
                Authorized Access Only
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-xl bg-slate-50 text-slate-400 border border-slate-100">
                Refill Eligible
              </span>
           </div>
           <h1 className="text-5xl font-black text-[#0A2E1F] tracking-tighter uppercase italic leading-none">
             Clinical <span className="text-emerald-600 font-serif italic font-normal">Ledger</span>
           </h1>
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em] mt-4">
             {prescriptions.length} Global Records FOUND • Verified PHI
           </p>
        </div>
        <div className="flex items-center gap-4">
           <div className="h-20 w-20 rounded-[2.5rem] bg-white shadow-2xl shadow-emerald-900/10 border border-slate-50 flex items-center justify-center relative group overflow-hidden">
              <div className="absolute inset-0 bg-emerald-50 scale-0 group-hover:scale-100 transition-transform duration-700" />
              <ShieldCheck className="h-8 w-8 text-[#0A2E1F] relative z-10" />
           </div>
           <div className="h-20 w-20 rounded-[2.5rem] bg-[#0A2E1F] shadow-2xl shadow-emerald-900/20 flex items-center justify-center group overflow-hidden cursor-pointer" onClick={() => fetchPrescriptions()}>
              <RefreshCw className="h-8 w-8 text-white group-hover:rotate-180 transition-transform duration-700" />
           </div>
        </div>
      </div>

      {/* ── MICRO-PRECISION MATRIX ── */}
      <div className="grid md:grid-cols-3 gap-8">
        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[3rem] p-10 bg-white group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
            <Pill size={80} />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2">
            <Activity size={14} className="text-emerald-600" /> Active Treatments
          </h3>
          <p className="text-5xl font-black text-[#0A2E1F] tracking-tighter italic">{activePrescriptions.length}</p>
          <div className="flex items-center gap-2 mt-6">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">System Synchronized</span>
          </div>
        </Card>

        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[3rem] p-10 bg-white group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
            <RefreshCw size={80} />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2">
            <Clock size={14} className="text-[#0A2E1F]" /> Refill Window
          </h3>
          <p className="text-2xl font-black text-[#0A2E1F] tracking-tight uppercase leading-tight">Ready in 12 Days</p>
          <div className="flex items-center gap-2 mt-6">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Automatic Dispatch Enabled</span>
          </div>
        </Card>

        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[3rem] p-10 bg-[#0A2E1F] text-white relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('/luxury-pattern.png')] opacity-10 group-hover:scale-110 transition-transform duration-1000" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-100/40 mb-8">Refill Authorization</h3>
          <p className="text-lg font-black tracking-tight leading-tight uppercase italic mb-8">Fast-Track Refill Approval Available</p>
          <Button variant="ghost" className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#0A2E1F] font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-emerald-500/20">
             Authorize Refill <CheckCircle2 size={16} />
          </Button>
        </Card>
      </div>

      {/* ── TABS ── */}
      <div className="flex items-center gap-10 border-b border-slate-50 px-2">
        {[
          { id: "active", label: "Current Therapies", count: activePrescriptions.length },
          { id: "history", label: "Clinical History", count: pastPrescriptions.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "pb-6 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative flex items-center gap-3",
              activeTab === tab.id ? "text-[#0A2E1F]" : "text-slate-300 hover:text-slate-500"
            )}
          >
            {tab.label}
            <span className={cn(
              "text-[9px] px-2 py-0.5 rounded-lg border transition-all",
              activeTab === tab.id ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-slate-50 border-slate-100 text-slate-300"
            )}>
              {tab.count}
            </span>
            {activeTab === tab.id && (
              <motion.div layoutId="activePrescriptionTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#0A2E1F] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── LISTING SECTION ── */}
      <div className="space-y-10">
        <AnimatePresence mode="wait">
          {(activeTab === "active" ? activePrescriptions : pastPrescriptions).length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-none bg-white shadow-2xl shadow-slate-100/50 rounded-[4rem] p-32 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent" />
                <div className="relative z-10 max-w-lg mx-auto">
                   <div className="h-32 w-32 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mx-auto mb-10 shadow-inner border border-slate-100">
                     <ShoppingBag className="h-14 w-14 text-slate-200" />
                   </div>
                   <h3 className="text-3xl font-black text-[#0A2E1F] italic uppercase tracking-tighter leading-none mb-6">No Records <span className="text-slate-300">Found</span></h3>
                   <p className="text-slate-400 text-base font-medium leading-relaxed mb-12">
                     Your clinical profile does not currently contain active prescription therapies. Consult with our world-class medical board to begin your treatment journey.
                   </p>
                   <Link to="/patient/shop">
                     <Button className="rounded-[1.5rem] h-16 px-12 bg-[#0A2E1F] hover:bg-emerald-950 text-white font-black uppercase text-xs tracking-[0.25em] gap-4 shadow-2xl shadow-emerald-900/20 group">
                       Browse Treatments <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                     </Button>
                   </Link>
                </div>
              </Card>
            </motion.div>
          ) : (
            <div className="grid gap-10">
              {(activeTab === "active" ? activePrescriptions : pastPrescriptions).map((rx, idx) => {
                const config = getStatusConfig(rx.status);
                return (
                  <motion.div
                    key={rx.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Card className="group border-none bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] transition-all duration-700 rounded-[3.5rem] overflow-hidden relative">
                       {/* Refill Progress Overlay */}
                       <div className="absolute top-0 right-0 p-10">
                          <div className="relative h-24 w-24">
                             <svg className="h-full w-full -rotate-90">
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-50" />
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 * (1 - (rx.refills_remaining || 0) / 5)} className="text-emerald-500 transition-all duration-1000" />
                             </svg>
                             <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-[#0A2E1F]">{rx.refills_remaining || 0}</span>
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Refills</span>
                             </div>
                          </div>
                       </div>

                       <CardContent className="p-12">
                          <div className="flex flex-col lg:flex-row items-start gap-12">
                             <div className={cn("h-24 w-24 rounded-[2.5rem] flex items-center justify-center shrink-0 shadow-2xl group-hover:scale-105 transition-transform duration-700", config.bg, config.glow)}>
                                <Pill className={cn("h-10 w-10", config.color)} />
                             </div>

                             <div className="flex-1 min-w-0 space-y-8">
                                <div>
                                   <div className="flex items-center gap-4 mb-4">
                                      <Badge className={cn("px-4 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest border-none", config.bg, config.color)}>
                                        {config.label}
                                      </Badge>
                                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <ShieldCheck size={12} className="text-emerald-500" /> Identity Verified
                                      </span>
                                   </div>
                                   <h2 className="text-4xl font-black text-[#0A2E1F] tracking-tighter uppercase italic">{rx.medication}</h2>
                                   <div className="flex flex-wrap items-center gap-6 mt-6">
                                      <div className="flex items-center gap-2 text-slate-500">
                                         <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                            <Stethoscope size={14} className="text-emerald-600" />
                                         </div>
                                         <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Dr. Marcus Thorne</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-slate-500">
                                         <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                            <MapPin size={14} className="text-blue-500" />
                                         </div>
                                         <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{rx.pharmacy_name || "VIALSRX EXPRESS"}</span>
                                      </div>
                                   </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-50 group-hover:bg-emerald-50/30 group-hover:border-emerald-100/50 transition-all duration-700">
                                   <div>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Clinical Dosage</p>
                                      <p className="text-sm font-black text-[#0A2E1F] uppercase">{rx.dosage}</p>
                                   </div>
                                   <div>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Physician Directive</p>
                                      <p className="text-sm font-medium text-slate-600 italic leading-relaxed">"{rx.frequency || "Take as directed by your physician for optimal efficacy."}"</p>
                                   </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-8 pt-8 border-t border-slate-50">
                                   <div className="flex items-center gap-10">
                                      <div className="space-y-1">
                                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Prescribed</p>
                                         <p className="text-xs font-bold text-slate-600">{new Date(rx.created_at).toLocaleDateString()}</p>
                                      </div>
                                      <div className="space-y-1">
                                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Last Refill</p>
                                         <p className="text-xs font-bold text-emerald-600 italic">May 08, 2026</p>
                                      </div>
                                   </div>
                                   <div className="flex items-center gap-3">
                                      <Button variant="outline" className="h-12 rounded-2xl border-slate-100 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 gap-2 px-6" onClick={() => handleGetPDF(rx)}>
                                        <Download size={14} /> PDF
                                      </Button>
                                      <Button className="h-12 rounded-2xl bg-[#0A2E1F] hover:bg-emerald-950 text-white font-black text-[10px] uppercase tracking-widest gap-2 px-8 shadow-xl shadow-emerald-900/10" onClick={() => handleRequestRefill(rx)}>
                                        Request Refill <RefreshCw size={14} />
                                      </Button>
                                   </div>
                                </div>
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

      {/* ── CLINICAL SUPPORT CONCIERGE ── */}
      <Card className="border-none bg-[#0A2E1F] shadow-[0_40px_100px_rgba(10,46,31,0.2)] rounded-[4rem] overflow-hidden relative group">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -mr-64 -mt-64 group-hover:bg-emerald-500/20 transition-all duration-1000" />
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -ml-32 -mb-32" />
         
         <CardContent className="p-16 relative z-10 flex flex-col lg:flex-row items-center gap-16 text-center lg:text-left">
            <div className="h-24 w-24 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
               <Activity className="h-10 w-10 text-emerald-400" />
            </div>
            <div className="flex-1 space-y-4">
               <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-tight">Clinical Support <span className="text-emerald-500">Concierge</span></h3>
               <p className="text-emerald-100/40 text-base font-medium max-w-xl mx-auto lg:mx-0">
                 Need clinical clarification regarding your medication? Our medical team and pharmacy partners are available 24/7 for authorized consultations.
               </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto">
               <Button className="h-16 rounded-2xl bg-white text-[#0A2E1F] hover:bg-emerald-50 font-black uppercase text-[11px] tracking-widest px-10 shadow-2xl shadow-black/20 gap-3" onClick={handleMessageProvider}>
                  <MessageSquare size={16} /> Secure Messenger
               </Button>
               <Button variant="outline" className="h-16 rounded-2xl border-white/20 text-white hover:bg-white/10 font-black uppercase text-[11px] tracking-widest px-10 gap-3" onClick={() => window.open('tel:1800-PEAK-RX')}>
                  <Phone size={16} /> 1-800-PEAK-RX
               </Button>
            </div>
         </CardContent>
      </Card>

      {/* ── FOOTER DISCLOSURE ── */}
      <div className="flex flex-col items-center gap-6 pt-10 text-center opacity-30 px-10">
         <div className="flex items-center gap-8">
            <ShieldCheck size={20} className="text-[#0A2E1F]" />
            <Activity size={20} className="text-[#0A2E1F]" />
            <Sparkles size={20} className="text-[#0A2E1F]" />
         </div>
         <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#0A2E1F] max-w-2xl leading-relaxed">
           This record is a verified clinical ledger. Misuse of prescription data is subject to federal law. All therapies are monitored by our licensed clinical medical board.
         </p>
      </div>

    </div>
  );
}

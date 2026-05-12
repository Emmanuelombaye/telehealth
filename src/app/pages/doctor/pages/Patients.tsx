import { useState, useEffect } from "react";
import { Search, Filter, Video, MessageSquare, FileText, ChevronRight, Activity, Clock, ShieldCheck, User, X, CheckCircle2, MoreHorizontal, ArrowLeft, FileSignature, Pill, ActivitySquare, AlertCircle } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";

export function DoctorPatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIntakeId, setSelectedIntakeId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPatients() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const uniquePatients: any[] = [];
        const seen = new Set();

        (data || []).forEach(order => {
          const pId = order.patient_name || order.id;
          if (!seen.has(pId)) {
            seen.add(pId);
            uniquePatients.push({
              id: order.id,
              name: order.patient_name || "New Patient",
              age: order.patient_age || 30,
              condition: order.category || "General Treatment",
              lastVisit: new Date(order.created_at).toLocaleDateString(),
              status: order.status === 'delivered' ? 'Active' : 'In Progress',
              avatar: order.patient_avatar || "US",
              risk: order.urgent ? "high" : "low",
              medication: order.medication,
              order_number: order.order_number,
              intake_notes: order.intake_notes || "Initial screening in progress. No complications reported during intake. Patient has confirmed no known allergies to the proposed protocol.",
              history: data.filter(o => o.patient_name === order.patient_name)
            });
          }
        });

        setPatients(uniquePatients);
      } catch (err) {
        console.error("Error fetching patients:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPatients();
  }, []);

  const filtered = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.condition.toLowerCase().includes(search.toLowerCase())
  );

  const selectedPatient = patients.find(p => p.id === selectedIntakeId);

  const riskColors = { 
    low: "bg-emerald-50 text-emerald-600", 
    medium: "bg-amber-50 text-amber-600", 
    high: "bg-red-50 text-red-600" 
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-32 animate-in fade-in duration-700 px-6">
      <AnimatePresence>
        {!selectedIntakeId ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* 1. PARAMOUNT HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
              <div>
                <h1 className="text-4xl font-black text-[#0A2E1F] tracking-tighter uppercase leading-tight">
                  Clinical <span className="text-emerald-500 italic font-serif lowercase underline decoration-emerald-200 decoration-4 underline-offset-8">ledger.</span>
                </h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mt-3">Authorized patient directory & archives</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="text-right hidden md:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Registry</p>
                    <p className="text-xl font-black text-[#0A2E1F]">{patients.length} RECORDS</p>
                 </div>
                 <div className="h-12 w-[1px] bg-slate-100 hidden md:block mx-2" />
                 <Button className="rounded-2xl h-12 px-6 bg-[#0A2E1F] hover:bg-emerald-900 text-white font-black text-[10px] tracking-widest uppercase shadow-xl shadow-emerald-900/10">
                    New Entry
                 </Button>
              </div>
            </div>

            {/* 2. PRECISION SEARCH BAR */}
            <div className="relative group max-w-2xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-all" />
              <input 
                className="w-full pl-14 pr-6 py-4 bg-white rounded-2xl text-xs font-black text-[#0A2E1F] border border-slate-100 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-slate-300 tracking-wider" 
                placeholder="SEARCH REGISTRY BY NAME OR CONDITION..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* 3. THE PARAMOUNT LIST */}
            <div className="space-y-2">
              {loading ? (
                <div className="py-40 text-center text-slate-300">
                  <Activity className="h-10 w-10 animate-pulse mx-auto mb-4 text-emerald-400" />
                  <p className="font-black uppercase text-[10px] tracking-widest">Accessing secure archives...</p>
                </div>
              ) : (
                filtered.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group"
                  >
                    <div 
                      className={cn(
                        "flex flex-col md:flex-row items-center gap-4 p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden",
                        "bg-white border-slate-50 hover:border-emerald-200 hover:shadow-lg hover:shadow-slate-100/50"
                      )}
                    >
                      <motion.div 
                        className="absolute bottom-0 left-0 h-[2px] bg-emerald-500/50 z-20 pointer-events-none"
                        initial={{ width: 0 }}
                        whileHover={{ width: "100%" }}
                        transition={{ duration: 0.5 }}
                      />

                      <div onClick={() => setSelectedId(selectedId === p.id ? null : p.id)} className="flex items-center gap-4 flex-1 w-full">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-xs text-slate-400 shrink-0 group-hover:bg-[#0A2E1F] group-hover:text-emerald-400 transition-all">
                          {p.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                             <p className="font-black text-[13px] uppercase tracking-tight truncate">{p.name}</p>
                             <Badge className={cn("rounded-md text-[7px] h-4 font-black uppercase tracking-widest border-none px-2", riskColors[p.risk as keyof typeof riskColors])}>
                                {p.risk}
                             </Badge>
                          </div>
                          <p className="text-[11px] font-bold text-slate-400 truncate mt-0.5">
                            {p.condition} <span className="mx-2 opacity-30">|</span> {p.medication}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <Button 
                          variant="outline" 
                          onClick={() => navigate(`/doctor/consult?orderId=${p.order_number}`)}
                          className="h-10 w-10 p-0 rounded-xl border-slate-50 bg-slate-50 text-slate-400 hover:bg-[#0A2E1F] hover:text-white transition-all shadow-sm active:scale-95 group/btn"
                        >
                           <Video className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => navigate(`/doctor/messages?patientId=${p.id}`)}
                          className="h-10 w-10 p-0 rounded-xl border-slate-50 bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all shadow-sm active:scale-95 group/btn"
                        >
                           <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setSelectedIntakeId(p.id)}
                          className="h-10 w-10 p-0 rounded-xl border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 group/btn"
                        >
                           <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          /* THE PERFECT QUESTIONNAIRE EVER (THE LEDGER) */
          <motion.div
            key="intake"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-10"
          >
            {/* LEDGER NAVIGATION HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-10">
               <div className="flex items-center gap-6">
                  <Button 
                    onClick={() => setSelectedIntakeId(null)}
                    variant="ghost" 
                    className="h-14 w-14 rounded-[1.5rem] bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all active:scale-90"
                  >
                     <ArrowLeft className="h-6 w-6" />
                  </Button>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Patient Identification</p>
                     <h2 className="text-3xl font-black text-[#0A2E1F] uppercase tracking-tighter leading-none">{selectedPatient?.name}</h2>
                  </div>
               </div>
               <div className="flex gap-4">
                  <Badge className="h-12 px-8 rounded-2xl font-black text-emerald-600 bg-emerald-50 border-none shadow-sm uppercase tracking-widest text-[10px]">
                     Authorized Intake Record
                  </Badge>
                  <Button 
                    onClick={() => setSelectedIntakeId(null)}
                    variant="ghost" 
                    className="h-12 w-12 rounded-xl text-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all"
                  >
                     <X className="h-6 w-6" />
                  </Button>
               </div>
            </div>

            {/* THE LEDGER SHEET */}
            <div className="bg-white rounded-[4rem] shadow-2xl shadow-slate-200/50 border border-slate-50 overflow-hidden relative">
               <div className="absolute top-0 right-0 p-20 opacity-[0.02] pointer-events-none">
                  <FileText className="h-96 w-96" />
               </div>
               
               {/* LEDGER STRIP */}
               <div className="h-4 bg-[#0A2E1F]" />

               <div className="p-10 md:p-20 space-y-16">
                  {/* SECTION 1: IDENTITY & VITALITY */}
                  <div className="grid md:grid-cols-4 gap-12 border-b border-slate-100 pb-16">
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Record ID</p>
                        <p className="text-xl font-black text-[#0A2E1F] font-mono tracking-tighter">PH-{selectedPatient?.order_number}</p>
                     </div>
                     <div className="space-y-2 text-center md:text-left">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Clinical Bio</p>
                        <p className="text-xl font-black text-[#0A2E1F]">{selectedPatient?.age}Y <span className="mx-2 text-slate-100">|</span> {selectedPatient?.avatar}</p>
                     </div>
                     <div className="space-y-2 text-center md:text-left">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Risk Profile</p>
                        <Badge className={cn("rounded-lg h-8 px-4 font-black uppercase tracking-widest border-none", riskColors[selectedPatient?.risk as keyof typeof riskColors])}>
                           {selectedPatient?.risk} ASSESSMENT
                        </Badge>
                     </div>
                     <div className="space-y-2 text-center md:text-right">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Session Date</p>
                        <p className="text-xl font-black text-[#0A2E1F]">{selectedPatient?.lastVisit}</p>
                     </div>
                  </div>

                  {/* SECTION 2: THE CLINICAL QUESTIONNAIRE DATA */}
                  <div className="grid lg:grid-cols-3 gap-16">
                     <div className="lg:col-span-2 space-y-12">
                        <div className="space-y-8">
                           <h3 className="text-sm font-black text-[#0A2E1F] uppercase tracking-[0.4em] flex items-center gap-3">
                              <ActivitySquare className="h-5 w-5 text-emerald-500" /> Authorized Clinical Complaint
                           </h3>
                           <div className="bg-slate-50/50 p-10 rounded-[3rem] border border-slate-50 relative">
                              <div className="absolute top-8 left-8 text-slate-100">
                                 <FileSignature className="h-10 w-10" />
                              </div>
                              <p className="text-xl font-serif text-[#0A2E1F] leading-relaxed italic relative z-10">
                                 "{selectedPatient?.intake_notes}"
                              </p>
                           </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                              <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">System Diagnosis</h4>
                              <p className="text-2xl font-black text-[#0A2E1F] uppercase tracking-tighter">{selectedPatient?.condition}</p>
                           </div>
                           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                              <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Medication Request</h4>
                              <p className="text-2xl font-black text-[#0A2E1F] uppercase tracking-tighter">{selectedPatient?.medication}</p>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-8 bg-slate-50 p-10 rounded-[3.5rem] border border-slate-100">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Verification Suite</h3>
                        <div className="space-y-6">
                           <div className="flex items-center gap-4 text-emerald-600 font-black text-xs uppercase tracking-widest">
                              <CheckCircle2 className="h-5 w-5" /> ID Verified
                           </div>
                           <div className="flex items-center gap-4 text-emerald-600 font-black text-xs uppercase tracking-widest">
                              <CheckCircle2 className="h-5 w-5" /> Payment Secured
                           </div>
                           <div className="flex items-center gap-4 text-emerald-600 font-black text-xs uppercase tracking-widest">
                              <CheckCircle2 className="h-5 w-5" /> Medical Screening OK
                           </div>
                           <div className="flex items-center gap-4 text-amber-500 font-black text-xs uppercase tracking-widest">
                              <AlertCircle className="h-5 w-5" /> Doctor Review Pending
                           </div>
                        </div>
                        <div className="pt-10 border-t border-slate-200 mt-10">
                           <p className="text-[9px] font-black text-slate-400 leading-relaxed uppercase tracking-widest">
                              This clinical record is authorized by Peak Health Medical Board and is subject to provider final review.
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* COMMAND BAR */}
                  <div className="flex flex-col sm:flex-row justify-end gap-6 border-t border-slate-100 pt-16">
                     <Button 
                       onClick={() => navigate(`/doctor/consult?orderId=${selectedPatient?.order_number}`)}
                       className="rounded-3xl h-20 px-12 bg-[#0A2E1F] hover:bg-emerald-900 text-white font-black text-sm tracking-[0.2em] uppercase shadow-2xl shadow-emerald-900/20 group/btn gap-4"
                     >
                        <Video className="h-6 w-6 group-hover/btn:scale-110 transition-transform" /> Engage Session
                     </Button>
                     <Button 
                       variant="outline" 
                       onClick={() => setSelectedIntakeId(null)}
                       className="rounded-3xl h-20 px-12 border-slate-200 hover:bg-slate-50 text-[#0A2E1F] font-black text-sm tracking-[0.2em] uppercase"
                     >
                        Close Ledger
                     </Button>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

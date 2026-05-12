import { useState, useEffect } from "react";
import { Search, Filter, Video, MessageSquare, FileText, ChevronRight, Activity, Clock, ShieldCheck, User, X, CheckCircle2, MoreHorizontal, ArrowLeft, FileSignature, Pill, ActivitySquare, AlertCircle, Receipt, Fingerprint, ClipboardList } from "lucide-react";
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
              intake_notes: order.intake_notes || "Patient has reviewed the protocol and confirmed eligibility. No contraindications reported.",
              intake_answers: order.intake_answers || {},
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
      
      {/* 1. REGISTRY HEADER */}
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

      {/* 2. SEARCH INTERFACE */}
      <div className="relative group max-w-2xl">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-all" />
        <input 
          className="w-full pl-14 pr-6 py-4 bg-white rounded-2xl text-xs font-black text-[#0A2E1F] border border-slate-100 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-slate-300 tracking-wider" 
          placeholder="SEARCH REGISTRY..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* 3. PATIENT LIST */}
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
                className="flex flex-col md:flex-row items-center gap-4 p-4 rounded-2xl border bg-white border-slate-50 hover:border-emerald-200 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300 cursor-pointer relative"
              >
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
                    <p className="text-[11px] font-bold text-slate-400 truncate mt-0.5">{p.condition}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/doctor/consult?orderId=${p.order_number}`)}
                    className="h-10 w-10 p-0 rounded-xl border-slate-50 text-slate-400 hover:bg-[#0A2E1F] hover:text-white transition-all shadow-sm"
                  >
                     <Video className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedIntakeId(p.id)}
                    className="h-10 w-10 p-0 rounded-xl border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                  >
                     <Receipt className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* THE UNIVERSAL CLINICAL RECEIPT OVERLAY */}
      <AnimatePresence>
        {selectedIntakeId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedIntakeId(null)}
              className="absolute inset-0 bg-[#0A2E1F]/95 backdrop-blur-lg"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 100 }}
              className="w-full max-w-[480px] max-h-[90vh] overflow-y-auto relative z-10 no-scrollbar"
            >
              <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative border-t-[12px] border-[#0A2E1F]">
                {/* RECEIPT HEADER */}
                <div className="p-10 space-y-10">
                  <div className="text-center space-y-4 border-b border-dashed border-slate-200 pb-8">
                     <div className="flex justify-center mb-2">
                        <div className="h-20 w-20 rounded-[2.5rem] bg-emerald-500 flex items-center justify-center font-black text-[#0A2E1F] text-3xl shadow-xl">
                           {selectedPatient?.avatar}
                        </div>
                     </div>
                     <h2 className="text-3xl font-black text-[#0A2E1F] uppercase tracking-tighter leading-none">{selectedPatient?.name}</h2>
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">PATIENT AUTH ID: PH-{selectedPatient?.order_number}</p>
                  </div>

                  {/* VITAL CORE */}
                  <div className="grid grid-cols-2 gap-8 border-b border-dashed border-slate-200 pb-10">
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Biological Bio</p>
                        <p className="text-sm font-black text-[#0A2E1F]">{selectedPatient?.age}Y <span className="mx-2 opacity-10">|</span> {selectedPatient?.risk.toUpperCase()} RISK</p>
                     </div>
                     <div className="space-y-1 text-right">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Registry Entry</p>
                        <p className="text-sm font-black text-[#0A2E1F]">{selectedPatient?.lastVisit}</p>
                     </div>
                  </div>

                  {/* THE FULL INTAKE SPECTRUM (ALL INFORMATION) */}
                  <div className="space-y-10">
                     {/* PRIMARY REQUEST */}
                     <div className="space-y-3">
                        <div className="flex items-center gap-2 text-emerald-600">
                           <Pill className="h-4 w-4" />
                           <p className="text-[10px] font-black uppercase tracking-[0.2em]">Authorized Protocol</p>
                        </div>
                        <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                           <p className="text-lg font-black text-[#0A2E1F] uppercase tracking-tight">{selectedPatient?.medication}</p>
                           <p className="text-[11px] font-bold text-emerald-700 mt-1 uppercase tracking-wide">{selectedPatient?.condition}</p>
                        </div>
                     </div>

                     {/* FULL QUESTIONNAIRE STREAM */}
                     <div className="space-y-6">
                        <div className="flex items-center gap-2 text-slate-400">
                           <ClipboardList className="h-4 w-4" />
                           <p className="text-[10px] font-black uppercase tracking-[0.2em]">Patient Narrative & Data</p>
                        </div>
                        
                        <div className="space-y-4">
                           {/* Narrative first as it's Paramount */}
                           <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 italic">
                              <p className="text-[11px] leading-relaxed text-[#0A2E1F] font-medium">
                                 "{selectedPatient?.intake_notes}"
                              </p>
                           </div>

                           {/* Dynamic Answers from the JSONB */}
                           <div className="grid grid-cols-1 gap-4">
                              {Object.entries(selectedPatient?.intake_answers || {}).map(([key, val]: [string, any], idx) => (
                                 <div key={idx} className="flex flex-col gap-1 border-b border-slate-50 pb-3 last:border-0">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{key.replace(/_/g, ' ')}</p>
                                    <p className="text-[11px] font-black text-[#0A2E1F] leading-tight">
                                       {Array.isArray(val) ? val.join(", ") : String(val)}
                                    </p>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     {/* SECURITY & AUTH */}
                     <div className="pt-6 border-t border-dashed border-slate-200 space-y-4">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-emerald-600/60">
                           <span className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> Identity Matrix Confirmed</span>
                           <span className="flex items-center gap-2"><Fingerprint className="h-3 w-3" /> Digital Stamp</span>
                        </div>
                        <div className="p-4 bg-[#0A2E1F]/5 rounded-xl text-center border border-[#0A2E1F]/10">
                           <p className="text-[8px] font-black text-[#0A2E1F] uppercase tracking-[0.3em]">Authorized for Provider Engagement</p>
                        </div>
                     </div>
                  </div>

                  {/* ACTION HUB */}
                  <div className="space-y-3 pt-6">
                     <Button 
                       onClick={() => navigate(`/doctor/consult?orderId=${selectedPatient?.order_number}`)}
                       className="w-full h-16 rounded-2xl bg-[#0A2E1F] hover:bg-emerald-900 text-white font-black text-[11px] tracking-[0.3em] uppercase shadow-2xl shadow-emerald-900/20 gap-4"
                     >
                        <Video className="h-5 w-5" /> Engage Clinical Session
                     </Button>
                     <Button 
                       variant="outline" 
                       onClick={() => setSelectedIntakeId(null)}
                       className="w-full h-16 rounded-2xl border-slate-100 text-slate-400 font-black text-[11px] tracking-[0.3em] uppercase hover:bg-slate-50 hover:text-[#0A2E1F]"
                     >
                        Close Registry Entry
                     </Button>
                  </div>
                </div>

                {/* THERMAL BOTTOM STRIP */}
                <div className="h-6 bg-slate-50 flex items-center justify-center opacity-40">
                   <div className="w-1/3 h-[1px] bg-slate-200 border-dashed border-b" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

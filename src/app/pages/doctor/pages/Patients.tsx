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
              intake_notes: order.intake_notes || "Clinical screening complete. Protocol approved.",
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
    <div className="max-w-[1400px] mx-auto space-y-6 pb-32 animate-in fade-in duration-700 px-6">
      
      {/* 1. REGISTRY HEADER (COMPACT) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-[#0A2E1F] tracking-tighter uppercase leading-tight">
            Clinical <span className="text-emerald-500 italic font-serif lowercase">ledger.</span>
          </h1>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] mt-2">Authorized Patient Registry</p>
        </div>
        <div className="flex items-center gap-4">
           <Badge className="h-10 px-6 rounded-xl font-black text-[#0A2E1F] border-none bg-white shadow-sm">
             {patients.length} RECORDS
           </Badge>
           <Button className="rounded-xl h-10 px-6 bg-[#0A2E1F] hover:bg-emerald-900 text-white font-black text-[9px] tracking-widest uppercase">
              New Entry
           </Button>
        </div>
      </div>

      {/* 2. SEARCH (COMPACT) */}
      <div className="relative group max-w-xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
        <input 
          className="w-full pl-12 pr-6 py-3 bg-white rounded-xl text-xs font-black text-[#0A2E1F] border border-slate-100 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" 
          placeholder="SEARCH REGISTRY..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* 3. PATIENT LIST */}
      <div className="space-y-1.5">
        {loading ? (
          <div className="py-40 text-center text-slate-300">
            <Activity className="h-8 w-8 animate-pulse mx-auto mb-4 text-emerald-400" />
            <p className="font-black uppercase text-[9px] tracking-widest">Accessing secure archives...</p>
          </div>
        ) : (
          filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="group"
            >
              <div 
                className="flex flex-col md:flex-row items-center gap-3 p-3 rounded-xl border bg-white border-slate-50 hover:border-emerald-200 hover:shadow-md transition-all duration-300 cursor-pointer relative"
              >
                <div onClick={() => setSelectedId(selectedId === p.id ? null : p.id)} className="flex items-center gap-3 flex-1 w-full">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center font-black text-[10px] text-slate-400 shrink-0 group-hover:bg-[#0A2E1F] group-hover:text-emerald-400 transition-all">
                    {p.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[12px] uppercase tracking-tight truncate">{p.name}</p>
                    <p className="text-[10px] font-bold text-slate-300 truncate">{p.condition}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/doctor/consult?orderId=${p.order_number}`)}
                    className="h-8 w-8 p-0 rounded-lg border-slate-50 text-slate-400 group-hover:bg-[#D4AF37] group-hover:text-white group-hover:border-[#D4AF37] transition-all duration-300 shadow-sm"
                  >
                     <Video className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedIntakeId(p.id)}
                    className="h-8 w-8 p-0 rounded-lg border-emerald-100 bg-emerald-50 text-emerald-600 group-hover:bg-[#D4AF37] group-hover:text-white group-hover:border-[#D4AF37] transition-all duration-300 shadow-sm"
                  >
                     <Receipt className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* THE MICRO-PRECISION CLINICAL MATRIX OVERLAY */}
      <AnimatePresence>
        {selectedIntakeId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedIntakeId(null)}
              className="absolute inset-0 bg-[#0A2E1F]/90 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="w-full max-w-[520px] relative z-10"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col relative border-t-8 border-[#0A2E1F]">
                <div className="p-6 md:p-8 space-y-6">
                  {/* COMPACT HEADER */}
                  <div className="flex items-center gap-4 pb-4 border-b border-dashed border-slate-100">
                     <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center font-black text-[#0A2E1F] text-xl shadow-lg shrink-0">
                        {selectedPatient?.avatar}
                     </div>
                     <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-black text-[#0A2E1F] uppercase tracking-tighter truncate">{selectedPatient?.name}</h2>
                        <div className="flex items-center gap-3">
                           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">PH-{selectedPatient?.order_number}</p>
                           <Badge className={cn("rounded-md text-[7px] h-4 font-black uppercase tracking-widest border-none px-2", riskColors[selectedPatient?.risk as keyof typeof riskColors])}>
                              {selectedPatient?.risk} RISK
                           </Badge>
                        </div>
                     </div>
                     <Button variant="ghost" size="icon" onClick={() => setSelectedIntakeId(null)} className="h-8 w-8 rounded-full text-slate-300 hover:bg-slate-50">
                        <X className="h-4 w-4" />
                     </Button>
                  </div>

                  {/* PROTOCOL SUMMARY (MINIMAL) */}
                  <div className="grid grid-cols-2 gap-4 bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
                     <div>
                        <p className="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest">Protocol Request</p>
                        <p className="text-[11px] font-black text-[#0A2E1F] truncate">{selectedPatient?.medication}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest">Primary Condition</p>
                        <p className="text-[11px] font-black text-[#0A2E1F] truncate">{selectedPatient?.condition}</p>
                     </div>
                  </div>

                  {/* MICRO-MATRIX QUESTIONNAIRE (NO SCROLLING GOAL) */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 text-slate-300">
                        <ClipboardList className="h-3 w-3" />
                        <p className="text-[8px] font-black uppercase tracking-[0.2em]">Full Clinical Matrix</p>
                     </div>
                     
                     {/* 2-COLUMN MICRO GRID */}
                     <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {Object.entries(selectedPatient?.intake_answers || {}).map(([key, val]: [string, any], idx) => (
                           <div key={idx} className="space-y-0.5 border-b border-slate-50 pb-1.5">
                              <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest truncate">{key.replace(/_/g, ' ')}</p>
                              <p className="text-[10px] font-black text-[#0A2E1F] leading-tight line-clamp-2">
                                 {Array.isArray(val) ? val.join(", ") : String(val)}
                              </p>
                           </div>
                        ))}
                     </div>

                     {/* MICRO NARRATIVE */}
                     <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-1">Clinical Narrative</p>
                        <p className="text-[10px] leading-tight text-slate-500 font-medium italic">
                           "{selectedPatient?.intake_notes}"
                        </p>
                     </div>
                  </div>

                  {/* COMPACT ACTION BAR */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                     <Button 
                       onClick={() => navigate(`/doctor/consult?orderId=${selectedPatient?.order_number}`)}
                       className="flex-1 h-12 rounded-xl bg-[#0A2E1F] hover:bg-emerald-900 text-white font-black text-[10px] tracking-widest uppercase gap-3"
                     >
                        <Video className="h-4 w-4" /> Engage Consult
                     </Button>
                     <Button 
                       variant="outline" 
                       onClick={() => setSelectedIntakeId(null)}
                       className="px-6 h-12 rounded-xl border-slate-100 text-slate-400 font-black text-[10px] tracking-widest uppercase hover:bg-slate-50"
                     >
                        Return
                     </Button>
                  </div>
                </div>

                {/* THERMAL STRIP (MICRO) */}
                <div className="h-3 bg-slate-50/50 flex items-center justify-center opacity-30">
                   <div className="w-1/4 h-[1px] bg-slate-200 border-dashed border-b" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

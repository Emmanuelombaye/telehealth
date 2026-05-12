import { useState, useEffect } from "react";
import { Search, Filter, Video, MessageSquare, FileText, ChevronRight, Activity, Clock, ShieldCheck, User, X, CheckCircle2, MoreHorizontal, ArrowLeft, FileSignature, Pill, ActivitySquare, AlertCircle, Receipt, Fingerprint } from "lucide-react";
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
              intake_notes: order.intake_notes || "Initial screening in progress. No complications reported. Patient confirmed protocol understanding.",
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

      {/* CLINICAL RECEIPT SLIP OVERLAY */}
      <AnimatePresence>
        {selectedIntakeId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedIntakeId(null)}
              className="absolute inset-0 bg-[#0A2E1F]/90 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="w-full max-w-[420px] relative z-10"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col relative border-t-[8px] border-[#0A2E1F]">
                {/* SERRATED EDGE TOP */}
                <div className="absolute -top-1 left-0 right-0 h-1 bg-[radial-gradient(circle,transparent_2px,white_2px)] bg-[length:10px_10px] bg-repeat-x z-20 opacity-50" />
                
                <div className="p-8 space-y-8">
                  {/* SLIP HEADER */}
                  <div className="text-center space-y-4 pb-6 border-b border-dashed border-slate-200">
                     <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-[2rem] bg-emerald-500 flex items-center justify-center font-black text-[#0A2E1F] text-2xl rotate-12 shadow-xl">
                           {selectedPatient?.avatar}
                        </div>
                     </div>
                     <div>
                        <h2 className="text-2xl font-black text-[#0A2E1F] uppercase tracking-tighter">{selectedPatient?.name}</h2>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mt-1">Ref ID: PH-{selectedPatient?.order_number}</p>
                     </div>
                  </div>

                  {/* VITAL STREAM */}
                  <div className="space-y-6">
                     <div className="flex justify-between items-end">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Clinical Bio</p>
                        <p className="text-sm font-black text-[#0A2E1F]">{selectedPatient?.age}Y <span className="mx-2 opacity-10">|</span> {selectedPatient?.risk.toUpperCase()} RISK</p>
                     </div>
                     <div className="flex justify-between items-end">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Protocol</p>
                        <p className="text-sm font-black text-emerald-600 uppercase tracking-tighter">{selectedPatient?.medication}</p>
                     </div>
                     <div className="flex justify-between items-end">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Last Entry</p>
                        <p className="text-sm font-black text-slate-600">{selectedPatient?.lastVisit}</p>
                     </div>
                  </div>

                  {/* INTAKE DATA (THE VERTICAL SLIP) */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                     <div>
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Chief Complaint</p>
                        <p className="text-xs font-black text-[#0A2E1F]">{selectedPatient?.condition}</p>
                     </div>
                     <div className="pt-4 border-t border-slate-200/50">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2">Patient Intake Narrative</p>
                        <p className="text-[11px] leading-relaxed text-slate-500 italic font-medium">
                           "{selectedPatient?.intake_notes}"
                        </p>
                     </div>
                  </div>

                  {/* VERIFICATION MARK */}
                  <div className="pt-4 flex items-center justify-center gap-2 text-emerald-600/40 opacity-50">
                     <Fingerprint className="h-4 w-4" />
                     <span className="text-[9px] font-black uppercase tracking-[0.3em]">Authorized Clinical Record</span>
                  </div>

                  {/* COMMAND SUITE */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                     <Button 
                       onClick={() => navigate(`/doctor/consult?orderId=${selectedPatient?.order_number}`)}
                       className="w-full h-14 rounded-2xl bg-[#0A2E1F] hover:bg-emerald-900 text-white font-black text-[10px] tracking-[0.2em] uppercase shadow-xl shadow-emerald-900/10 gap-3"
                     >
                        <Video className="h-4 w-4" /> Engage Video consult
                     </Button>
                     <Button 
                       variant="outline" 
                       onClick={() => setSelectedIntakeId(null)}
                       className="w-full h-14 rounded-2xl border-slate-100 text-[#0A2E1F] font-black text-[10px] tracking-[0.2em] uppercase hover:bg-slate-50"
                     >
                        Return to Registry
                     </Button>
                  </div>
                </div>

                {/* SERRATED EDGE BOTTOM */}
                <div className="h-4 bg-slate-50/50 flex items-center justify-center">
                   <div className="w-1/2 h-[1px] bg-slate-200 border-dashed border-b" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

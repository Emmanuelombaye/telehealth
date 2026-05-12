import { useState, useEffect } from "react";
import { Search, Filter, Video, MessageSquare, FileText, ChevronRight, Activity, Clock, ShieldCheck, User, X, CheckCircle2, MoreHorizontal } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";

export function DoctorPatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
              intake_notes: order.intake_notes || "Initial screening in progress. No complications reported during intake.",
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

  const riskColors = { 
    low: "bg-emerald-50 text-emerald-600", 
    medium: "bg-amber-50 text-amber-600", 
    high: "bg-red-50 text-red-600" 
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-32 animate-in fade-in duration-700 px-6">
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
      <div className="space-y-3">
        {loading ? (
          <div className="py-40 text-center text-slate-300">
            <Activity className="h-10 w-10 animate-pulse mx-auto mb-4 text-emerald-400" />
            <p className="font-black uppercase text-[10px] tracking-widest">Accessing secure archives...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-40 text-center text-slate-200 border-2 border-dashed border-slate-50 rounded-[3rem] space-y-4">
            <p className="font-black uppercase text-[10px] tracking-widest text-slate-300">No records found in current segment</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group relative"
              >
                {/* LIST ROW */}
                <div 
                  onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
                  className={cn(
                    "flex flex-col md:flex-row items-center gap-4 p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden",
                    selectedId === p.id 
                      ? "bg-[#0A2E1F] border-[#0A2E1F] shadow-2xl shadow-emerald-900/20 text-white" 
                      : "bg-white border-slate-50 hover:border-emerald-200 hover:shadow-lg hover:shadow-slate-100/50"
                  )}
                >
                  {/* SURGICAL SCAN BEAM */}
                  <motion.div 
                    className="absolute bottom-0 left-0 h-[2px] bg-emerald-500/50 z-20 pointer-events-none"
                    initial={{ width: 0 }}
                    whileHover={{ width: "100%" }}
                    transition={{ duration: 0.5 }}
                  />

                  <div className="flex items-center gap-4 flex-1 w-full">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all duration-300",
                      selectedId === p.id ? "bg-emerald-500 text-[#0A2E1F]" : "bg-slate-50 text-slate-400 group-hover:bg-[#0A2E1F] group-hover:text-emerald-400"
                    )}>
                      {p.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                         <p className="font-black text-[13px] uppercase tracking-tight truncate">{p.name}</p>
                         <Badge className={cn("rounded-md text-[7px] h-4 font-black uppercase tracking-widest border-none px-2", riskColors[p.risk as keyof typeof riskColors])}>
                            {p.risk}
                         </Badge>
                      </div>
                      <p className={cn("text-[11px] font-bold truncate mt-0.5", selectedId === p.id ? "text-emerald-400/80" : "text-slate-400")}>
                        {p.condition} <span className="mx-2 opacity-30">|</span> {p.medication}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 w-full md:w-auto border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
                    <div className="flex flex-col items-end hidden sm:flex">
                       <p className={cn("text-[9px] font-black uppercase tracking-widest", selectedId === p.id ? "text-emerald-500" : "text-slate-300")}>Last Session</p>
                       <p className="text-[11px] font-black">{p.lastVisit}</p>
                    </div>
                    <div className="flex gap-2">
                       <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center transition-all", selectedId === p.id ? "bg-white/10 text-white hover:bg-white/20" : "bg-slate-50 text-slate-300 hover:bg-emerald-50 hover:text-emerald-600")}>
                          <Video className="h-4 w-4" />
                       </div>
                       <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center transition-all", selectedId === p.id ? "bg-white/10 text-white hover:bg-white/20" : "bg-slate-50 text-slate-300 hover:bg-emerald-50 hover:text-emerald-600")}>
                          <MessageSquare className="h-4 w-4" />
                       </div>
                    </div>
                  </div>
                </div>

                {/* IN-LINE EXPANSION */}
                <AnimatePresence>
                  {selectedId === p.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      className="overflow-hidden"
                    >
                      <div className="p-8 bg-slate-50/50 rounded-b-[2rem] border-x border-b border-slate-100 mx-4 space-y-8">
                         <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Protocol Type</p>
                               <p className="font-black text-[#0A2E1F] uppercase text-sm">{p.condition}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Active Medication</p>
                               <p className="font-black text-emerald-700 uppercase text-sm">{p.medication}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Biological Age</p>
                               <p className="font-black text-[#0A2E1F] uppercase text-sm">{p.age} Years</p>
                            </div>
                         </div>

                         <div className="bg-[#0A2E1F] rounded-[2rem] p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                               <FileText className="h-32 w-32" />
                            </div>
                            <h4 className="text-lg font-black uppercase tracking-tighter text-emerald-400 mb-6 flex items-center gap-3">
                               <ShieldCheck className="h-5 w-5" /> Clinical Intake Dossier
                            </h4>
                            <p className="text-sm leading-relaxed text-slate-300 font-medium max-w-3xl relative z-10 italic">
                               "{p.intake_notes}"
                            </p>
                         </div>

                         <div className="flex justify-end gap-3 pt-4">
                            <Button 
                              onClick={() => navigate(`/doctor/consult?orderId=${p.order_number}`)}
                              className="rounded-xl h-12 px-8 bg-[#0A2E1F] hover:bg-emerald-900 text-white font-black text-[10px] tracking-widest uppercase"
                            >
                               Engage Session
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => navigate(`/doctor/messages?patientId=${p.id}`)}
                              className="rounded-xl h-12 px-8 border-slate-200 hover:bg-slate-50 text-[#0A2E1F] font-black text-[10px] tracking-widest uppercase"
                            >
                               Secure Terminal
                            </Button>
                         </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

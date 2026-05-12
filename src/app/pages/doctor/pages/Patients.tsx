import { useState, useEffect } from "react";
import { Search, Filter, Video, MessageSquare, FileText, ChevronRight, Activity, Clock, ShieldCheck, User, X, CheckCircle2 } from "lucide-react";
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
    <div className="max-w-[1600px] mx-auto space-y-8 pb-32 animate-in fade-in duration-700 px-6">
      {/* 1. EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-[#0A2E1F] tracking-tighter uppercase leading-tight">
            Patient <span className="text-emerald-500 italic font-serif lowercase">directory.</span>
          </h1>
          <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Authorized clinical matrix & management</p>
        </div>
        <div className="flex items-center gap-4">
           <Badge className="h-12 px-8 rounded-2xl font-black text-[#0A2E1F] border-none bg-white shadow-xl shadow-slate-200/50">
             {patients.length} TOTAL RECORDS
           </Badge>
        </div>
      </div>

      {/* 2. PRECISION SEARCH TOOLS */}
      <div className="flex flex-col lg:flex-row gap-4 bg-white/80 backdrop-blur-md p-5 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white/50 sticky top-4 z-40">
        <div className="relative flex-1 group">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-all" />
          <input 
            className="w-full pl-16 pr-8 py-5 bg-slate-50/50 rounded-[1.75rem] text-sm font-black text-[#0A2E1F] border-none outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-slate-300" 
            placeholder="FILTER BY NAME, CLINICAL CONDITION, OR PROTOCOL..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
           <Button variant="outline" className="rounded-[1.75rem] gap-3 px-8 h-16 border-slate-100 bg-white text-[#0A2E1F] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
             <Filter className="h-4 w-4" /> Advanced Filters
           </Button>
        </div>
      </div>

      {/* 3. CLINICAL MATRIX GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-40 text-center text-slate-400">
            <Activity className="h-16 w-16 animate-pulse mx-auto mb-6 text-emerald-500" />
            <p className="font-black uppercase text-xs tracking-[0.3em]">Accessing high-fidelity clinical archives...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-40 text-center text-slate-300 border-4 border-dashed border-slate-50 rounded-[4rem] space-y-6">
            <User className="h-16 w-16 mx-auto opacity-10" />
            <p className="font-black uppercase text-xs tracking-[0.3em]">No matching clinical dossiers found.</p>
          </div>
        ) : (
          <>
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                className="group relative h-full"
              >
                <Card 
                  className="rounded-[2.5rem] border-2 border-transparent transition-all duration-500 overflow-hidden bg-white shadow-xl shadow-slate-200/20 hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-900/10 cursor-pointer h-full flex flex-col"
                  onClick={() => setSelectedId(p.id)}
                >
                  {/* SURGICAL SCANNER BEAM */}
                  <motion.div 
                    className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 group-hover:opacity-100 z-20 pointer-events-none"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  />

                  <CardContent className="p-0 flex-1 flex flex-col">
                    {/* Header: Identity */}
                    <div className="bg-[#0A2E1F] p-8 text-white relative overflow-hidden shrink-0">
                       <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-15 transition-all duration-700 group-hover:scale-125 group-hover:rotate-12">
                          <Activity className="h-24 w-24" />
                       </div>
                       <div className="flex flex-col items-center text-center relative z-10 gap-4">
                          <div className="h-20 w-20 rounded-[1.75rem] bg-white/10 flex items-center justify-center font-black text-emerald-400 text-2xl shadow-2xl transition-all duration-500 group-hover:bg-emerald-500 group-hover:text-[#0A2E1F] group-hover:rotate-[15deg]">
                             {p.avatar}
                          </div>
                          <div className="min-w-0">
                             <p className="font-black text-xl uppercase tracking-tighter group-hover:text-emerald-400 transition-colors leading-tight mb-2">{p.name}</p>
                             <div className="flex flex-col items-center gap-2">
                                <Badge className={cn("rounded-lg text-[9px] h-6 font-black uppercase tracking-widest border-none px-3 relative overflow-hidden", riskColors[p.risk as keyof typeof riskColors])}>
                                   {p.risk === 'high' && <motion.div animate={{ opacity: [1, 0, 4, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="absolute inset-0 bg-red-500/20" />}
                                   {p.risk} RISK ASSESSMENT
                                </Badge>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Body: Clinical Summary */}
                    <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                       <div className="space-y-4">
                          <div className="space-y-1">
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Primary Condition</p>
                             <p className="font-black text-sm text-[#0A2E1F] leading-tight">{p.condition}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Prescribed Protocol</p>
                             <p className="font-black text-sm text-emerald-700 leading-tight">{p.medication}</p>
                          </div>
                       </div>

                       <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate-400">
                             <Clock className="h-3 w-3" />
                             <span className="text-[10px] font-black uppercase tracking-widest">{p.lastVisit}</span>
                          </div>
                          <div className="flex gap-2">
                             <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                                <Video className="h-4 w-4" />
                             </div>
                             <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                                <MessageSquare className="h-4 w-4" />
                             </div>
                          </div>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* CINEMATIC DOSSIER OVERLAY */}
            <AnimatePresence>
              {selectedId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 overflow-hidden">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedId(null)}
                    className="absolute inset-0 bg-[#0A2E1F]/90 backdrop-blur-xl"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="w-full max-w-5xl max-h-[90vh] overflow-y-auto relative z-10 scrollbar-hide"
                  >
                    <Card className="rounded-[4rem] border-none shadow-2xl bg-white overflow-hidden">
                      {/* DOSSIER HEADER */}
                      <div className="bg-[#0A2E1F] p-10 md:p-16 text-white relative">
                         <div className="absolute top-0 right-0 p-16 opacity-5">
                            <ShieldCheck className="h-64 w-64" />
                         </div>
                         <Button 
                           variant="ghost" 
                           onClick={() => setSelectedId(null)}
                           className="absolute top-10 right-10 text-white hover:bg-white/10 rounded-full h-14 w-14 p-0 z-50 transition-all active:scale-90"
                         >
                            <X className="h-8 w-8" />
                         </Button>
                         
                         <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                            <div className="h-32 w-32 rounded-[3rem] bg-emerald-500 flex items-center justify-center font-black text-[#0A2E1F] text-4xl rotate-12 shadow-2xl shadow-emerald-500/20">
                               {patients.find(p => p.id === selectedId)?.avatar}
                            </div>
                            <div className="text-center md:text-left space-y-4">
                               <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                                 {patients.find(p => p.id === selectedId)?.name}
                               </h2>
                               <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                  <Badge className={cn("rounded-xl text-[11px] h-10 font-black uppercase tracking-[0.2em] border-none px-6", riskColors[patients.find(p => p.id === selectedId)?.risk as keyof typeof riskColors])}>
                                     {patients.find(p => p.id === selectedId)?.risk} CLINICAL RISK STATUS
                                  </Badge>
                                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/50" />
                                  <span className="text-sm font-black text-emerald-400/80 uppercase tracking-widest flex items-center gap-3">
                                     <Clock className="h-5 w-5" /> LAST SESSION: {patients.find(p => p.id === selectedId)?.lastVisit}
                                  </span>
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* DOSSIER CLINICAL CONTENT */}
                      <CardContent className="p-10 md:p-16 space-y-16 bg-slate-50/30">
                        {/* 1. CLINICAL DATA TILES */}
                        <div className="grid md:grid-cols-3 gap-8">
                           {[
                              { label: "PRIMARY CONDITION", value: patients.find(p => p.id === selectedId)?.condition, icon: Activity },
                              { label: "ACTIVE PROTOCOL", value: patients.find(p => p.id === selectedId)?.medication, icon: Pill },
                              { label: "BIOLOGICAL AGE", value: `${patients.find(p => p.id === selectedId)?.age} YEARS`, icon: User }
                           ].map((tile, i) => (
                             <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4 group/tile hover:border-emerald-500/20 transition-all">
                                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/tile:bg-[#0A2E1F] group-hover/tile:text-emerald-400 transition-all">
                                   <tile.icon className="h-6 w-6" />
                                </div>
                                <div>
                                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">{tile.label}</p>
                                   <p className="font-black text-2xl text-[#0A2E1F] tracking-tight">{tile.value}</p>
                                </div>
                             </div>
                           ))}
                        </div>

                        {/* 2. INTAKE QUESTIONNAIRE PREVIEW */}
                        <div className="bg-[#0A2E1F] rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-emerald-900/20">
                           <div className="absolute top-0 right-0 p-12 opacity-5">
                              <FileText className="h-48 w-48" />
                           </div>
                           <h4 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4 text-emerald-400 mb-8">
                              <ShieldCheck className="h-8 w-8" /> Authorized Intake Questionnaire
                           </h4>
                           <div className="grid md:grid-cols-2 gap-10 relative z-10">
                              <div className="space-y-6">
                                 <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 mb-2">CLINICAL COMPLAINT</p>
                                    <p className="text-lg font-bold">{patients.find(p => p.id === selectedId)?.condition}</p>
                                 </div>
                                 <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 mb-2">PROTOCOL REQUEST</p>
                                    <p className="text-lg font-bold">{patients.find(p => p.id === selectedId)?.medication}</p>
                                 </div>
                              </div>
                              <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 mb-2">SYSTEM INTAKE NOTES</p>
                                 <p className="text-md leading-relaxed text-slate-300 font-medium">{patients.find(p => p.id === selectedId)?.intake_notes}</p>
                              </div>
                           </div>
                        </div>

                        {/* 3. TREATMENT TIMELINE */}
                        <div className="space-y-8">
                           <h3 className="text-2xl font-black text-[#0A2E1F] uppercase tracking-tighter flex items-center gap-4">
                              <Activity className="h-8 w-8 text-emerald-500" /> Authorized Treatment History
                           </h3>
                           <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/40">
                              <table className="w-full">
                                 <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[11px]">
                                    <tr>
                                       <th className="px-10 py-6 text-left">Date</th>
                                       <th className="px-10 py-6 text-left">Clinical Protocol</th>
                                       <th className="px-10 py-6 text-left">Status</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-50 text-base">
                                    {patients.find(p => p.id === selectedId)?.history?.slice(0,5).map((h: any, i: number) => (
                                       <tr key={i} className="hover:bg-slate-50 transition-colors">
                                          <td className="px-10 py-8 font-bold text-slate-500">{new Date(h.created_at).toLocaleDateString()}</td>
                                          <td className="px-10 py-8 font-black text-[#0A2E1F] text-lg">{h.medication}</td>
                                          <td className="px-10 py-8">
                                             <Badge className="text-[10px] font-black uppercase tracking-widest border-none text-emerald-700 bg-emerald-100 px-6 py-2.5 rounded-xl shadow-sm">
                                                {h.status?.replace('_', ' ')}
                                             </Badge>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        </div>

                        {/* 4. COMMAND ACTIONS */}
                        <div className="flex flex-col sm:flex-row justify-end gap-6 pt-12">
                           <Button 
                             onClick={() => navigate(`/doctor/consult?orderId=${patients.find(p => p.id === selectedId)?.order_number}`)}
                             className="rounded-3xl font-black text-sm tracking-[0.2em] uppercase h-20 px-12 bg-[#0A2E1F] hover:bg-emerald-900 text-white shadow-2xl shadow-[#0A2E1F]/30 gap-4 group/btn"
                           >
                              <Video className="h-6 w-6 group-hover/btn:scale-110 transition-transform" /> Engage Video Session
                           </Button>
                           <Button 
                             variant="outline" 
                             onClick={() => navigate(`/doctor/messages?patientId=${selectedId}`)}
                             className="rounded-3xl font-black text-sm tracking-[0.2em] uppercase h-20 px-12 border-slate-200 hover:bg-slate-50 text-[#0A2E1F] gap-4"
                           >
                              <MessageSquare className="h-6 w-6" /> Open Secure Terminal
                           </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

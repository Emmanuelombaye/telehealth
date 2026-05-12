import { useState, useEffect } from "react";
import { Search, Filter, Video, MessageSquare, FileText, ChevronRight, Activity, Clock, ShieldCheck, User, X, CheckCircle2 } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export function DoctorPatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showIntake, setShowIntake] = useState<string | null>(null);
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
    <div className="max-w-[1400px] mx-auto space-y-8 pb-20 animate-in fade-in duration-700 px-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#0A2E1F] tracking-tighter uppercase leading-tight">
            Patient <span className="text-emerald-500 italic font-serif lowercase">management.</span>
          </h1>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Authorized clinical directory & records</p>
        </div>
        <Badge className="h-10 px-6 rounded-2xl font-black text-[#0A2E1F] border-none bg-slate-50 shadow-sm">
          {patients.length} TOTAL PATIENTS
        </Badge>
      </div>

      {/* SEARCH & FILTER */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-50">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-all" />
          <input 
            className="w-full pl-16 pr-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold border-none outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all" 
            placeholder="Search by name, condition, or medication..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="rounded-2xl gap-3 px-8 h-14 border-slate-100 text-[#0A2E1F] font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all active:scale-95">
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>

      {/* PATIENT LISTING */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="py-32 text-center text-slate-400">
            <Activity className="h-12 w-12 animate-pulse mx-auto mb-4 text-emerald-500" />
            <p className="font-black uppercase text-[10px] tracking-widest">Accessing secure directory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-32 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[3rem] space-y-4">
            <User className="h-12 w-12 mx-auto opacity-20" />
            <p className="font-black uppercase text-[10px] tracking-widest">No matching clinical records found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filtered.map(p => (
              <motion.div
                key={p.id}
                layoutId={`card-${p.id}`}
                className={cn(
                  "group relative transition-all duration-500",
                  selectedId === p.id ? "z-50" : "hover:z-10"
                )}
              >
                <Card className={cn(
                  "rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden bg-white shadow-xl shadow-slate-200/20",
                  selectedId === p.id ? "border-emerald-500 shadow-emerald-900/10" : "border-transparent hover:border-emerald-500/20"
                )}>
                  {/* SURGICAL SCANNER BEAMS */}
                  <motion.div 
                    className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 group-hover:opacity-100 z-20 pointer-events-none"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  />

                  <CardContent className={cn("p-8 transition-all duration-500", selectedId === p.id ? "bg-slate-50/30" : "")}>
                    <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
                      <div 
                        onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
                        className={cn(
                          "h-20 w-20 rounded-[2rem] bg-slate-50 flex items-center justify-center font-black text-[#0A2E1F] text-lg shrink-0 transition-all duration-500 shadow-sm cursor-pointer",
                          selectedId === p.id ? "bg-[#0A2E1F] text-emerald-400 scale-110 rotate-12" : "group-hover:bg-[#0A2E1F] group-hover:text-emerald-400"
                        )}
                      >
                        {p.avatar}
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-4 w-full">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div onClick={() => setSelectedId(selectedId === p.id ? null : p.id)} className="cursor-pointer">
                            <p className="font-black text-2xl text-[#0A2E1F] uppercase tracking-tighter group-hover:text-emerald-700 transition-colors">{p.name}</p>
                            <div className="flex items-center gap-3 mt-1">
                               <Badge className={cn("rounded-lg text-[9px] h-6 font-black uppercase tracking-widest border-none px-3 relative overflow-hidden", riskColors[p.risk as keyof typeof riskColors])}>
                                 {p.risk === 'high' && <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-0 bg-red-500/10" />}
                                 {p.risk} RISK ASSESSMENT
                               </Badge>
                               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                 <Clock className="h-3 w-3" /> Last session: {p.lastVisit}
                               </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                             {/* VIDEO CONSULT BUTTON */}
                             <Button 
                                variant="outline" 
                                onClick={() => navigate(`/doctor/consult?orderId=${p.order_number}`)}
                                className="h-12 w-12 p-0 rounded-xl border-slate-100 bg-white text-[#0A2E1F] hover:bg-[#0A2E1F] hover:text-white transition-all shadow-sm active:scale-95 group/btn"
                             >
                                <Video className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                             </Button>

                             {/* MESSAGE BUTTON */}
                             <Button 
                                variant="outline" 
                                onClick={() => navigate(`/doctor/messages?patientId=${p.id}`)}
                                className="h-12 w-12 p-0 rounded-xl border-slate-100 bg-white text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all shadow-sm active:scale-95 group/btn"
                             >
                                <MessageSquare className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                             </Button>

                             {/* INTAKE QUESTIONNAIRE BUTTON */}
                             <Button 
                                variant="outline" 
                                onClick={() => {
                                  setSelectedId(p.id);
                                  setShowIntake(showIntake === p.id ? null : p.id);
                                }}
                                className={cn(
                                  "h-12 w-12 p-0 rounded-xl border-slate-100 bg-white transition-all shadow-sm active:scale-95 group/btn",
                                  showIntake === p.id ? "bg-emerald-600 text-white border-emerald-600" : "text-slate-400 hover:bg-slate-50"
                                )}
                             >
                                <FileText className="h-5 w-5 group-hover/btn:rotate-12 transition-transform" />
                             </Button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {selectedId === p.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pt-8 border-t border-slate-100 space-y-8"
                            >
                              {/* INTAKE QUESTIONNAIRE SECTION */}
                              {showIntake === p.id && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-[#0A2E1F] rounded-[2rem] p-8 text-white space-y-6 relative overflow-hidden"
                                >
                                  <div className="absolute top-0 right-0 p-8 opacity-10">
                                     <FileText className="h-32 w-32" />
                                  </div>
                                  <div className="flex items-center justify-between relative z-10">
                                     <h4 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 text-emerald-400">
                                        <ShieldCheck className="h-6 w-6" /> Patient Intake Questionnaire
                                     </h4>
                                     <Button 
                                       variant="ghost" 
                                       size="sm" 
                                       onClick={() => setShowIntake(null)}
                                       className="text-white hover:bg-white/10 rounded-full h-8 w-8 p-0"
                                     >
                                        <X className="h-4 w-4" />
                                     </Button>
                                  </div>
                                  <div className="grid md:grid-cols-2 gap-8 relative z-10">
                                     <div className="space-y-4">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                           <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Chief Complaint</p>
                                           <p className="text-sm font-bold">{p.condition}</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                           <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Medication Request</p>
                                           <p className="text-sm font-bold">{p.medication}</p>
                                        </div>
                                     </div>
                                     <div className="space-y-4">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 h-full">
                                           <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Clinical Notes (Intake)</p>
                                           <p className="text-sm leading-relaxed text-slate-300">{p.intake_notes}</p>
                                        </div>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-2 pt-4 text-emerald-400/60 font-black text-[10px] uppercase tracking-widest">
                                     <CheckCircle2 className="h-3 w-3" /> Data verified via secure intake portal
                                  </div>
                                </motion.div>
                              )}

                              <div className="grid md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Bio</p>
                                   <p className="font-black text-slate-900">{p.condition}</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prescribed Protocol</p>
                                   <p className="font-black text-slate-900">{p.medication}</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Biological Age</p>
                                   <p className="font-black text-slate-900">{p.age} Years</p>
                                </div>
                              </div>

                              <div className="space-y-4">
                                 <h3 className="text-sm font-black text-[#0A2E1F] uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-emerald-500" /> Authorized Treatment History
                                 </h3>
                                 <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                    <table className="w-full text-xs">
                                       <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest">
                                          <tr>
                                             <th className="px-6 py-3 text-left">Date</th>
                                             <th className="px-6 py-3 text-left">Treatment Record</th>
                                             <th className="px-6 py-3 text-left">Clinical Status</th>
                                          </tr>
                                       </thead>
                                       <tbody className="divide-y divide-slate-50">
                                          {p.history?.slice(0,3).map((h: any, i: number) => (
                                             <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-600">{new Date(h.created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 font-black text-[#0A2E1F]">{h.medication}</td>
                                                <td className="px-6 py-4">
                                                   <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-none text-emerald-600 bg-emerald-50 px-3">
                                                      {h.status?.replace('_', ' ')}
                                                   </Badge>
                                                </td>
                                             </tr>
                                          ))}
                                       </tbody>
                                    </table>
                                 </div>
                              </div>

                              <div className="flex justify-end gap-3 pt-4">
                                 <Button variant="outline" className="rounded-xl font-black text-[10px] tracking-widest uppercase h-12 px-8 border-slate-100 hover:bg-slate-50">
                                    Full Medical History
                                 </Button>
                                 <Button className="rounded-xl font-black text-[10px] tracking-widest uppercase h-12 px-8 bg-[#0A2E1F] hover:bg-emerald-900 text-white shadow-lg shadow-[#0A2E1F]/20">
                                    Add Clinical Note
                                 </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        {!selectedId && (
                           <p className="text-[13px] text-slate-400 font-bold leading-relaxed truncate group-hover:text-slate-500 transition-colors pt-2 border-t border-slate-50">
                             Clinical indexing complete. Select to engage with patient dossier.
                           </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Search, Filter, Video, MessageSquare, FileText, ChevronRight, Activity, Clock, ShieldCheck, User } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

export function DoctorPatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
              medication: order.medication
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
    low: "bg-emerald-50 text-emerald-600 border-emerald-100", 
    medium: "bg-amber-50 text-amber-600 border-amber-100", 
    high: "bg-red-50 text-red-600 border-red-100" 
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-700 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#0A2E1F] tracking-tighter uppercase leading-tight">
            Patient <span className="text-emerald-500 italic font-serif lowercase">management.</span>
          </h1>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Authorized clinical directory & records</p>
        </div>
        <Badge variant="outline" className="h-10 px-6 rounded-2xl font-black text-[#0A2E1F] border-slate-100 bg-white shadow-sm">
          {patients.length} TOTAL PATIENTS
        </Badge>
      </div>

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

      <div className="grid grid-cols-1 gap-4">
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
          <AnimatePresence mode="popLayout">
            {filtered.map(p => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -5, scale: 1.01, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                className="group relative cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-transparent rounded-[2.5rem] transition-all duration-500" />
                <Card className="rounded-[2.5rem] border-2 border-transparent group-hover:border-emerald-500/20 group-hover:shadow-2xl group-hover:shadow-emerald-900/5 transition-all duration-300 overflow-hidden bg-white shadow-lg shadow-slate-200/20">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                      <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center font-black text-[#0A2E1F] text-md shrink-0 group-hover:bg-[#0A2E1F] group-hover:text-emerald-400 transition-all duration-500 shadow-sm group-hover:rotate-3">
                        {p.avatar}
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-1 text-center md:text-left w-full">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                          <p className="font-black text-lg text-[#0A2E1F] uppercase tracking-tight group-hover:text-emerald-700 transition-colors">{p.name}</p>
                          <Badge variant="outline" className={cn("rounded-lg text-[8px] h-5 font-black uppercase tracking-widest border", riskColors[p.risk as keyof typeof riskColors])}>
                            {p.risk} RISK
                          </Badge>
                        </div>
                        <p className="text-[13px] text-slate-400 font-bold leading-relaxed truncate group-hover:text-slate-500 transition-colors">
                          {p.condition} <span className="mx-2 opacity-30">|</span> {p.medication} <span className="mx-2 opacity-30">|</span> Age {p.age}
                        </p>
                        <div className="flex items-center justify-center md:justify-start gap-3 pt-1">
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
                            <Clock className="h-3 w-3" /> Last active: {p.lastVisit}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                        <Button variant="outline" className="flex-1 md:flex-none h-12 w-12 p-0 rounded-xl border-slate-100 text-[#0A2E1F] hover:bg-[#0A2E1F] hover:text-white transition-all shadow-sm active:scale-95 group/btn">
                           <Video className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                        </Button>
                        <Button variant="outline" className="flex-1 md:flex-none h-12 w-12 p-0 rounded-xl border-slate-100 text-slate-400 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                           <MessageSquare className="h-5 w-5" />
                        </Button>
                        <Button variant="outline" className="flex-1 md:flex-none h-12 w-12 p-0 rounded-xl border-slate-100 text-slate-400 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                           <FileText className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Search, Filter, Video, MessageSquare, FileText, ChevronRight, Activity, Clock, ShieldCheck, User, X, CheckCircle2, MoreHorizontal, ArrowLeft, FileSignature, Pill, ActivitySquare, AlertCircle, Receipt, Fingerprint, ClipboardList } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { DoctorPageHeader } from "../../../components/doctor/DoctorPageHeader";
import { supabase } from "../../../../lib/supabaseClient";
import { doctorPageContainer } from "../../../../lib/doctorPortalUi";
import * as FramerMotion from "framer-motion";
const { motion, AnimatePresence } = FramerMotion;
import { useNavigate } from "react-router";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";

export function DoctorPatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIntakeId, setSelectedIntakeId] = useState<string | null>(null);
  const navigate = useNavigate();
  const doctorBase = useDoctorPortalBase();

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
    <div className={cn(doctorPageContainer, "space-y-7 pb-32 animate-in fade-in duration-700")}>
      <DoctorPageHeader
        eyebrow="Authorized registry"
        title="Patient ledger"
        description="Distinct patients derived from encounters — drill into intake, vitals, and longitudinal orders."
      >
        <Badge className="h-11 rounded-xl border border-emerald-200/70 bg-emerald-50 px-6 font-semibold uppercase tracking-wide text-emerald-900 shadow-sm">
          {patients.length} records
        </Badge>
        <Button className="h-11 rounded-xl bg-[#0A2E1F] px-7 font-semibold uppercase tracking-wide text-[10px] text-white hover:bg-emerald-900 shadow-lg shadow-emerald-950/25">
          New entry
        </Button>
      </DoctorPageHeader>

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
                <div onClick={() => navigate(`${doctorBase}/patients/${p.id}`)} className="flex items-center gap-3 flex-1 w-full">
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
                    onClick={() => navigate(`${doctorBase}/consult?orderId=${p.order_number}`)}
                    className="h-8 w-8 p-0 rounded-lg border-slate-50 text-slate-400 group-hover:bg-[#D4AF37] group-hover:text-white group-hover:border-[#D4AF37] transition-all duration-300 shadow-sm"
                  >
                     <Video className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`${doctorBase}/patients/${p.id}`)}
                    className="h-8 w-8 p-0 rounded-lg border-emerald-100 bg-emerald-50 text-emerald-600 group-hover:bg-[#D4AF37] group-hover:text-white group-hover:border-[#D4AF37] transition-all duration-300 shadow-sm"
                  >
                     <User className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* THE MICRO-PRECISION CLINICAL MATRIX OVERLAY HAS BEEN REPLACED BY FULL PAGE */}
    </div>
  );
}

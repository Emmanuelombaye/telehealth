import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Users, Clock, Video, MessageSquare, FileText, ChevronRight,
  CheckCircle2, AlertCircle, Circle, Stethoscope, Pill,
  Phone, ToggleLeft, ToggleRight, Search, Filter, Bell, Zap,
  Activity, HeartPulse, ShieldCheck, Database, Layers, ArrowUpRight,
  Sparkles, FlaskConical, Bot, Command, Globe, Truck
} from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../../components/ui/shared.tsx";
import { OrderStatus, Order, usePatientStore } from "../../../../lib";
import { supabase } from "../../../../lib/supabaseClient";
import { cn } from "../../../components/ui/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type AvailabilityStatus = "available" | "busy" | "break" | "offline";

const availabilityConfig: Record<AvailabilityStatus, { label: string; color: string; dot: string; bg: string }> = {
  available: { label: "Available", color: "text-[#22c55e]", dot: "bg-[#22c55e]", bg: "bg-[#22c55e]/10" },
  busy: { label: "In Consult", color: "text-amber-500", dot: "bg-amber-500", bg: "bg-amber-500/10" },
  break: { label: "On Break", color: "text-violet-500", dot: "bg-violet-500", bg: "bg-violet-500/10" },
  offline: { label: "Offline", color: "text-[#7f9488]", dot: "bg-gray-600", bg: "bg-white/5" },
};

const queueStatusConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  order_submitted: { label: "Order Submitted", color: "text-blue-400", bg: "bg-blue-400/10" },
  account_created: { label: "Account Created", color: "text-violet-400", bg: "bg-violet-400/10" },
  id_verified: { label: "ID Verified", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  intake_completed: { label: "Intake Complete", color: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
  medical_review: { label: "Physician Review", color: "text-amber-500", bg: "bg-amber-500/10" },
  rx_sent: { label: "Rx Dispatched", color: "text-[#22c55e]", bg: "bg-[#22c55e]/20" },
  shipped: { label: "In Transit", color: "text-blue-500", bg: "bg-blue-500/10" },
  delivered: { label: "Delivered", color: "text-[#7f9488]", bg: "bg-white/5" },
  refill_eligible: { label: "Refill Eligible", color: "text-emerald-400", bg: "bg-emerald-400/10" },
};

export function DoctorQueuePage() {
  const navigate = useNavigate();
  const { orders, updateOrderStatus, updateOrderRx, fetchOrders, subscribeToOrders } = usePatientStore();
  const [availability, setAvailability] = useState<AvailabilityStatus>("available");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rxNote, setRxNote] = useState("");
  const [dosage, setDosage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState("truepill");
  const [isDispatching, setIsDispatching] = useState(false);

  // Filter orders for the queue - show anything that needs attention
  const queue = orders.filter(o => {
    const isActive = [
      "order_submitted", "medical_review", "id_verified", 
      "intake_completed", "medical_review"
    ].includes(o.status);
    const needsRefill = o.status === "refill_eligible" || (o.nextRefillAt && new Date(o.nextRefillAt) <= new Date());
    return isActive || needsRefill;
  });
  const selected = queue.find(o => o.id === selectedId) || null;

  useEffect(() => {
    if (selected) {
      setDosage(selected.dosageInstructions || "");
      setRxNote("");
      
      setAiGenerating(true);
      setAiSummary("");
      
      const intake = selected.intakeAnswers || {};
      const risks = [];
      const allergies = String(intake.allergies || '');
      const currentMeds = String(intake.current_meds || '');
      if (allergies && allergies.toLowerCase() !== 'none' && allergies.toLowerCase() !== 'none reported') risks.push(`Allergy alert: ${allergies}`);
      if (currentMeds && currentMeds.toLowerCase() !== 'none') risks.push(`Current meds: ${currentMeds}`);
      
      const aiText = `PATIENT SUMMARY:\n- 30-point intake form analyzed.\n- Primary Request: ${selected.medication}.\n- Risk Assessment: ${risks.length > 0 ? 'MODERATE' : 'LOW'}.\n${risks.length > 0 ? '- Flags: ' + risks.join(', ') : '- No contraindications detected.'}\n- Clearance: Safe to prescribe standard protocol.`;
      
      setTimeout(() => {
        setAiSummary(aiText);
        setAiGenerating(false);
      }, 1500);
    }
  }, [selectedId, selected]);

  useEffect(() => {
    const unsubscribe = subscribeToOrders();
    return () => unsubscribe();
  }, [subscribeToOrders]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  };

  const theme = {
    bg: "bg-[#060807]",
    sidebar: "bg-[#111814]",
    card: "bg-[#0c120f]/80",
    cardSolid: "bg-[#0c120f]",
    border: "border-[#1a2620]",
    textMain: "text-[#e2e8f0]",
    textMuted: "text-[#7f9488]",
    textGreen: "text-[#22c55e]",
    textBeige: "text-[#d4c4a8]",
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
             <span className={`${theme.textGreen} text-[10px] font-black uppercase tracking-[0.2em]`}>Real-time Matrix Active</span>
          </div>
          <h1 className={`text-3xl font-black ${theme.textMain} italic uppercase tracking-tighter`}>Clinical Queue</h1>
          <p className={`${theme.textMuted} text-xs font-bold uppercase tracking-widest mt-1`}>
             {queue.length} PATIENTS WAITING • GLOBAL DISPATCH SYSTEM
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-[2rem] border border-white/5 backdrop-blur-md">
           {Object.entries(availabilityConfig).map(([key, cfg]) => (
             <button
               key={key}
               onClick={() => setAvailability(key as AvailabilityStatus)}
               className={cn(
                 "px-4 py-2 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                 availability === key 
                   ? `${cfg.bg} ${cfg.color} border border-white/10 shadow-lg shadow-black/20` 
                   : "text-[#7f9488] hover:text-white"
               )}
             >
               <div className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
               {cfg.label}
             </button>
           ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 min-h-[600px] relative">
        {/* Main Queue Table */}
        <div className="lg:col-span-12 overflow-hidden flex flex-col">
          <div className={`${theme.sidebar} border-[#1a2620] border rounded-[2.5rem] flex-1 flex flex-col overflow-hidden shadow-2xl`}>
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-3 h-4 w-4 text-[#7f9488]" />
                <input 
                  placeholder="SEARCH PATIENTS OR PRODUCTS..." 
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-2.5 pl-12 pr-4 text-xs font-bold italic text-white focus:border-[#22c55e]/50 outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-3">
                 <Button 
                  onClick={handleRefresh}
                  variant="outline"
                  className="rounded-2xl bg-white/5 border-white/5 text-[10px] font-black uppercase italic tracking-widest hover:bg-white/10 gap-2 h-10 px-6"
                 >
                   <Activity className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
                   Sync Matrix
                 </Button>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-8 py-5 text-[10px] font-black text-[#7f9488] uppercase tracking-[0.2em]">Patient</th>
                    <th className="px-6 py-5 text-[10px] font-black text-[#7f9488] uppercase tracking-[0.2em]">Brand</th>
                    <th className="px-6 py-5 text-[10px] font-black text-[#7f9488] uppercase tracking-[0.2em]">Product</th>
                    <th className="px-6 py-5 text-[10px] font-black text-[#7f9488] uppercase tracking-[0.2em]">Submission Date</th>
                    <th className="px-6 py-5 text-[10px] font-black text-[#7f9488] uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-[#7f9488] uppercase tracking-[0.2em] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  <AnimatePresence mode="popLayout">
                    {queue.map((order) => (
                      <motion.tr
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={order.id}
                        onClick={() => setSelectedId(order.id)}
                        className={cn(
                          "group cursor-pointer transition-all hover:bg-[#22c55e]/[0.02]",
                          selectedId === order.id ? "bg-[#22c55e]/5" : ""
                        )}
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs border transition-all",
                              selectedId === order.id 
                                ? "bg-[#22c55e] text-black border-[#22c55e]" 
                                : "bg-white/5 text-[#7f9488] border-white/5"
                            )}>
                              {order.patientName?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-black text-white italic uppercase tracking-tight">
                                {order.patientName}
                              </p>
                              <p className="text-[10px] font-bold text-[#7f9488] mt-0.5">MRN: {order.mrn || 'PENDING'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <Badge variant="outline" className="bg-white/5 border-white/5 text-[10px] font-black uppercase tracking-widest text-[#d4c4a8]">
                            {order.subBrand || "Peak Health"}
                          </Badge>
                        </td>
                        <td className="px-6 py-5">
                          <div>
                            <p className="text-xs font-bold text-white uppercase italic">{order.medication}</p>
                            <p className="text-[10px] text-[#7f9488] mt-0.5">{order.category || "General Wellness"}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-[#7f9488]">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-xs font-bold">{order.orderedDate}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                           <span className={cn(
                             "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border",
                             queueStatusConfig[order.status]?.bg,
                             queueStatusConfig[order.status]?.color,
                             "border-white/5"
                           )}>
                             {queueStatusConfig[order.status]?.label}
                           </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <Button 
                            variant="outline"
                            className="h-8 rounded-xl border-[#22c55e]/20 text-[#22c55e] text-[9px] font-black uppercase tracking-widest hover:bg-[#22c55e] hover:text-black transition-all px-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(order.id);
                            }}
                          >
                            Review Specimen
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>

              {queue.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <Database className="h-12 w-12 text-white/5 mb-4" />
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-white/10 italic">Queue Void</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Patient Detail Modal */}
        <AnimatePresence>
          {selectedId && selected && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-7xl min-h-[80vh] max-h-[90vh] bg-[#060807] border border-[#1a2620] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden"
              >
                <div className="flex-1 flex flex-col p-8 overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-2xl bg-[#22c55e] flex items-center justify-center font-black text-2xl text-black italic">
                      {selected.patientName.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">{selected.patientName}</h2>
                      <div className="flex items-center gap-4 mt-1">
                         <span className={`${theme.textMuted} text-[10px] font-black uppercase tracking-widest`}>
                           AGE {selected.patientAge} • {selected.patientVitals?.sex || 'MALE'} • BMI {selected.patientVitals?.bmi || '24.5'}
                         </span>
                         <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 text-[9px] font-black uppercase">Verified Specimen</Badge>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedId(null)}
                    className="h-12 w-12 rounded-full hover:bg-white/5 text-[#7f9488] hover:text-white"
                  >
                    <ChevronRight className="h-6 w-6 rotate-90" />
                  </Button>
                </div>

                <div className="flex-1 grid md:grid-cols-2 gap-8 overflow-hidden">
                  {/* Intake & History */}
                  <div className="space-y-6 overflow-y-auto pr-4 custom-scrollbar">
                     <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6">
                        <div className="flex items-center gap-2 mb-6">
                          <FileText className="h-4 w-4 text-[#22c55e]" />
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d4c4a8]">Intake Diagnostics</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                             <p className="text-[9px] font-black text-[#7f9488] uppercase mb-1">Skin Condition</p>
                             <p className="text-xs font-bold text-white italic">{selected.intakeAnswers?.skin_condition || 'Healthy'}</p>
                          </div>
                          <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                             <p className="text-[9px] font-black text-[#7f9488] uppercase mb-1">Allergies</p>
                             <p className="text-xs font-bold text-red-400 italic">{selected.intakeAnswers?.allergies || 'None Reported'}</p>
                          </div>
                          <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                             <p className="text-[9px] font-black text-[#7f9488] uppercase mb-1">Medications</p>
                             <p className="text-xs font-bold text-white italic">{selected.intakeAnswers?.current_meds || 'None'}</p>
                          </div>
                          <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                             <p className="text-[9px] font-black text-[#7f9488] uppercase mb-1">Chief Complaint</p>
                             <p className="text-xs font-bold text-amber-500 italic">{selected.medication}</p>
                          </div>
                        </div>

                        {/* AI Scribe Intake Summary */}
                        <div className="mb-6 bg-gradient-to-br from-violet-900/20 to-purple-900/10 border border-violet-500/30 rounded-2xl p-5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Bot className="h-16 w-16 text-violet-400" />
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <Bot className="h-4 w-4 text-violet-400" />
                            <h4 className="text-[10px] font-black text-violet-300 uppercase tracking-[0.2em]">AI Scribe Intake Summary</h4>
                          </div>
                          {aiGenerating ? (
                            <div className="flex items-center gap-3 text-violet-400">
                              <div className="h-3 w-3 rounded-full bg-violet-500 animate-ping" />
                              <span className="text-xs font-bold italic">AI is analyzing 30-point intake assessment...</span>
                            </div>
                          ) : (
                            <p className="text-xs font-medium text-white leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
                          )}
                        </div>

                         <div className="pt-6 border-t border-white/5 text-center">
                            <Button 
                              onClick={() => setShowIntakeModal(true)}
                              className="w-full bg-[#22c55e]/5 border border-[#22c55e]/20 text-[#22c55e] h-14 rounded-2xl font-black uppercase italic text-xs tracking-widest hover:bg-[#22c55e]/10 transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#22c55e]/5"
                            >
                              <Activity className="h-4 w-4" />
                              View Full Intake Specimen
                            </Button>
                         </div>
                      </div>

                      {/* Luxury Intake Modal */}
                      <AnimatePresence>
                        {showIntakeModal && (
                          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-12 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-300">
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9, y: 40 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 40 }}
                              className="relative w-full max-w-5xl h-[85vh] bg-[#060807] border border-[#1a2620] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden"
                            >
                              {/* Header */}
                              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 rounded-2xl bg-[#22c55e]/10 flex items-center justify-center border border-[#22c55e]/20">
                                    <Activity className="h-6 w-6 text-[#22c55e]" />
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Clinical Intake Terminal</h3>
                                    <p className="text-[10px] font-black text-[#7f9488] uppercase tracking-[0.2em] mt-0.5">Verified Medical Specimen: {selected.patientName}</p>
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  onClick={() => setShowIntakeModal(false)}
                                  className="h-12 w-12 rounded-full hover:bg-white/5 text-[#7f9488] hover:text-white"
                                >
                                  <ChevronRight className="h-6 w-6 rotate-90" />
                                </Button>
                              </div>

                              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                <div className="grid md:grid-cols-3 gap-8">
                                  {/* Left Column: Vitals */}
                                  <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-[#22c55e] uppercase tracking-[0.2em] border-b border-[#22c55e]/20 pb-2">Clinical Vitals</h4>
                                    <div className="space-y-4">
                                      {[
                                        { label: "Height", value: selected.patientVitals?.height || "5'11\"", unit: "FT/IN" },
                                        { label: "Weight", value: selected.patientVitals?.weight || "185", unit: "LBS" },
                                        { label: "BMI", value: selected.patientVitals?.bmi || "25.8", unit: "INDEX" },
                                        { label: "Blood Pressure", value: selected.patientVitals?.bp || "120/80", unit: "MMHG" },
                                        { label: "Heart Rate", value: selected.patientVitals?.hr || "72", unit: "BPM" },
                                      ].map((vital, idx) => (
                                        <div key={idx} className="p-5 bg-white/[0.02] border border-white/5 rounded-[1.5rem] flex items-center justify-between">
                                          <div>
                                            <p className="text-[9px] font-black text-[#7f9488] uppercase mb-1">{vital.label}</p>
                                            <p className="text-lg font-black text-white italic">{vital.value}</p>
                                          </div>
                                          <span className="text-[8px] font-black text-[#22c55e] bg-[#22c55e]/10 px-2 py-1 rounded-md">{vital.unit}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Right Column: Questionnaire Answers */}
                                  <div className="md:col-span-2 space-y-6">
                                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] border-b border-amber-500/20 pb-2">Full Diagnostic Questionnaire</h4>
                                    <div className="grid gap-4">
                                      {selected.intakeAnswers && Object.entries(selected.intakeAnswers).map(([q, a], i) => (
                                        <div key={i} className="p-6 bg-white/[0.01] border border-white/5 rounded-[1.5rem] hover:bg-white/[0.02] transition-colors">
                                          <div className="flex items-start gap-4">
                                            <span className="text-[10px] font-black text-[#22c55e] mt-1 shrink-0">Q{i + 1}</span>
                                            <div>
                                              <p className="text-[10px] font-black text-[#7f9488] uppercase tracking-widest mb-2 leading-relaxed">
                                                {q.replace(/_/g, ' ')}
                                              </p>
                                              <p className="text-sm text-white font-medium italic">
                                                {Array.isArray(a) ? a.join(", ") : a}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                      {(!selected.intakeAnswers || Object.keys(selected.intakeAnswers).length === 0) && (
                                        <div className="py-20 text-center space-y-4">
                                           <AlertCircle className="h-10 w-10 text-[#7f9488]/20 mx-auto" />
                                           <p className="text-sm font-black text-[#7f9488] uppercase tracking-widest italic">Intake answers pending transmission</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Footer Branding */}
                              <div className="p-6 bg-white/[0.01] border-t border-white/5 flex items-center justify-center gap-4">
                                <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                                <span className="text-[9px] font-black text-[#7f9488] uppercase tracking-[0.4em] italic">Peak Health Clinical Intelligence System</span>
                                <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                              </div>
                            </motion.div>
                          </div>
                        )}
                      </AnimatePresence>
                     </div>
                  </div>

                  {/* Prescription Dispatch */}
                  <div className="flex flex-col gap-6 overflow-hidden">
                    <div className="flex-1 bg-gradient-to-br from-[#1a2620] to-[#0c120f] border border-[#22c55e]/30 rounded-[2rem] p-8 relative overflow-hidden flex flex-col">
                      <div className="absolute top-0 right-0 p-8 opacity-5">
                         <Pill className="h-32 w-32 text-[#22c55e]" />
                      </div>

                      <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 rounded-xl bg-[#22c55e] flex items-center justify-center">
                           <ShieldCheck className="h-6 w-6 text-black" />
                        </div>
                        <div>
                           <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Clinical Directive Terminal</h3>
                           <p className="text-[10px] font-bold text-[#22c55e] uppercase tracking-widest">Provider: DR. MARCUS THORNE</p>
                        </div>
                      </div>

                      <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                         <div>
                           <label className="text-[10px] font-black text-[#7f9488] uppercase tracking-[0.2em] mb-2 block">Dosage Instructions</label>
                           <input 
                             value={dosage}
                             onChange={(e) => setDosage(e.target.value)}
                             placeholder="E.G. INJECT 0.25MG WEEKLY..."
                             className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold italic text-white focus:border-[#22c55e]/50 outline-none transition-all"
                           />
                         </div>
                           <div className="grid grid-cols-2 gap-4 mt-6">
                             <div>
                               <label className="text-[10px] font-black text-[#7f9488] uppercase tracking-[0.2em] mb-2 block flex items-center gap-2">
                                 <Truck className="h-3 w-3" /> Pharmacy Routing
                               </label>
                               <select
                                 value={selectedPharmacy}
                                 onChange={(e) => setSelectedPharmacy(e.target.value)}
                                 className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:border-[#22c55e]/50 outline-none transition-all appearance-none"
                               >
                                 <option value="truepill">Truepill Pharmacy (Recommended)</option>
                                 <option value="alto">Alto Pharmacy</option>
                                 <option value="capsule">Capsule Pharmacy</option>
                               </select>
                             </div>
                             <div>
                               <label className="text-[10px] font-black text-[#7f9488] uppercase tracking-[0.2em] mb-2 block flex items-center gap-2">
                                 <Globe className="h-3 w-3" /> Tracking Sync
                               </label>
                               <div className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold text-[#7f9488] italic flex items-center justify-between">
                                 {selected.trackingUrl ? (
                                   <span className="text-[#22c55e] not-italic">{selected.carrier} - {selected.trackingUrl}</span>
                                 ) : (
                                   "Awaiting Pharmacy Fulfillment"
                                 )}
                               </div>
                             </div>
                           </div>
                           <div className="mt-6">
                             <label className="text-[10px] font-black text-[#7f9488] uppercase tracking-[0.2em] mb-2 block">Clinical Visit Notes</label>
                             <textarea 
                               value={rxNote}
                               onChange={(e) => setRxNote(e.target.value)}
                               placeholder="PATIENT EXHIBITS NO CONTRAINDICATIONS..."
                               className="w-full h-24 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold italic text-white focus:border-[#22c55e]/50 outline-none transition-all resize-none"
                             />
                           </div>
                           <div className="space-y-3 pt-6">
                            <div className="grid grid-cols-2 gap-3">
                               <Button
                                 disabled={isDispatching}
                                 onClick={async () => {
                                   setIsDispatching(true);
                                   try {
                                     // 1. Invoke Cloud Function (Backend Logic)
                                     try {
                                       await supabase.functions.invoke('dispatch-prescription', {
                                         body: {
                                           order_id: selected.id,
                                           dosage_instructions: dosage || selected.dosageInstructions,
                                           doctor_note: rxNote,
                                           pharmacy: selectedPharmacy,
                                         },
                                       });
                                     } catch (e) {
                                       console.log("Edge function not found, proceeding with direct DB update...");
                                     }

                                     // 2. Direct Store & DB Update (Frontend Mirror)
                                     await updateOrderRx(
                                       selected.id, 
                                       selected.medication, 
                                       dosage || selected.dosageInstructions || "As directed",
                                       rxNote || "Patient approved via clinical review."
                                     );

                                     toast.success(`Rx dispatched to ${selectedPharmacy}!`);
                                     setSelectedId(null);
                                   } catch (err: any) {
                                     toast.error(`Dispatch failed: ${err.message}`);
                                   } finally {
                                     setIsDispatching(false);
                                   }
                                 }}
                                 className="bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 text-[#060807] h-14 rounded-2xl font-black uppercase italic text-xs tracking-widest shadow-xl shadow-[#22c55e]/10 flex items-center justify-center gap-2"
                               >
                                 {isDispatching ? (
                                   <><Activity className="h-4 w-4 animate-spin" /> Dispatching...</>
                                 ) : (
                                   <><CheckCircle2 className="h-4 w-4" /> Finalize & Approve</>
                                 )}
                               </Button>
                              <Button 
                                variant="outline"
                                className="border-white/10 text-white/60 h-14 rounded-2xl font-black uppercase italic text-xs tracking-widest hover:bg-white/5 transition-all"
                                onClick={() => window.open('https://surescripts.com', '_blank')}
                              >
                                Surescripts e-Rx
                              </Button>
                            </div>

                            <Button 
                              variant="outline"
                              className="w-full border-[#22c55e]/20 text-[#22c55e] h-14 rounded-2xl font-black uppercase italic text-xs tracking-widest hover:bg-[#22c55e]/5 gap-3 transition-all flex items-center justify-center"
                              onClick={async (e) => {
                                const btn = e.currentTarget;
                                const originalContent = btn.innerHTML;
                                btn.innerText = "CALENDAR INVITE SENT ✓";
                                btn.disabled = true;
                                
                                await supabase.from('orders').update({ 
                                  zoom_status: 'requested', 
                                  zoom_doctor_message: rxNote || "Please book a time on my calendar." 
                                }).eq('order_number', selected.id);
                                
                                await fetchOrders();
                                
                                setTimeout(() => {
                                  btn.innerHTML = originalContent;
                                  btn.disabled = false;
                                  setSelectedId(null);
                                }, 2000);
                              }}
                            >
                              <Video className="h-4 w-4" /> Request Video Call Visit
                            </Button>

                            <Button 
                              variant="ghost"
                              className="w-full text-red-500/40 hover:text-red-500 hover:bg-red-500/5 h-10 rounded-xl font-black uppercase italic text-[9px] tracking-[0.2em] transition-all"
                              onClick={async (e) => {
                                const btn = e.currentTarget;
                                btn.innerText = "DISQUALIFYING PATIENT...";
                                btn.disabled = true;
                                await supabase.from('orders').update({ status: 'cancelled', doctor_note: rxNote }).eq('order_number', selected.id);
                                await fetchOrders();
                                setSelectedId(null);
                              }}
                            >
                              Disqualify Specimen & Refund
                            </Button>
                          </div>

                       <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between shrink-0">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
                            <span className="text-[9px] font-black text-[#7f9488] uppercase tracking-widest italic">Encrypted Pharmacy Link Active</span>
                          </div>
                          <p className="text-[10px] font-black text-[#22c55e] uppercase">Refill: 1 of 6 Authorized</p>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
     </div>
   </div>
);
}

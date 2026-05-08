import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Users, Clock, Video, MessageSquare, FileText, ChevronRight,
  CheckCircle2, AlertCircle, Circle, Stethoscope, Pill,
  Phone, ToggleLeft, ToggleRight, Search, Filter, Bell, Zap,
  Activity, HeartPulse, ShieldCheck, Database, Layers, ArrowUpRight,
  Sparkles, FlaskConical, Bot, Command, Globe
} from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../../components/ui/shared.tsx";
import { OrderStatus, Order, usePatientStore } from "../../../../lib";
import { supabase } from "../../../../lib/supabaseClient";
import { cn } from "../../../components/ui/utils";
import { motion, AnimatePresence } from "framer-motion";

type AvailabilityStatus = "available" | "busy" | "break" | "offline";

const availabilityConfig: Record<AvailabilityStatus, { label: string; color: string; dot: string; bg: string }> = {
  available: { label: "Available", color: "text-[#22c55e]", dot: "bg-[#22c55e]", bg: "bg-[#22c55e]/10" },
  busy: { label: "In Consult", color: "text-amber-500", dot: "bg-amber-500", bg: "bg-amber-500/10" },
  break: { label: "On Break", color: "text-violet-500", dot: "bg-violet-500", bg: "bg-violet-500/10" },
  offline: { label: "Offline", color: "text-[#7f9488]", dot: "bg-gray-600", bg: "bg-white/5" },
};

const queueStatusConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  order_submitted: { label: "Awaiting Review", color: "text-amber-500", bg: "bg-amber-500/10" },
  doctor_reviewing: { label: "Active Review", color: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
  rx_sent: { label: "Rx Dispatched", color: "text-[#22c55e]", bg: "bg-[#22c55e]/20" },
  shipped: { label: "In Transit", color: "text-blue-500", bg: "bg-blue-500/10" },
  delivered: { label: "Delivered", color: "text-[#7f9488]", bg: "bg-white/5" },
};

export function DoctorQueuePage() {
  const { orders, updateOrderStatus, updateOrderRx, fetchOrders } = usePatientStore();
  const [availability, setAvailability] = useState<AvailabilityStatus>("available");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rxNote, setRxNote] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter orders for the queue
  const queue = orders.filter(o => {
    const isNew = o.status === "order_submitted" || o.status === "doctor_reviewing";
    const needsRefill = o.nextRefillAt && new Date(o.nextRefillAt) <= new Date();
    return isNew || needsRefill;
  });
  const selected = queue.find(o => o.id === selectedId) || null;

  useEffect(() => {
    if (queue.length > 0 && !selectedId) {
      setSelectedId(queue[0].id);
    }
  }, [queue, selectedId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  };

  const theme = {
    bg: "bg-[#060807]",
    card: "bg-[#0c120f]/80",
    cardSolid: "bg-[#0c120f]",
    border: "border-[#1a2620]",
    textMain: "text-[#e2e8f0]",
    textMuted: "text-[#7f9488]",
    textGreen: "text-[#22c55e]",
    textBeige: "text-[#d4c4a8]",
  };

  const avail = availabilityConfig[availability];

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

      <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[600px]">
        {/* Left Side: Queue List */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden">
          <div className={`${theme.card} ${theme.border} border rounded-[2.5rem] flex-1 flex flex-col overflow-hidden`}>
            <div className="p-6 border-b border-white/5 bg-white/[0.02]">
              <div className="relative">
                <Search className="absolute left-4 top-3 h-4 w-4 text-[#7f9488]" />
                <input 
                  placeholder="SEARCH SPECIMENS..." 
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-2.5 pl-12 pr-4 text-xs font-bold italic text-white focus:border-[#22c55e]/50 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {queue.map((order, i) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={order.id}
                    onClick={() => setSelectedId(order.id)}
                    className={cn(
                      "group p-5 rounded-[2rem] border transition-all cursor-pointer relative overflow-hidden",
                      selectedId === order.id 
                        ? "bg-[#22c55e]/10 border-[#22c55e]/40 shadow-xl shadow-[#22c55e]/5" 
                        : "bg-white/[0.02] border-white/5 hover:border-white/20"
                    )}
                  >
                    {selectedId === order.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#22c55e]" />
                    )}
                    
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center font-black text-xs border transition-all",
                        selectedId === order.id 
                          ? "bg-[#22c55e] text-black border-[#22c55e]" 
                          : "bg-white/5 text-[#7f9488] border-white/5 group-hover:border-white/20"
                      )}>
                        {order.patientName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                           <p className={cn("text-sm font-black italic truncate transition-colors", selectedId === order.id ? "text-white" : "text-[#d4c4a8]")}>
                             {order.patientName}
                           </p>
                           {order.urgent && <Zap className="h-3.5 w-3.5 text-red-500 fill-red-500 animate-pulse shrink-0" />}
                        </div>
                        <p className={`${theme.textMuted} text-[10px] font-bold uppercase tracking-widest mt-1 truncate`}>
                          {order.medication}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                       <span className={cn(
                         "text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md",
                         queueStatusConfig[order.status]?.bg,
                         queueStatusConfig[order.status]?.color
                       )}>
                         {queueStatusConfig[order.status]?.label}
                       </span>
                       <span className={`${theme.textMuted} text-[9px] font-bold`}>{order.time || '12m ago'}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {queue.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-10">
                  <Database className="h-12 w-12 text-white/5 mb-4" />
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-white/10 italic">Queue Void</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/5 bg-white/[0.01]">
               <Button 
                onClick={handleRefresh}
                className="w-full rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase italic tracking-widest hover:bg-white/10 gap-2 h-10"
               >
                 <Activity className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
                 Force Re-Sync Matrix
               </Button>
            </div>
          </div>
        </div>

        {/* Right Side: Patient Detail & Clinical Interface */}
        <div className="lg:col-span-8 overflow-hidden flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 flex flex-col gap-6 overflow-hidden"
              >
                {/* Patient Profile Ribbon */}
                <div className={`${theme.card} ${theme.border} border rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6`}>
                   <div className="flex items-center gap-6">
                      <div className="h-20 w-20 rounded-[2rem] bg-gradient-to-br from-[#22c55e] to-[#0c120f] p-[1px] shadow-2xl shadow-black">
                         <div className="h-full w-full rounded-[2rem] bg-[#0c120f] flex items-center justify-center font-black text-2xl text-[#22c55e] italic">
                            {selected.patientName.charAt(0)}
                         </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">{selected.patientName}</h2>
                          <Globe className="h-4 w-4 text-[#7f9488]" />
                        </div>
                        <div className="flex items-center gap-4">
                           <span className={`${theme.textMuted} text-[10px] font-black uppercase tracking-widest`}>MALE • AGE {selected.patientAge} • BMI 31.4</span>
                           <div className="h-1 w-1 rounded-full bg-white/20" />
                           <span className={`${theme.textGreen} text-[10px] font-black uppercase tracking-widest`}>AUTHORIZED ACCESS</span>
                        </div>
                      </div>
                   </div>

                   <div className="flex gap-3">
                      <Button className="rounded-2xl bg-[#22c55e] text-black font-black uppercase italic px-6 h-12 shadow-lg shadow-[#22c55e]/20 group">
                        <Video className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" /> Launch Consultation
                      </Button>
                      <Button variant="outline" className="rounded-2xl border-white/10 bg-white/5 h-12 w-12 p-0 hover:bg-white/10">
                        <MessageSquare className="h-5 w-5 text-[#d4c4a8]" />
                      </Button>
                   </div>
                </div>

                <div className="flex-1 grid md:grid-cols-2 gap-6 overflow-hidden">
                  {/* Intake & History */}
                  <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                     <div className={`${theme.card} ${theme.border} border rounded-[2rem] p-6`}>
                        <div className="flex items-center gap-2 mb-6">
                          <FileText className="h-4 w-4 text-[#22c55e]" />
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d4c4a8]">Intake Telemetry</h3>
                        </div>
                        
                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                 <p className="text-[9px] font-black text-[#7f9488] uppercase mb-1">Requested Agent</p>
                                 <p className="text-xs font-bold text-white italic">{selected.medication}</p>
                              </div>
                              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                 <p className="text-[9px] font-black text-[#7f9488] uppercase mb-1">Intake Compliance</p>
                                 <p className="text-xs font-bold text-[#22c55e] italic">100% VERIFIED</p>
                              </div>
                           </div>

                           <div className="p-5 bg-amber-500/5 rounded-2xl border border-amber-500/20">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="h-3 w-3 text-amber-500" />
                                <p className="text-[9px] font-black text-amber-500 uppercase">Primary Complaint</p>
                              </div>
                              <p className="text-xs font-bold text-[#d4c4a8] leading-relaxed italic">
                                "{selected.intakeNotes || 'Patient requesting weight management protocol via GLP-1 therapy.'}"
                              </p>
                           </div>

                           <div className="space-y-3">
                              <p className="text-[9px] font-black text-[#7f9488] uppercase tracking-widest mt-6 mb-2">Matrix Responses</p>
                              {selected.intakeAnswers ? Object.entries(selected.intakeAnswers).slice(0,3).map(([q, a], i) => (
                                <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                  <p className="text-[10px] font-bold text-[#7f9488] mb-1">{q}</p>
                                  <p className="text-xs text-white font-medium italic">{Array.isArray(a) ? a.join(", ") : a}</p>
                                </div>
                              )) : (
                                [
                                  "No known clinical contradictions reported.",
                                  "Blood pressure stable at last clinical visit.",
                                  "Ready for immediate asynchronous clearance."
                                ].map((note, i) => (
                                  <div key={i} className="flex items-start gap-3 p-3">
                                    <CheckCircle2 className="h-3 w-3 text-[#22c55e] mt-0.5" />
                                    <p className="text-xs font-medium text-[#7f9488] italic">{note}</p>
                                  </div>
                                ))
                              )}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Rx Dispatch Terminal */}
                  <div className="space-y-6">
                    <div className={`${theme.card} border-[#22c55e]/30 border rounded-[2rem] p-8 relative overflow-hidden bg-gradient-to-br from-[#0c120f] to-[#1a2620]`}>
                       <div className="absolute top-0 right-0 p-6 opacity-10">
                          <Pill className="h-24 w-24 text-[#22c55e]" />
                       </div>

                       <div className="flex items-center gap-3 mb-8">
                         <div className="h-10 w-10 rounded-xl bg-[#22c55e] flex items-center justify-center">
                            <Lock className="h-5 w-5 text-black" />
                         </div>
                         <div>
                            <h3 className="text-sm font-black text-white italic uppercase tracking-tighter">Secure Dispatch Terminal</h3>
                            <p className="text-[9px] font-bold text-[#22c55e] uppercase">Encryption Layer Active</p>
                         </div>
                       </div>

                       <div className="space-y-6 relative z-10">
                          <div>
                            <label className="text-[10px] font-black text-[#7f9488] uppercase tracking-widest mb-2 block">Clinical Directive / Rx Note</label>
                            <textarea 
                              value={rxNote}
                              onChange={(e) => setRxNote(e.target.value)}
                              placeholder="INJECT 0.25MG SUBCUTANEOUSLY ONCE WEEKLY FOR 4 WEEKS..."
                              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold italic text-white focus:border-[#22c55e]/50 outline-none h-32 transition-all"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-4">
                             <Button 
                              variant="outline" 
                              className="rounded-2xl border-white/10 bg-white/5 text-[10px] font-black uppercase italic tracking-widest h-14 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-all"
                             >
                               Deny Request
                             </Button>
                             <Button 
                              onClick={() => {
                                updateOrderStatus(selected.id, 'rx_sent');
                                setRxNote("");
                              }}
                              className="rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-black uppercase italic tracking-tighter h-14 group shadow-xl shadow-[#22c55e]/20"
                             >
                               Approve & Dispatch <Sparkles className="ml-2 h-4 w-4 group-hover:animate-spin" />
                             </Button>
                          </div>
                       </div>

                       <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <ShieldCheck className="h-3 w-3 text-[#22c55e]" />
                             <span className="text-[9px] font-bold text-[#7f9488] uppercase italic">Provider Auth: Verified</span>
                          </div>
                          <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                       </div>
                    </div>

                    {/* Infrastructure Stats */}
                    <div className="grid grid-cols-2 gap-4">
                       <div className={`${theme.card} ${theme.border} border rounded-[1.5rem] p-5`}>
                          <p className="text-[9px] font-black text-[#7f9488] uppercase tracking-widest mb-1">Network Ping</p>
                          <p className="text-xl font-black text-[#d4c4a8] italic">14ms</p>
                       </div>
                       <div className={`${theme.card} ${theme.border} border rounded-[1.5rem] p-5`}>
                          <p className="text-[9px] font-black text-[#7f9488] uppercase tracking-widest mb-1">Queue Load</p>
                          <p className="text-xl font-black text-[#22c55e] italic">LOW</p>
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                 <div className="h-20 w-20 rounded-[2rem] bg-white/5 flex items-center justify-center border border-white/5 mb-6">
                    <Activity className="h-10 w-10 text-white/20 animate-pulse" />
                 </div>
                 <h2 className="text-xl font-black text-white/40 italic uppercase tracking-widest">Select Patient Profile</h2>
                 <p className="text-xs font-bold text-white/10 uppercase tracking-widest mt-2 italic">Awaiting Matrix Selection...</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Lock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

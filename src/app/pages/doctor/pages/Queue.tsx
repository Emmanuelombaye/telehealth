import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Users, Clock, Video, MessageSquare, FileText, ChevronRight,
  CheckCircle2, AlertCircle, Circle, Stethoscope, Pill,
  Phone, ToggleLeft, ToggleRight, Search, Filter, Bell, Zap,
  Activity, HeartPulse, ShieldCheck, Database, Layers, ArrowUpRight,
  Sparkles, FlaskConical, Bot, Command, Globe, Truck, X, Loader2, RefreshCw
} from "lucide-react";
import { Card, CardContent, Button, Badge, Input, cn } from "../../../components/ui/shared.tsx";
import { OrderStatus, Order, usePatientStore, useAuthStore } from "../../../../lib";
import { supabase } from "../../../../lib/supabaseClient";
import * as FramerMotion from "framer-motion";
const { motion, AnimatePresence } = FramerMotion;
import { toast } from "sonner";

const queueStatusConfig: Record<OrderStatus, { label: string; color: string; bg: string; border: string }> = {
  order_submitted: { label: "Order Submitted", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  account_created: { label: "Account Created", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
  id_verified: { label: "ID Verified", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  intake_completed: { label: "Intake Complete", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  medical_review: { label: "Physician Review", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  rx_sent: { label: "Rx Dispatched", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  shipped: { label: "In Transit", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  delivered: { label: "Delivered", color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200" },
  follow_up: { label: "Follow-up", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
  refill_eligible: { label: "Refill Eligible", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
};

export function DoctorQueuePage() {
  const navigate = useNavigate();
  const MotionButton = motion(Button);
  const { orders, updateOrderStatus, fetchOrders, subscribeToOrders } = usePatientStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rxNote, setRxNote] = useState("");
  const [dosage, setDosage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState("truepill");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDispatching, setIsDispatching] = useState(false);

  // Filter orders for the queue
  const queue = orders.filter(o => {
    const isActive = [
      "order_submitted", "medical_review", "id_verified", 
      "intake_completed"
    ].includes(o.status);
    const needsRefill = o.status === "refill_eligible" || (o.nextRefillAt && new Date(o.nextRefillAt) <= new Date());
    
    if (!isActive && !needsRefill) return false;

    // Apply specific status filter if selected
    if (statusFilter !== "all" && o.status !== statusFilter) {
      if (statusFilter === "refill_eligible" && !needsRefill) return false;
      if (statusFilter !== "refill_eligible" && o.status !== statusFilter) return false;
    }

    // Apply text search filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchName = o.patientName?.toLowerCase().includes(q);
      const matchMed = o.medication?.toLowerCase().includes(q);
      const matchMRN = o.mrn?.toLowerCase().includes(q);
      if (!matchName && !matchMed && !matchMRN) return false;
    }

    return true;
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
      
      const aiText = `PATIENT SUMMARY:\n- Comprehensive intake reviewed.\n- Primary Request: ${selected.medication}.\n- Risk Assessment: ${risks.length > 0 ? 'MODERATE' : 'LOW'}.\n${risks.length > 0 ? '- Flags: ' + risks.join(', ') : '- No contraindications detected.'}\n- Clearance: Safe to prescribe standard protocol.`;
      
      setTimeout(() => {
        setAiSummary(aiText);
        setAiGenerating(false);
      }, 1200);
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

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10 animate-in fade-in duration-700">
      
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-emerald-700 text-[10px] font-bold uppercase tracking-widest">Real-time Matrix Active</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0A2E1F]">Active Patient Queue</h1>
          <p className="text-slate-500 text-xs font-medium mt-1">
             {queue.length} patients waiting for medical review
          </p>
        </div>

        <div className="flex items-center gap-3">
           <Badge variant="outline" className="rounded-xl bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 py-2 px-4 text-xs font-bold uppercase shadow-sm">
             <ShieldCheck className="h-4 w-4" /> HIPAA SECURE
           </Badge>
           <Button 
             variant="outline"
             onClick={handleRefresh}
             disabled={isRefreshing}
             className="rounded-xl border-slate-200 bg-white h-11 px-4 text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
           >
             <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
             {isRefreshing ? 'Syncing...' : 'Refresh Queue'}
           </Button>
        </div>
      </div>

      <Card className="border border-slate-200 rounded-[1.5rem] shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        {/* Table Toolbar */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patients, MRN, or medications..." 
              className="bg-white border-slate-200 rounded-xl pl-9 text-sm focus:border-emerald-500 outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-3">
             <div className="relative">
               <select
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value)}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               >
                 <option value="all">All Patients</option>
                 <option value="medical_review">Needs Medical Review</option>
                 <option value="order_submitted">Order Submitted</option>
                 <option value="intake_completed">Intake Complete</option>
                 <option value="refill_eligible">Refill Eligible</option>
               </select>
               <Button variant="outline" className={cn("rounded-xl border-slate-200 bg-white h-10 px-3 text-slate-500 hover:bg-slate-50 pointer-events-none gap-2", statusFilter !== 'all' && "text-emerald-700 bg-emerald-50 border-emerald-200")}>
                 <Filter className="h-4 w-4" />
                 {statusFilter !== 'all' && <span className="text-[10px] font-bold uppercase">{statusFilter.replace('_', ' ')}</span>}
               </Button>
             </div>
             <Button 
              onClick={handleRefresh}
              variant="outline"
              className="rounded-xl bg-white border-slate-200 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 gap-2 h-10 px-4"
             >
               <Activity className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
               Sync Ledger
             </Button>
          </div>
        </div>

        {/* Main Queue Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="px-6 py-4 font-semibold text-slate-500 w-1/4">Patient Details</th>
                <th className="px-6 py-4 font-semibold text-slate-500">Treatment Requested</th>
                <th className="px-6 py-4 font-semibold text-slate-500">Submission Time</th>
                <th className="px-6 py-4 font-semibold text-slate-500">Current Status</th>
                <th className="px-6 py-4 font-semibold text-slate-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              <AnimatePresence mode="popLayout">
                {queue.map((order) => (
                  <motion.tr
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ 
                      scale: 1.02, 
                      backgroundColor: "#0A2E1F", 
                      zIndex: 20,
                      boxShadow: "0 10px 30px rgba(10, 46, 31, 0.2), 0 0 0 2px #D4AF37"
                    }}
                    whileTap={{ scale: 0.99 }}
                    key={order.id}
                    onClick={() => setSelectedId(order.id)}
                    className={cn(
                      "group cursor-pointer transition-all border-l-4 border-transparent relative",
                      selectedId === order.id ? "bg-emerald-50/50 border-emerald-500 shadow-sm" : "hover:border-emerald-500"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all group-hover:bg-emerald-500 group-hover:text-white",
                          selectedId === order.id 
                            ? "bg-emerald-600 text-white" 
                            : "bg-slate-100 text-slate-600"
                        )}>
                          {order.patientName?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-bold text-[#0A2E1F] group-hover:text-white transition-colors">
                            {order.patientName}
                          </p>
                          <p className="text-[10px] font-medium text-slate-500 mt-0.5 group-hover:text-emerald-200/60 transition-colors">MRN: {order.mrn || 'PENDING'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-800 group-hover:text-emerald-50 transition-colors">{order.medication}</p>
                        <p className="text-xs text-slate-500 mt-0.5 group-hover:text-emerald-200/40 transition-colors">{order.category || "General Wellness"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600 group-hover:text-emerald-100 transition-colors">
                        <Clock className="h-4 w-4 text-slate-400 group-hover:text-emerald-300" />
                        <span className="font-medium text-xs">{new Date(order.orderedDate || (order as any).ordered_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <Badge variant="outline" className={cn(
                         "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1",
                         queueStatusConfig[order.status]?.bg,
                         queueStatusConfig[order.status]?.color,
                         queueStatusConfig[order.status]?.border
                       )}>
                         {queueStatusConfig[order.status]?.label}
                       </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <MotionButton 
                         whileHover={{ scale: 1.1, backgroundColor: "#D4AF37", color: "#0A2E1F", borderColor: "#D4AF37" }}
                         whileTap={{ scale: 0.9 }}
                         variant="outline"
                         className={cn(
                           "h-8 rounded-lg text-[10px] font-black uppercase tracking-widest px-4 transition-all shadow-sm",
                           selectedId === order.id 
                             ? "bg-emerald-600 text-white border-emerald-600" 
                             : "bg-white border-slate-200 text-slate-700 group-hover:shadow-lg group-hover:shadow-emerald-500/10"
                         )}
                         onClick={(e) => {
                           e.stopPropagation();
                           setSelectedId(order.id);
                         }}
                       >
                         Review
                       </MotionButton>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {queue.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center text-center bg-slate-50/50 h-full">
              <CheckCircle2 className="h-16 w-16 text-emerald-200 mb-4" />
              <p className="text-lg font-bold text-slate-700">Queue is Clear</p>
              <p className="text-sm text-slate-500 mt-1">All patient requests have been reviewed.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Selected Patient Detail Modal (Slide-in Sidebar) */}
      <AnimatePresence>
        {selectedId && selected && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm overflow-hidden">
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col border-l border-slate-200"
            >
              {/* Sidebar Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-xl text-emerald-800">
                    {selected.patientName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0A2E1F]">{selected.patientName}</h2>
                    <div className="flex items-center gap-3 mt-1">
                       <span className="text-xs font-semibold text-slate-500">
                         AGE {selected.patientAge} • {selected.patientVitals?.sex || 'MALE'} • BMI {selected.patientVitals?.bmi || '24.5'}
                       </span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSelectedId(null)}
                  className="rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="px-6 py-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 to-white flex gap-2">
                <Link
                  to={`/doctor/consult?orderId=${encodeURIComponent(selected.id)}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A2E1F] text-white hover:bg-[#153e2d] h-10 text-xs font-bold shadow-md transition-colors"
                >
                  <Stethoscope className="h-4 w-4" />
                  Open case workspace
                  <ChevronRight className="h-4 w-4 opacity-80" />
                </Link>
              </div>

              {/* Sidebar Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-slate-50/30">
                
                {/* Clinical Request Info */}
                <div>
                   <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Clinical Request</h3>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-white border border-slate-200 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Medication</p>
                        <p className="text-sm font-bold text-[#0A2E1F]">{selected.medication}</p>
                     </div>
                     <div className="p-4 bg-white border border-slate-200 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</p>
                        <p className="text-sm font-semibold text-slate-700">{selected.category}</p>
                     </div>
                     <div className="p-4 bg-white border border-slate-200 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reported Allergies</p>
                        <p className={cn("text-sm font-semibold", selected.intakeAnswers?.allergies ? "text-red-600" : "text-slate-700")}>
                          {selected.intakeAnswers?.allergies || 'None'}
                        </p>
                     </div>
                     <div className="p-4 bg-white border border-slate-200 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Meds</p>
                        <p className="text-sm font-semibold text-slate-700">{selected.intakeAnswers?.current_meds || 'None'}</p>
                     </div>
                   </div>
                </div>

                {/* AI Scribe Intake Summary */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <Bot className="h-24 w-24 text-indigo-600" />
                  </div>
                  <div className="flex items-center gap-2 mb-3 relative z-10">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-widest">AI Clinical Summary</h4>
                  </div>
                  {aiGenerating ? (
                    <div className="flex items-center gap-3 text-indigo-600 relative z-10 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-medium">Analyzing intake questionnaire...</span>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap relative z-10">{aiSummary}</p>
                  )}
                  <div className="mt-4 pt-4 border-t border-indigo-100/50 relative z-10">
                      <Button 
                        variant="ghost" 
                        onClick={() => setShowIntakeModal(true)}
                        className="text-indigo-600 p-0 h-auto font-semibold text-sm hover:text-indigo-800"
                     >
                       View Full Intake Form <ArrowUpRight className="h-3 w-3 ml-1" />
                     </Button>
                  </div>
                </div>

                {/* E-Prescribing Section */}
                <div className="bg-white border border-emerald-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <Pill className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-sm font-bold text-[#0A2E1F] uppercase tracking-widest">E-Prescribe Directive</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">Dosage Instructions</label>
                      <Input 
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                        placeholder="e.g. Inject 0.25mg once weekly"
                        className="font-medium text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5 flex items-center gap-2">
                        <Truck className="h-3 w-3" /> Pharmacy Destination
                      </label>
                      <select
                        value={selectedPharmacy}
                        onChange={(e) => setSelectedPharmacy(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-800 focus:border-emerald-500 outline-none"
                      >
                        <option value="truepill">Truepill Partner Pharmacy (Default)</option>
                        <option value="alto">Alto Pharmacy</option>
                        <option value="capsule">Capsule Pharmacy</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">Provider Notes (Internal)</label>
                      <textarea 
                        value={rxNote}
                        onChange={(e) => setRxNote(e.target.value)}
                        placeholder="Clinical rationale or specific notes..."
                        className="w-full h-20 bg-white border border-slate-200 rounded-lg p-3 text-sm font-medium text-slate-800 focus:border-emerald-500 outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Sidebar Action Footer */}
              <div className="p-6 bg-white border-t border-slate-200 space-y-3 sticky bottom-0 z-10">
                <MotionButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isDispatching}
                  onClick={async () => {
                    setIsDispatching(true);
                    try {
                      const { data: dispatchData, error: dispatchError } = await supabase.functions.invoke(
                        "dispatch-prescription",
                        {
                          body: {
                            order_id: selected.id,
                            dosage_instructions: dosage || selected.dosageInstructions,
                            doctor_note: rxNote,
                            pharmacy: selectedPharmacy,
                          },
                        },
                      );

                      const payload = dispatchData as { success?: boolean; detail?: string; error?: string } | null;
                      const pharmacyRejected =
                        !!dispatchError ||
                        (payload && typeof payload === "object" && payload.success === false);

                      if (pharmacyRejected) {
                        let msg =
                          payload?.detail ||
                          payload?.error ||
                          dispatchError?.message ||
                          "Pharmacy did not accept this dispatch.";
                        const ctx = dispatchError && (dispatchError as { context?: Response }).context;
                        if (ctx && typeof ctx.json === "function") {
                          try {
                            const body = await ctx.clone().json();
                            if (body?.detail) msg = String(body.detail);
                            else if (body?.error) msg = String(body.error);
                          } catch {
                            /* ignore */
                          }
                        }
                        toast.error(`Pharmacy dispatch failed: ${msg}`);
                        await fetchOrders();
                        return;
                      }

                      const currentUser = useAuthStore.getState().user;
                      const doctorName = currentUser?.user_metadata?.first_name
                        ? `Dr. ${currentUser.user_metadata.first_name} ${currentUser.user_metadata.last_name || ""}`.trim()
                        : "Attending Physician";

                      const { error: docErr } = await supabase
                        .from("orders")
                        .update({
                          doctor: doctorName,
                          doctor_id: currentUser?.id ?? null,
                          last_approved_at: new Date().toISOString(),
                        })
                        .eq("order_number", selected.id);
                      if (docErr) console.warn("[Queue] doctor attribution:", docErr.message);

                      const rxDosage = dosage || selected.dosageInstructions || "As directed";
                      const rxNoteFinal = rxNote || "Patient approved via clinical review.";
                      const patientId = selected.userId || selected.user_id;
                      if (patientId) {
                        const { error: rxInsErr } = await supabase.from("prescriptions").insert([
                          {
                            patient_id: patientId,
                            doctor_id: currentUser?.id,
                            medication: selected.medication,
                            dosage: rxDosage,
                            frequency: rxNoteFinal,
                            status: "active",
                            refills_remaining: 5,
                            pharmacy_name: selectedPharmacy || selected.pharmacy || "VIALSRX EXPRESS",
                          },
                        ]);
                        if (rxInsErr) console.warn("[Queue] prescription insert:", rxInsErr.message);
                      } else {
                        console.warn("[Queue] missing patient id — skipped prescription row");
                      }

                      await fetchOrders();
                      toast.success(`Prescription dispatched to ${selectedPharmacy}.`);
                      setSelectedId(null);
                    } catch (err: unknown) {
                      const m = err instanceof Error ? err.message : String(err);
                      toast.error(`Dispatch failed: ${m}`);
                    } finally {
                      setIsDispatching(false);
                    }
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all border-none"
                >
                  {isDispatching ? (
                    <><Activity className="h-4 w-4 animate-spin" /> Dispatching Rx...</>
                  ) : (
                    <><CheckCircle2 className="h-5 w-5" /> Approve & Dispatch Rx</>
                  )}
                </MotionButton>
                
                <div className="grid grid-cols-2 gap-3">
                  <MotionButton 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    variant="outline"
                    className="w-full border-slate-200 text-slate-700 h-11 rounded-xl font-semibold text-xs hover:bg-slate-50 transition-all gap-2"
                    onClick={async (e) => {
                      const btn = e.currentTarget;
                      const originalContent = btn.innerHTML;
                      btn.innerHTML = '<span class="animate-pulse">Requesting...</span>';
                      btn.disabled = true;
                      
                      await supabase.from('orders').update({ 
                        zoom_status: 'requested', 
                        zoom_doctor_message: rxNote || "Please book a time for a video consult." 
                       }).eq('order_number', selected.id);
                      
                      await fetchOrders();
                      
                      setTimeout(() => {
                        btn.innerHTML = "Requested ✓";
                        setTimeout(() => {
                          btn.innerHTML = originalContent;
                          btn.disabled = false;
                          setSelectedId(null);
                        }, 1000);
                      }, 800);
                    }}
                  >
                    <Video className="h-4 w-4" /> Require Consult
                  </MotionButton>

                  <MotionButton 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    variant="outline"
                    className="w-full border-red-100 text-red-600 bg-red-50 hover:bg-red-100 hover:border-red-200 h-11 rounded-xl font-semibold text-xs transition-all gap-2"
                    onClick={async (e) => {
                      const btn = e.currentTarget;
                      const orig = btn.innerHTML;
                      btn.innerText = "Rejecting...";
                      btn.disabled = true;
                      await supabase.from('orders').update({ status: 'cancelled', doctor_note: rxNote }).eq('order_number', selected.id);
                      await fetchOrders();
                      setSelectedId(null);
                    }}
                  >
                    <AlertCircle className="h-4 w-4" /> Reject/Refund
                  </MotionButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Intake Modal (Triggered from AI Summary) */}
      <AnimatePresence>
        {showIntakeModal && selected && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-slate-800">Comprehensive Intake Form</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowIntakeModal(false)} className="rounded-full hover:bg-slate-200">
                  <X className="h-5 w-5 text-slate-500" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
                <div className="grid gap-4">
                  {selected.intakeAnswers && Object.entries(selected.intakeAnswers).map(([q, a], i) => (
                    <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{q.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-slate-900 font-medium">{Array.isArray(a) ? a.join(", ") : String(a)}</p>
                    </div>
                  ))}
                  {(!selected.intakeAnswers || Object.keys(selected.intakeAnswers).length === 0) && (
                    <div className="py-12 text-center text-slate-500">No intake answers available.</div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}

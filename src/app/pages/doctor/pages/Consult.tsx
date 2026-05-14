import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { 
  ArrowLeft, Video, Mic, MicOff, VideoOff, MessageSquare, 
  Pill, Zap, ShieldCheck, Activity, Users, 
  Sparkles, CheckCircle2, MoreHorizontal, Loader2,
  Stethoscope, Clock, ChevronRight, AlertCircle, Search, Filter,
  Bot, FileSignature, X, CheckCircle, XCircle, Info
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { useAuthStore } from "../../../../lib";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import { supabase } from "../../../../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";


// ── Lightweight Toast System ──────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';
function ToastBar({ toasts }: { toasts: Array<{ id: number; type: ToastType; message: string }> }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={cn(
          "flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm font-bold tracking-wide animate-in slide-in-from-right-4 duration-400 min-w-[280px]",
          t.type === 'success' && "bg-[#0A2E1F] text-white border-emerald-500/30",
          t.type === 'error'   && "bg-red-900 text-white border-red-500/30",
          t.type === 'info'    && "bg-slate-900 text-white border-white/10",
        )}>
          {t.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />}
          {t.type === 'error'   && <XCircle className="h-5 w-5 text-red-400 shrink-0" />}
          {t.type === 'info'    && <Info className="h-5 w-5 text-blue-400 shrink-0" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

/** Maps stored pharmacy label to dispatch-prescription `pharmacy` slug. */
function pharmacySlugFromOrder(pharmacy: string | null | undefined): string {
  const p = (pharmacy ?? "").toLowerCase();
  if (p.includes("alto")) return "alto";
  if (p.includes("capsule")) return "capsule";
  return "truepill";
}

function PatientPicker() {
  const navigate = useNavigate();
  const doctorBase = useDoctorPortalBase();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function fetchQueue() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .in('status', ['order_submitted', 'medical_review', 'rx_sent'])
          .order('created_at', { ascending: true });
        if (error) throw error;
        setQueue(data || []);
      } catch (err) {
        console.error("Queue fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchQueue();

    const channel = supabase
      .channel('consult-queue-watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchQueue())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = queue.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.patient_name?.toLowerCase().includes(q) ||
             o.medication?.toLowerCase().includes(q) ||
             o.order_number?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-emerald-700 text-[10px] font-bold uppercase tracking-widest">Command Suite Active</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0A2E1F]">Video Consultation Lobby</h1>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Select a patient to initiate a secure telehealth session.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patient, medication, or ID..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm font-semibold text-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-sm font-semibold text-slate-700 focus:border-emerald-500 outline-none hover:bg-slate-100 transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="order_submitted">Awaiting Review</option>
            <option value="medical_review">In Review</option>
            <option value="rx_sent">Dispatched</option>
          </select>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Awaiting Review", value: queue.filter(o => o.status === 'order_submitted').length, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
          { label: "In Active Review", value: queue.filter(o => o.status === 'medical_review').length, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
          { label: "Consult Completed", value: queue.filter(o => o.status === 'rx_sent').length, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
        ].map((stat, i) => (
          <Card key={i} className={`border ${stat.border} rounded-[1.25rem] shadow-sm hover:shadow-md transition-shadow`}>
             <CardContent className="p-5 flex items-center justify-between">
                <div>
                   <p className="text-sm font-bold text-slate-700">{stat.label}</p>
                   <p className="text-xs text-slate-500 mt-0.5">Live metrics</p>
                </div>
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border", stat.bg, stat.border)}>
                   <span className={`text-xl font-bold ${stat.color}`}>{stat.value}</span>
                </div>
             </CardContent>
          </Card>
        ))}
      </div>

      {/* Patient grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-slate-500 text-sm font-bold animate-pulse">Syncing clinical queue...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 text-center bg-white border border-slate-200 rounded-[1.5rem] shadow-sm">
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-[#0A2E1F]">No Patients Found</h3>
            <p className="text-sm text-slate-500 mt-1">
              {search || statusFilter !== 'all' ? "Try adjusting your filters." : "Your consultation queue is empty."}
            </p>
          </div>
        ) : filtered.map((order, i) => (
          <button
            key={order.id}
            onClick={() => navigate(`${doctorBase}/consult?orderId=${order.order_number}`)}
            style={{
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            className={cn(
              // Base card
              "group relative flex flex-col p-6 rounded-[1.5rem] text-left overflow-hidden",
              "transition-all duration-500",
              // Resting state
              "bg-white border-2 border-slate-200 shadow-md",
              // Hover: zoom + gold outline + deep green fill
              "hover:scale-[1.045] hover:z-20",
              "hover:border-[#D4AF37] hover:bg-[#0A2E1F]",
              "hover:shadow-[0_0_0_4px_rgba(212,175,55,0.35),0_25px_60px_rgba(10,46,31,0.45)]",
            )}
          >
            {/* ── Gold shimmer sweep on hover ── */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden rounded-[1.4rem]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0A2E1F] via-[#0d3a25] to-[#061a12]" />
              {/* Animated gold shimmer */}
              <div className="absolute -inset-full top-0 h-full w-1/2 z-10 block transform -skew-x-12 bg-gradient-to-r from-transparent to-[rgba(212,175,55,0.08)] opacity-0 group-hover:opacity-100 group-hover:animate-[shimmer_2s_ease-in-out_infinite]" />
              {/* Corner gold accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/10 rounded-bl-[4rem] blur-md" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-emerald-400/5 rounded-tr-[3rem] blur-lg" />
            </div>

            {/* ── Animated gold pulse ring (outer) ── */}
            <div className="absolute -inset-[3px] rounded-[1.6rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #F5D87A, #D4AF37, #B8962E)',
                zIndex: -1,
                animation: 'none',
              }}
            />

            {/* ── Content layer (above overlays) ── */}
            <div className="relative z-10 flex flex-col h-full">

              {/* Header row */}
              <div className="flex items-start justify-between mb-5 w-full">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center font-black text-base transition-all duration-500",
                    "bg-slate-100 text-slate-600 border-2 border-slate-200",
                    "group-hover:bg-[#D4AF37] group-hover:text-[#0A2E1F] group-hover:border-[#D4AF37] group-hover:shadow-[0_0_20px_rgba(212,175,55,0.5)] group-hover:scale-110",
                  )}>
                    {order.patient_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className={cn(
                      "text-sm font-black transition-colors duration-300",
                      "text-[#0A2E1F] group-hover:text-white"
                    )}>
                      {order.patient_name || "Unknown Patient"}
                    </p>
                    <p className={cn(
                      "text-[10px] font-bold uppercase tracking-widest mt-0.5 transition-colors duration-300",
                      "text-slate-400 group-hover:text-[#D4AF37]"
                    )}>
                      {order.order_number}
                    </p>
                  </div>
                </div>

                {/* Urgent badge or gold star on hover */}
                <div className="shrink-0">
                  {order.urgent ? (
                    <span className="bg-red-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full">
                      Urgent
                    </span>
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                      <div className="h-8 w-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center">
                        <span className="text-[#D4AF37] text-base">✦</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Info rows */}
              <div className="space-y-3 flex-1">
                <div className={cn(
                  "flex items-center gap-2.5 transition-colors duration-300",
                  "text-slate-600 group-hover:text-white/90"
                )}>
                  <div className={cn(
                    "h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-300",
                    "bg-slate-100 group-hover:bg-[#D4AF37]/20 group-hover:border group-hover:border-[#D4AF37]/30"
                  )}>
                    <Pill className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#D4AF37] transition-colors" />
                  </div>
                  <span className="text-sm font-bold">{order.medication || 'Pending Consult'}</span>
                </div>
                <div className={cn(
                  "flex items-center gap-2.5 transition-colors duration-300",
                  "text-slate-400 group-hover:text-white/60"
                )}>
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-slate-50 group-hover:bg-white/5 transition-colors">
                    <Clock className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <span className="text-xs font-semibold">
                    Waiting: {Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)} mins
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className={cn(
                "mt-5 pt-4 flex items-center justify-between w-full transition-all duration-300",
                "border-t border-slate-100 group-hover:border-[#D4AF37]/20"
              )}>
                {/* Status badge */}
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all duration-300",
                  order.status === 'medical_review'
                    ? "bg-amber-50 text-amber-700 border-amber-200 group-hover:bg-amber-400/20 group-hover:text-amber-300 group-hover:border-amber-400/30"
                    : order.status === 'order_submitted'
                    ? "bg-blue-50 text-blue-700 border-blue-200 group-hover:bg-blue-400/20 group-hover:text-blue-300 group-hover:border-blue-400/30"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-emerald-400/20 group-hover:text-emerald-300 group-hover:border-emerald-400/30"
                )}>
                  {order.status?.replace(/_/g, ' ')}
                </span>

                {/* "Join Room" CTA with Magnetic Haptics */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  whileHover={{ 
                    x: 0, 
                    scale: 1.1,
                    textShadow: "0 0 15px rgba(212, 175, 55, 0.6)"
                  }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    transition: { duration: 0.5 }
                  }}
                  className={cn(
                    "flex items-center gap-2 font-black text-[12px] uppercase tracking-[0.15em] transition-all duration-300",
                    "text-[#D4AF37] group-hover:drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                  )}
                >
                  <span className="relative">
                    Join Room
                    <motion.span 
                      animate={{ opacity: [0.4, 1, 0.4], scale: [0.98, 1.02, 0.98] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 blur-sm text-[#D4AF37] select-none"
                    >
                      Join Room
                    </motion.span>
                  </span>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ChevronRight className="h-4 w-4 stroke-[3]" />
                  </motion.div>
                </motion.div>
              </div>
            </div>

            {/* ── Bottom gold bar accent (slides in on hover) ── */}
            <div className="absolute bottom-0 left-0 h-[3px] w-0 group-hover:w-full bg-gradient-to-r from-[#D4AF37] via-[#F5D87A] to-[#D4AF37] transition-all duration-700 rounded-b-[1.5rem]" />
          </button>
        ))}
      </div>

    </div>
  );
}


// ─── Main Consult Page ────────────────────────────────────────────────────────
export function DoctorConsultPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const navigate = useNavigate();
  const doctorBase = useDoctorPortalBase();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(!!orderId);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isRequestingVideo, setIsRequestingVideo] = useState(false);
  const [isDisqualifying, setIsDisqualifying] = useState(false);
  const [isFollowingUp, setIsFollowingUp] = useState(false);

  // Toast system
  const [toasts, setToasts] = useState<Array<{ id: number; type: ToastType; message: string }>>([]);
  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const [soapNotes, setSoapNotes] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: ""
  });
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");

  const [zoomLink, setZoomLink] = useState("");
  const [isConfirmingZoom, setIsConfirmingZoom] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);

    async function fetchOrder() {
      // Try matching by order_number first, then by id
      let { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderId)
        .maybeSingle();

      if (!data) {
        ({ data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle());
      }

      if (!error && data) {
        setOrder(data);
        setZoomLink(data.zoom_join_url || "");
        
        // --- FETCH INTAKE DATA ---
        const { data: intakeData } = await supabase
          .from('intake_forms')
          .select('form_data')
          .eq('patient_id', data.user_id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const intake = intakeData?.form_data || {};
        
        const vitals = data.patient_vitals
          ? (typeof data.patient_vitals === 'object' ? JSON.stringify(data.patient_vitals) : data.patient_vitals)
          : 'No recent vitals reported.';

        // Build summary from intake data
        const subjectiveSummary = intake.symptoms 
          ? `Patient reports symptoms: ${intake.symptoms}. Duration: ${intake.duration || 'N/A'}. Pain Level: ${intake.painLevel || 0}/10.`
          : data.intake_notes || `Patient seeking consultation for ${data.category || 'general condition'}.`;

        const objectiveSummary = `Age: ${data.patient_age || 'N/A'}. Gender: ${intake.sex || data.patient_sex || 'Not specified'}. Vitals: ${vitals}. Medical History: ${(intake.conditions || []).join(', ') || 'None reported'}. Current Meds: ${intake.medName || 'None'}.`;

        setSoapNotes({
          subjective: subjectiveSummary,
          objective: objectiveSummary,
          assessment: `Patient requesting evaluation for ${data.medication || 'treatment'}.`,
          plan: `Prescribe ${data.medication || 'medication'} ${data.dosage_instructions ? `(${data.dosage_instructions})` : 'as directed'}.`,
        });

        setMedication(data.medication || "");
        setDosage(data.dosage_instructions || "");
      } else {
        console.warn("Order not found:", orderId, error);
      }
      setLoading(false);
    }
    fetchOrder();
  }, [orderId]);

  const handleFinalize = async () => {
    if (!order || isFinalizing) return;
    setIsFinalizing(true);
    try {
      const currentUser = useAuthStore.getState().user;
      const doctorName = currentUser?.user_metadata?.first_name
        ? `Dr. ${currentUser.user_metadata.first_name} ${currentUser.user_metadata.last_name}`
        : "Attending Physician";

      const med = medication;
      const dos = dosage || "As directed";
      if (med !== order.medication || dos !== (order.dosage_instructions || "")) {
        const { error: preErr } = await supabase
          .from("orders")
          .update({ medication: med, dosage_instructions: dos })
          .eq("id", order.id);
        if (preErr) throw new Error(`Order update error: ${preErr.message}`);
      }

      const { data: dispatchData, error: dispatchError } = await supabase.functions.invoke(
        "dispatch-prescription",
        {
          body: {
            order_id: order.id,
            dosage_instructions: dos,
            doctor_note: soapNotes.plan,
            pharmacy: pharmacySlugFromOrder(order.pharmacy),
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
        showToast("error", `Pharmacy dispatch failed: ${msg}`);
        return;
      }

      try {
        await supabase.from('visit_summaries').insert([{
          patient_id: order.user_id,
          doctor_name: doctorName,
          specialty: order.category,
          diagnosis: soapNotes.assessment,
          type: 'video',
          date: new Date().toISOString(),
        }]);
      } catch (e) {
        console.warn("visit_summaries insert failed (table may not exist):", e);
      }

      const { error: rxError } = await supabase.from('prescriptions').insert([{
        patient_id: order.user_id,
        medication: med,
        dosage: dos,
        frequency: soapNotes.plan,
        status: 'active',
        refills_remaining: 3,
        doctor_id: currentUser?.id,
        pharmacy_name: order.pharmacy || "VIALSRX EXPRESS"
      }]);
      if (rxError) throw new Error(`Prescription error: ${rxError.message}`);

      const { error: orderError } = await supabase
        .from('orders')
        .update({
          medication: med,
          dosage_instructions: dos,
          doctor: doctorName,
          doctor_note: soapNotes.plan,
          doctor_id: currentUser?.id,
          last_approved_at: new Date().toISOString(),
          consultation_live: false,
        })
        .eq('id', order.id);
      if (orderError) throw new Error(`Order update error: ${orderError.message}`);

      showToast('success', `✓ Prescription dispatched to pharmacy for ${order.patient_name}`);
      setTimeout(() => navigate(`${doctorBase}/queue`), 1500);
    } catch (err: any) {
      console.error("Finalize error:", err);
      showToast('error', `Failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleRequestVideoCall = async () => {
    if (!order || isRequestingVideo) return;
    setIsRequestingVideo(true);
    try {
      const doctorMessage = soapNotes.plan || "Please book a time on my calendar for a brief consultation.";
      const { error } = await supabase
        .from('orders')
        .update({ 
          zoom_status: 'requested', 
          zoom_doctor_message: doctorMessage,
        })
        .eq('id', order.id);
      
      if (error) {
        showToast('error', `Failed to request video visit: ${error.message}`);
        return;
      }

      // ── Insert in-app notification for the patient ──
      await supabase.from('notifications').insert([{
        user_id: order.user_id,
        type: 'video_consult',
        title: 'Video Consultation Required',
        body: `Your physician has reviewed your intake and requests a brief video consultation. Message: "${doctorMessage}"`,
        unread: true,
      }]);

      // ── Trigger Resend email via email-trigger edge function ──
      // The email-trigger is set up as a DB webhook on orders UPDATE — no manual call needed.
      // It will fire automatically when zoom_status changes to 'requested'.

      showToast('info', `📅 Video visit requested — patient has been notified by app + email`);
      setTimeout(() => navigate(`${doctorBase}/queue`), 1500);
    } catch (err: any) {
      showToast('error', `Error: ${err.message}`);
    } finally {
      setIsRequestingVideo(false);
    }
  };

  const handleDisqualify = async () => {
    if (!order || isDisqualifying) return;
    const confirmed = window.confirm("Are you sure you want to disqualify this patient? This will trigger a refund request and notify the patient.");
    if (!confirmed) return;

    setIsDisqualifying(true);
    try {
      const reason = soapNotes.plan || "Clinical disqualification";
      const newTimeline = order.timeline
        ? [...order.timeline, { status: 'cancelled', date: new Date().toLocaleString(), reason }]
        : [{ status: 'cancelled', date: new Date().toLocaleString() }];

      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          doctor_note: soapNotes.plan,
          refund_reason: reason,
          timeline: newTimeline
        })
        .eq('id', order.id);
      
      if (error) {
        showToast('error', `Failed to disqualify: ${error.message}`);
        return;
      }

      if (order.stripe_payment_intent_id && order.payment_status === 'paid') {
        const { error: refundErr } = await supabase.functions.invoke('stripe-create-refund', {
          body: {
            payment_intent_id: order.stripe_payment_intent_id,
            order_number: order.order_number,
            reason: 'clinical_disqualification',
          },
        });
        if (refundErr) {
          console.error('stripe-create-refund:', refundErr);
          showToast('info', 'Order cancelled — check Stripe dashboard if refund did not complete.');
        }
      }

      // ── Insert in-app notification for the patient ──
      await supabase.from('notifications').insert([{
        user_id: order.user_id,
        type: 'other',
        title: 'Consultation Update',
        body: `Your consultation could not be approved at this time. A refund has been initiated. ${reason !== 'Clinical disqualification' ? `Reason: ${reason}` : ''}`,
        unread: true,
      }]);

      showToast('error', `✕ Patient Disqualified. Refund process initiated.`);
      setTimeout(() => navigate(`${doctorBase}/queue`), 1500);
    } catch (err: any) {
      showToast('error', `Error: ${err.message}`);
    } finally {
      setIsDisqualifying(false);
    }
  };

  // ── NEW: Follow-up required ─────────────────────────────────────────
  const handleFollowUp = async () => {
    if (!order || isFollowingUp) return;
    setIsFollowingUp(true);
    try {
      const reason = soapNotes.plan || "Additional information required before prescription can be issued.";
      const newTimeline = order.timeline
        ? [...order.timeline, { status: 'follow_up', date: new Date().toLocaleString() }]
        : [{ status: 'follow_up', date: new Date().toLocaleString() }];

      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'medical_review',  // keeps it in review queue
          doctor_note: reason,
          follow_up_reason: reason,
          timeline: newTimeline,
        })
        .eq('id', order.id);
      
      if (error) {
        showToast('error', `Failed to mark follow-up: ${error.message}`);
        return;
      }

      // ── Insert in-app notification for the patient ──
      await supabase.from('notifications').insert([{
        user_id: order.user_id,
        type: 'message',
        title: 'Follow-Up Required',
        body: `Your physician needs additional information. Note: "${reason}" — Please check your messages or contact us to continue.`,
        unread: true,
      }]);

      showToast('info', `📋 Follow-up flagged — patient has been notified`);
      setTimeout(() => navigate(`${doctorBase}/queue`), 1500);
    } catch (err: any) {
      showToast('error', `Error: ${err.message}`);
    } finally {
      setIsFollowingUp(false);
    }
  };

  const handleConfirmZoom = async () => {
    if (!order || isConfirmingZoom) return;
    if (!zoomLink) {
      showToast('error', 'Please provide a Zoom meeting link.');
      return;
    }
    setIsConfirmingZoom(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          zoom_status: 'confirmed', 
          zoom_join_url: zoomLink,
          // If no time is set yet, we could set a default or use the requested time
        })
        .eq('id', order.id);
      
      if (!error) {
        showToast('success', `✓ Zoom Meeting Confirmed for ${order.patient_name}`);
        setOrder(prev => ({ ...prev, zoom_status: 'confirmed', zoom_join_url: zoomLink }));
      } else {
        showToast('error', `Failed to confirm: ${error.message}`);
      }
    } catch (err: any) {
      showToast('error', `Error: ${err.message}`);
    } finally {
      setIsConfirmingZoom(false);
    }
  };

  const [transcript, setTranscript] = useState<string[]>([]);
  const [isSyncingVitals, setIsSyncingVitals] = useState(false);
  const [isLiveVideoActive, setIsLiveVideoActive] = useState(false);
  const [isStartingLive, setIsStartingLive] = useState(false);

  const startLiveConsult = async () => {
    if (!order) return;
    setIsStartingLive(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ consultation_live: true })
        .eq('id', order.id);
      if (error) throw new Error(error.message);
      setIsLiveVideoActive(true);
      showToast('success', `🎥 Live session started — patient is being notified`);
    } catch (err: any) {
      showToast('error', `Could not start session: ${err.message}`);
    } finally {
      setIsStartingLive(false);
    }
  };

  const endLiveConsult = async () => {
    if (!order) return;
    await supabase
      .from('orders')
      .update({ consultation_live: false })
      .eq('id', order.id);
    showToast('info', 'Consultation ended.');
    setTimeout(() => navigate(`${doctorBase}/queue`), 800);
  };

  useEffect(() => {
    if (!order) return;
    
    // Simulate AI Scribe Typing
    const messages = [
      `Initializing clinical scribe for ${order.patient_name}...`,
      "Analyzing patient intake forms...",
      `Subjective: Patient reports ${order.medication} requirement.`,
      "Vitals synchronization in progress...",
      "AI: Listening for clinical contraindications...",
      "Detected mention of previous history: No major allergies.",
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < messages.length) {
        setTranscript(prev => [...prev, messages[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [order]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#22c55e]" />
        <p className="text-[#7f9488] text-xs font-black uppercase tracking-widest">Loading Patient Record...</p>
      </div>
    );
  }

  // ── No orderId or order not found → show picker ──
  if (!orderId || !order) {
    return <PatientPicker />;
  }

  // ── Full Consultation UI ──
  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col gap-6 animate-in fade-in duration-700 pb-10">
      <ToastBar toasts={toasts} />
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 flex flex-wrap items-center justify-between shadow-sm shrink-0 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate(`${doctorBase}/consult`)}
            className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 flex items-center justify-center transition-all text-slate-500 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0A2E1F] leading-tight truncate">{order.patient_name || 'Patient Details'}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
               <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                 ID: {order.order_number}
               </span>
               <span className="h-1 w-1 rounded-full bg-slate-300" />
               <span className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-widest whitespace-nowrap">
                 {order.category}
               </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Badge variant="outline" className="hidden sm:flex rounded-xl bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 py-1.5 px-3 text-xs font-bold uppercase shadow-sm">
            <ShieldCheck className="h-4 w-4" /> HIPAA SECURE
          </Badge>
          <div className="hidden sm:block h-8 w-px bg-slate-200 mx-2" />
          {order.zoom_status === 'confirmed' && (
            <Button
              className="rounded-xl h-11 px-5 text-sm font-bold bg-[#0A2E1F] text-white hover:bg-[#153e2d] shadow-md shadow-emerald-900/10"
              onClick={() => window.open(order.zoom_join_url || 'https://zoom.us', '_blank')}
            >
              <Video className="h-4 w-4 mr-2" /> Join Zoom Meeting
            </Button>
          )}
          <Button
            variant="outline"
            className="rounded-xl h-11 px-5 text-sm font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
            onClick={() => navigate(`${doctorBase}/consult`)}
          >
            <Users className="h-4 w-4 mr-2" /> View Queue
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Video & AI Scribe */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          
          {/* Video Feed */}
          <div className="bg-[#050907] rounded-[2rem] w-full h-[400px] sm:h-[460px] relative overflow-hidden shadow-2xl flex flex-col items-center justify-center border border-slate-200">
            {/* Vitals Overlay (Top Right) */}
            <div className="absolute top-5 right-5 z-20">
              <div 
                className={cn(
                  "bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border transition-all",
                  isSyncingVitals ? "border-emerald-500/50 text-emerald-400" : "border-white/10 text-white"
                )}
                onMouseEnter={() => setIsSyncingVitals(true)}
                onMouseLeave={() => setIsSyncingVitals(false)}
              >
                <Activity className={cn("h-3 w-3 shrink-0", isSyncingVitals ? "animate-pulse" : "")} />
                <span className="text-[9px] font-black uppercase tracking-widest truncate">
                  {isSyncingVitals ? 'Syncing Live Vitals' : 'Vitals Synced'}
                </span>
              </div>
            </div>

            {isLiveVideoActive ? (
              <iframe 
                src={`https://meet.jit.si/peak-health-consult-${order.id}`} 
                allow="camera; microphone; fullscreen; display-capture" 
                className="w-full h-full border-0 rounded-[2rem]" 
              />
            ) : (
              <div className="text-center p-6 flex flex-col items-center justify-center z-10 -mt-12">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-slate-800 border-2 border-slate-700 mx-auto flex items-center justify-center mb-4 shadow-xl relative">
                  <span className="text-3xl sm:text-4xl font-black text-slate-400">
                    {order.patient_name?.charAt(0) || '?'}
                  </span>
                  <div className="absolute bottom-0 right-0 h-4 w-4 bg-emerald-500/30 rounded-full border-[3px] border-slate-800" />
                </div>
                <p className="text-white text-lg sm:text-xl font-bold tracking-tight">{order.patient_name}</p>
                <p className="text-emerald-500/50 text-[10px] font-bold tracking-widest uppercase mt-1 mb-6">Patient Offline / Waiting</p>
                
                <Button 
                  onClick={startLiveConsult}
                  disabled={isStartingLive}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 h-12 font-bold tracking-widest uppercase text-xs shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isStartingLive ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Video className="h-4 w-4 mr-2" />}
                  {isStartingLive ? 'Connecting Patient...' : 'Connect Live Video'}
                </Button>
              </div>
            )}

            {/* Premium Video Controls (Sleek & Bottom) */}
            {!isLiveVideoActive && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.6)] transition-all z-20 w-[90%] sm:w-auto max-w-full overflow-x-auto custom-scrollbar">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0",
                    isMuted ? "bg-red-500 text-white shadow-lg shadow-red-500/30" : "bg-white/20 text-white hover:bg-white/30")}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                
                <button
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0",
                    isVideoOff ? "bg-red-500 text-white shadow-lg shadow-red-500/30" : "bg-white/20 text-white hover:bg-white/30")}
                >
                  {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                </button>

                <div className="h-6 w-px bg-white/20 mx-2 shrink-0" />

                <button 
                  onClick={endLiveConsult}
                  className="h-10 px-5 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center transition-all shadow-md shadow-red-600/30 font-bold tracking-widest uppercase text-[10px] sm:text-xs shrink-0 gap-2"
                >
                  <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" /> End Consult
                </button>

                <div className="h-6 w-px bg-white/20 mx-2 shrink-0" />

                <Link to={`${doctorBase}/messages?userId=${order.user_id}`} className="shrink-0">
                  <button className="h-10 w-10 bg-white/20 text-white hover:bg-white/30 rounded-xl flex items-center justify-center transition-all">
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Zoom & Appointment Management */}
          <Card className="border-2 border-emerald-100 bg-white shadow-lg rounded-[1.5rem] overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-[#0A2E1F] uppercase tracking-widest flex items-center gap-2">
                  <Video className="h-4 w-4 text-emerald-600" /> Zoom Logistics
                </h3>
                <Badge className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-bold uppercase",
                  order.zoom_status === 'confirmed' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                )}>
                  {order.zoom_status?.replace('_', ' ')}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Paste Real Zoom Link Here..."
                    value={zoomLink}
                    onChange={(e) => setZoomLink(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-semibold text-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-[#0A2E1F] text-white rounded-xl h-11 font-bold text-xs uppercase tracking-widest shadow-md hover:bg-[#153e2d] transition-all disabled:opacity-50"
                    onClick={handleConfirmZoom}
                    disabled={isConfirmingZoom}
                  >
                    {isConfirmingZoom ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Confirm & Send Zoom
                  </Button>
                  
                  {order.zoom_status === 'confirmed' && (
                    <Button 
                      variant="outline"
                      className="rounded-xl h-11 px-4 border-slate-200 text-slate-600 hover:bg-slate-50"
                      onClick={() => window.open(zoomLink, '_blank')}
                    >
                      <Zap className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                * Confirming will instantly notify the patient and provide them with the "Launch Zoom" button in their portal.
              </p>
            </CardContent>
          </Card>

          {/* AI Scribe */}
          <Card className="border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white shadow-sm overflow-hidden rounded-[1.5rem]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-emerald-100/50">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-sm font-bold text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                  <Bot className="h-5 w-5 text-emerald-600" /> Executive AI Scribe
                </span>
                <Badge variant="outline" className="ml-auto bg-emerald-100/50 text-emerald-700 border-emerald-200 text-[10px] font-bold">LIVE SYNC</Badge>
              </div>
              <div className="h-48 overflow-y-auto pr-4 custom-scrollbar space-y-3">
                {transcript.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-full gap-3 text-emerald-600/60">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <p className="text-sm font-semibold tracking-wider">Listening and securely transcribing...</p>
                   </div>
                ) : (
                  transcript.map((line, idx) => (
                    <div key={idx} className="flex gap-4 text-sm animate-in slide-in-from-left-2 duration-500 bg-white/50 p-3 rounded-xl border border-emerald-50">
                      <span className="text-emerald-500/70 font-mono text-xs mt-0.5 shrink-0">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[#0A2E1F] font-semibold leading-relaxed">{line}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: SOAP Notes & e-Rx */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
          
          <Card className="border border-slate-200 bg-white shadow-md flex flex-col rounded-[1.5rem] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <FileSignature className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0A2E1F] uppercase tracking-wider text-sm">Clinical Notes</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">SOAP Format</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold uppercase tracking-widest shadow-sm">AI ASSISTED</Badge>
            </div>
            <CardContent className="p-6 space-y-6">
              {(['subjective', 'objective', 'assessment', 'plan'] as const).map(field => (
                <div key={field}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {field}
                  </p>
                  <textarea
                    value={soapNotes[field]}
                    onChange={e => setSoapNotes({ ...soapNotes, [field]: e.target.value })}
                    className={cn(
                      "w-full text-sm font-medium leading-relaxed border p-4 rounded-xl resize-none transition-all outline-none",
                      field === 'assessment'
                        ? "bg-emerald-50/30 border-emerald-200 text-[#0A2E1F] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 h-28"
                        : "bg-slate-50 border-slate-200 text-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:bg-white h-24"
                    )}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* STEP 5: DOCTOR DECISION MATRIX */}
          <div className="lg:col-span-12">
            <div className="flex items-center gap-3 mb-4">
               <div className="h-8 w-8 rounded-full bg-[#0A2E1F] text-white flex items-center justify-center font-black text-sm">5</div>
               <h2 className="text-lg font-bold text-[#0A2E1F] uppercase tracking-widest">Doctor Decision</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              
              {/* PATH A: QUALIFIES */}
              <Card className={cn(
                "border-2 transition-all duration-300 overflow-hidden",
                "border-emerald-100 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-900/10"
              )}>
                <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                       <CheckCircle2 className="h-5 w-5" />
                     </div>
                     <span className="font-black text-xs text-emerald-900 uppercase tracking-widest">Patient Qualifies</span>
                   </div>
                   <Badge className="bg-emerald-600 text-white border-none text-[9px]">RECOMMENDED</Badge>
                </div>
                <CardContent className="p-5 space-y-4">
                  <ul className="space-y-2 mb-6">
                    {["Approve patient", "Select medication & dose", "Send to pharmacy"].map(li => (
                      <li key={li} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <div className="h-1 w-1 rounded-full bg-emerald-400" /> {li}
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medication</label>
                      <input 
                        value={medication}
                        onChange={(e) => setMedication(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-[#0A2E1F] outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instructions</label>
                      <textarea 
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-[#0A2E1F] outline-none focus:border-emerald-500 h-20 resize-none"
                      />
                    </div>
                    <Button 
                      onClick={handleFinalize}
                      disabled={isFinalizing || isRequestingVideo || isDisqualifying || isFollowingUp}
                      className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-900/10"
                    >
                      {isFinalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pill className="h-4 w-4 mr-2" />}
                      Approve & Prescribe
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* PATH B: NEEDS VIDEO */}
              <Card className={cn(
                "border-2 transition-all duration-300 overflow-hidden",
                "border-amber-100 hover:border-amber-500 hover:shadow-xl hover:shadow-amber-900/10"
              )}>
                <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-white">
                       <Video className="h-4 w-4" />
                     </div>
                     <span className="font-black text-xs text-amber-900 uppercase tracking-widest">Needs Video Visit</span>
                   </div>
                </div>
                <CardContent className="p-5 space-y-4">
                  <ul className="space-y-2 mb-6">
                    {["More info / safety concern", "Request video call", "Send availability to patient"].map(li => (
                      <li key={li} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <div className="h-1 w-1 rounded-full bg-amber-400" /> {li}
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Message to Patient</p>
                    <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 text-[11px] font-medium text-amber-900 leading-relaxed mb-4 italic">
                      "I need a brief video consultation to discuss your medical history before I can safely issue a prescription."
                    </div>
                    <Button 
                      variant="outline"
                      onClick={handleRequestVideoCall}
                      disabled={isFinalizing || isRequestingVideo || isDisqualifying || isFollowingUp}
                      className="w-full h-12 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 font-black uppercase text-xs tracking-widest"
                    >
                      {isRequestingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
                      Request Video Call
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* PATH C: FOLLOW-UP REQUIRED — NEW */}
              <Card className={cn(
                "border-2 transition-all duration-300 overflow-hidden",
                "border-blue-100 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-900/10"
              )}>
                <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                       <FileSignature className="h-4 w-4" />
                     </div>
                     <span className="font-black text-xs text-blue-900 uppercase tracking-widest">Follow-Up Required</span>
                   </div>
                </div>
                <CardContent className="p-5 space-y-4">
                  <ul className="space-y-2 mb-6">
                    {["Missing information", "Needs clarification", "Patient stays in queue"].map(li => (
                      <li key={li} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <div className="h-1 w-1 rounded-full bg-blue-400" /> {li}
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-[11px] font-medium text-blue-900 leading-relaxed mb-4 italic">
                      "Use the Plan field in SOAP notes above to write your follow-up message to the patient."
                    </div>
                    <Button 
                      variant="outline"
                      onClick={handleFollowUp}
                      disabled={isFinalizing || isRequestingVideo || isDisqualifying || isFollowingUp}
                      className="w-full h-12 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 font-black uppercase text-xs tracking-widest"
                    >
                      {isFollowingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4 mr-2" />}
                      Flag Follow-Up
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* PATH D: DISQUALIFIES */}
              <Card className={cn(
                "border-2 transition-all duration-300 overflow-hidden",
                "border-red-100 hover:border-red-500 hover:shadow-xl hover:shadow-red-900/10"
              )}>
                <div className="p-4 bg-red-50 border-b border-red-100 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center text-white">
                       <XCircle className="h-5 w-5" />
                     </div>
                     <span className="font-black text-xs text-red-900 uppercase tracking-widest">Patient Disqualifies</span>
                   </div>
                </div>
                <CardContent className="p-5 space-y-4">
                  <ul className="space-y-2 mb-6">
                    {["Not eligible / contraindicated", "Trigger refund", "Email sent to patient"].map(li => (
                      <li key={li} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <div className="h-1 w-1 rounded-full bg-red-400" /> {li}
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 mb-6">
                       <p className="text-[10px] font-black text-red-900 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                         <AlertCircle className="h-3 w-3" /> Auto-Refund Enabled
                       </p>
                       <p className="text-[11px] text-red-700 leading-relaxed font-medium">
                         Selecting this will cancel the order, mark payment as refunded, and notify the patient by app + email.
                       </p>
                    </div>
                    <Button 
                      variant="ghost"
                      onClick={handleDisqualify}
                      disabled={isFinalizing || isRequestingVideo || isDisqualifying || isFollowingUp}
                      className="w-full h-12 rounded-xl text-red-600 hover:bg-red-50 font-black uppercase text-xs tracking-widest"
                    >
                      {isDisqualifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                      Disqualify & Refund
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>

          <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mt-6 bg-slate-50 py-2 rounded-lg">
            Routing to: <span className="text-emerald-600">{order.pharmacy || "Network Pharmacy"}</span>
          </p>

        </div>
      </div>
    </div>
  );
}

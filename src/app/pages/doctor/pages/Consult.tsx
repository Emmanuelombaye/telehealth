import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { 
  ArrowLeft, Video, Mic, MicOff, VideoOff, MessageSquare, 
  Pill, Zap, ShieldCheck, Activity, Users, 
  Sparkles, CheckCircle2, MoreHorizontal, Loader2,
  Stethoscope, Clock, ChevronRight, AlertCircle, Search, Filter
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { useAuthStore } from "../../../../lib";
import { supabase } from "../../../../lib/supabaseClient";

// ─── Patient Picker (shown when no orderId in URL) ───────────────────────────
function PatientPicker() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

    // Real-time sync
    const channel = supabase
      .channel('consult-queue-watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchQueue())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    order_submitted:  { label: "Awaiting Review", color: "text-amber-400",  bg: "bg-amber-400/10",  dot: "bg-amber-400" },
    medical_review: { label: "In Review",       color: "text-[#22c55e]",  bg: "bg-[#22c55e]/10", dot: "bg-[#22c55e]" },
    rx_sent:          { label: "Rx Dispatched",   color: "text-blue-400",   bg: "bg-blue-400/10",  dot: "bg-blue-400" },
  };

  const filtered = queue.filter(o =>
    !search || o.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.medication?.toLowerCase().includes(search.toLowerCase()) ||
    o.order_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[0.2em]">Live Queue Active</span>
          </div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-tight">Consultation Hub</h1>
          <p className="text-[#d4c4a8] text-[10px] font-black uppercase tracking-[0.3em] mt-1 opacity-80">
            Select a patient to begin — {filtered.length} clinical specimens awaiting review
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7f9488]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patient or Rx..."
              className="w-64 bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-9 pr-4 text-xs font-bold text-white focus:border-[#22c55e]/50 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Awaiting Review", value: queue.filter(o => o.status === 'order_submitted').length, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "In Active Review", value: queue.filter(o => o.status === 'medical_review').length, color: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
          { label: "Rx Dispatched", value: queue.filter(o => o.status === 'rx_sent').length, color: "text-blue-400", bg: "bg-blue-400/10" },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} border border-white/5 rounded-2xl p-4`}>
            <p className={`text-2xl font-black ${stat.color} italic`}>{stat.value}</p>
            <p className="text-[10px] font-black text-[#7f9488] uppercase tracking-widest mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Patient list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-[#22c55e]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="h-16 w-16 rounded-3xl bg-white/5 flex items-center justify-center border border-white/5">
              <Stethoscope className="h-8 w-8 text-white/20" />
            </div>
            <p className="text-lg font-black text-white/30 italic uppercase tracking-wider">
              {search ? "No matching patients" : "Queue is clear"}
            </p>
            <p className="text-xs font-bold text-[#7f9488] uppercase tracking-widest">
              {search ? "Try a different search term" : "No patients awaiting consultation"}
            </p>
          </div>
        ) : filtered.map((order, i) => {
          const cfg = statusConfig[order.status] || statusConfig.order_submitted;
          return (
            <button
              key={order.id}
              onClick={() => navigate(`/doctor/consult?orderId=${order.order_number}`)}
              className="w-full group flex items-center gap-5 p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-[#22c55e]/30 hover:bg-[#22c55e]/5 transition-all duration-200 text-left relative overflow-hidden"
            >
              {/* Priority number */}
              <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 group-hover:border-[#22c55e]/30 flex items-center justify-center font-black text-lg text-[#7f9488] group-hover:text-[#22c55e] transition-all shrink-0">
                {i + 1}
              </div>

              {/* Avatar */}
              <div className="h-12 w-12 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center font-black text-[#22c55e] text-lg shrink-0">
                {order.patient_name?.charAt(0) || '?'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-sm font-black text-white italic truncate">{order.patient_name || "Unknown Patient"}</p>
                  {order.urgent && (
                    <span className="text-[9px] font-black text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse shrink-0">
                      URGENT
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-[#7f9488] uppercase tracking-widest truncate">
                  {order.medication} · {order.category}
                </p>
                <p className="text-[9px] text-[#7f9488]/60 mt-0.5 font-mono">#{order.order_number}</p>
              </div>

              {/* Status */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${cfg.bg} shrink-0`}>
                <div className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                <span className={`text-[9px] font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
              </div>

              {/* Wait time */}
              <div className="flex items-center gap-1.5 text-[#7f9488] shrink-0 hidden md:flex">
                <Clock className="h-3 w-3" />
                <span className="text-[10px] font-bold">
                  {Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)}m
                </span>
              </div>

              {/* Arrow */}
              <ChevronRight className="h-5 w-5 text-[#7f9488] group-hover:text-[#22c55e] group-hover:translate-x-0.5 transition-all shrink-0" />

              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#22c55e]/0 to-[#22c55e]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Consult Page ────────────────────────────────────────────────────────
export function DoctorConsultPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const navigate = useNavigate();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(!!orderId); // only load if orderId present
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isRequestingVideo, setIsRequestingVideo] = useState(false);
  const [isDisqualifying, setIsDisqualifying] = useState(false);

  const [soapNotes, setSoapNotes] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: ""
  });
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");

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

      // 1. Visit summary
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

      // 2. Prescription
      await supabase.from('prescriptions').insert([{
        patient_id: order.user_id,
        medication: order.medication,
        dosage: order.dosage_instructions || "As directed",
        frequency: soapNotes.plan,
        status: 'active',
        refills_remaining: 3,
        doctor_id: currentUser?.id,
        pharmacy_name: order.pharmacy || "VIALSRX EXPRESS"
      }]);

      // 3. Update order status → rx_sent
      const newTimeline = order.timeline
        ? [...order.timeline, { status: 'rx_sent', date: new Date().toLocaleString() }]
        : [{ status: 'rx_sent', date: new Date().toLocaleString() }];

      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'rx_sent',
          medication: medication,
          dosage_instructions: dosage,
          doctor: doctorName,
          doctor_note: soapNotes.plan,
          doctor_id: currentUser?.id,
          last_approved_at: new Date().toISOString(),
          timeline: newTimeline,
        })
        .eq('id', order.id);

      if (!orderError) {
        navigate('/doctor/queue');
      } else {
        console.error("Order update error:", orderError);
      }
    } catch (err) {
      console.error("Finalize error:", err);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleRequestVideoCall = async () => {
    if (!order || isRequestingVideo) return;
    setIsRequestingVideo(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          zoom_status: 'requested', 
          zoom_doctor_message: soapNotes.plan || "Please book a time on my calendar for a brief consultation." 
        })
        .eq('id', order.id);
      
      if (!error) {
        navigate('/doctor/queue');
      } else {
        console.error("Video request error:", error);
      }
    } catch (err) {
      console.error("Video request error:", err);
    } finally {
      setIsRequestingVideo(false);
    }
  };

  const handleDisqualify = async () => {
    if (!order || isDisqualifying) return;
    if (!confirm("Are you sure you want to disqualify this patient and initiate a refund?")) return;
    
    setIsDisqualifying(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled', 
          doctor_note: soapNotes.plan || "Patient did not qualify based on medical history." 
        })
        .eq('id', order.id);
      
      if (!error) {
        navigate('/doctor/queue');
      } else {
        console.error("Disqualify error:", error);
      }
    } catch (err) {
      console.error("Disqualify error:", err);
    } finally {
      setIsDisqualifying(false);
    }
  };

  const [transcript, setTranscript] = useState<string[]>([]);

  const [isSyncingVitals, setIsSyncingVitals] = useState(false);

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
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4 overflow-hidden -mt-2">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/doctor/consult')}
            className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white italic uppercase tracking-tighter leading-tight">{order.patient_name || 'Patient Details'}</h1>
            <p className="text-[10px] font-black text-[#d4c4a8] uppercase tracking-[0.2em] mt-0.5 opacity-80">
              Consultation ID: {order.order_number} · {order.category}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1.5 py-1 text-[10px] font-black">
            <ShieldCheck className="h-3 w-3" /> HIPAA SECURE
          </Badge>
          <div className="h-8 w-[1px] bg-white/10 mx-2" />
          {order.zoom_status === 'confirmed' && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-9 text-xs font-bold border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => window.open(order.zoom_join_url || 'https://zoom.us', '_blank')}
            >
              <Video className="h-3.5 w-3.5 mr-2" /> Join Zoom Call
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl h-9 text-xs font-bold border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={() => navigate(`/doctor/consult`)}
          >
            <Users className="h-3.5 w-3.5 mr-2" /> All Patients
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left Column: Video & Controls */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden min-w-0">
          <div className="flex-1 bg-slate-900 rounded-[32px] relative overflow-hidden group shadow-2xl flex items-center justify-center border border-white/5">
            <div className="text-center">
              <div className="h-24 w-24 rounded-full bg-slate-800 border-4 border-slate-700 mx-auto flex items-center justify-center mb-4 shadow-xl">
                <span className="text-3xl font-black text-slate-400">
                  {order.patient_name?.charAt(0) || '?'}
                </span>
              </div>
              <p className="text-white font-bold">{order.patient_name}</p>
              <p className="text-slate-400 text-sm mt-1">Secure Connection Active</p>
            </div>

            <div className="absolute top-6 left-6 space-y-2">
              <div 
                className={cn(
                  "bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10 transition-all",
                  isSyncingVitals ? "border-emerald-500/50" : ""
                )}
                onMouseEnter={() => setIsSyncingVitals(true)}
                onMouseLeave={() => setIsSyncingVitals(false)}
              >
                <Activity className={cn("h-3.5 w-3.5", isSyncingVitals ? "text-emerald-400 animate-pulse" : "text-emerald-400")} />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  {isSyncingVitals ? 'Syncing Live Vitals...' : 'Vitals Synced'}
                </span>
              </div>
            </div>

            {/* Controls - Optimized for full visibility */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center justify-center gap-3 px-4 py-3 bg-black/60 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:bottom-12 z-50 whitespace-nowrap min-w-fit">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                  isMuted ? "bg-red-500 text-white shadow-lg shadow-red-500/30" : "bg-white/10 text-white hover:bg-white/20")}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              
              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                  isVideoOff ? "bg-red-500 text-white shadow-lg shadow-red-500/30" : "bg-white/10 text-white hover:bg-white/20")}
              >
                {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </button>

              <button 
                onClick={() => navigate('/doctor/queue')}
                className="h-12 w-20 bg-red-600 hover:bg-red-700 text-white rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl shadow-red-600/40 group/zap"
              >
                <Zap className="h-6 w-6 fill-current group-hover:scale-110 transition-transform" />
              </button>

              <Link to={`/doctor/messages?userId=${order.user_id}`}>
                <button className="h-12 w-12 bg-white/10 text-white hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all duration-300">
                  <MessageSquare className="h-5 w-5" />
                </button>
              </Link>

              <button className="h-12 w-12 bg-white/10 text-white hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all duration-300">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* AI Scribe */}
          <Card className="h-40 border-none bg-emerald-500/5 border border-emerald-500/10 overflow-hidden shrink-0">
            <CardContent className="p-4 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">AI Scribe · Live Transcription</span>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1">
                {transcript.length === 0 ? (
                   <p className="text-xs text-slate-400 italic">Listening and securely transcribing clinical notes...</p>
                ) : (
                  transcript.map((line, idx) => (
                    <p key={idx} className="text-xs text-emerald-400/80 font-medium font-mono animate-in slide-in-from-left-1 duration-300">
                      <span className="text-emerald-500/40 mr-2">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                      {line}
                    </p>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: SOAP Notes & e-Rx */}
        <div className="w-[380px] flex flex-col gap-4 overflow-hidden shrink-0">
          <Card className="flex-1 overflow-hidden border-[#1a2620] bg-[#0c120f] shadow-xl flex flex-col">
            <div className="p-4 border-b border-[#1a2620] flex items-center justify-between bg-white/[0.03] backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#22c55e]" />
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-[#d4c4a8]">Clinical Documentation Terminal</h3>
              </div>
              <Badge variant="outline" className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30 text-[9px] font-black uppercase tracking-widest">AI ASSISTED</Badge>
            </div>
            <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar">
              <div className="p-5 space-y-6">
                {(['subjective', 'objective', 'assessment', 'plan'] as const).map(field => (
                  <div key={field}>
                    <p className="text-[9px] font-black text-[#7f9488] uppercase tracking-[0.2em] mb-2.5 flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-[#22c55e]/50" />
                      {field} Analysis
                    </p>
                    <textarea
                      value={soapNotes[field]}
                      onChange={e => setSoapNotes({ ...soapNotes, [field]: e.target.value })}
                      className={cn(
                        "w-full text-xs font-medium leading-relaxed bg-black/30 border p-3 rounded-xl resize-none transition-all focus:outline-none",
                        field === 'assessment'
                          ? "border-[#22c55e]/30 text-[#22c55e] focus:border-[#22c55e]/60 h-20"
                          : "border-white/5 text-[#d4c4a8] focus:border-white/20 h-20"
                      )}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* E-Prescribing */}
          <Card className="border-[#1a2620] bg-gradient-to-br from-[#0c120f] to-[#060807] shadow-2xl overflow-hidden shrink-0 border-t-[#22c55e]/30">
            <div className="p-4 bg-[#22c55e] text-[#060807] flex items-center gap-2">
              <Pill className="h-4 w-4" />
              <h3 className="font-black text-[10px] uppercase tracking-[0.2em]">E-Prescribing Directive</h3>
            </div>
            <CardContent className="p-5 space-y-5">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black text-[#d4c4a8] uppercase tracking-widest opacity-60">Confirmed Medication</p>
                  <input 
                    value={medication}
                    onChange={(e) => setMedication(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-[#22c55e]/50 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black text-[#d4c4a8] uppercase tracking-widest opacity-60">Dosage / Instructions</p>
                  <textarea 
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-[#22c55e]/50 outline-none h-16 resize-none"
                    placeholder="e.g. Inject three units weekly"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={handleFinalize}
                  disabled={isFinalizing || isRequestingVideo || isDisqualifying}
                  className="w-full rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] text-black h-11 font-black uppercase text-xs tracking-widest shadow-lg shadow-[#22c55e]/20"
                >
                  {isFinalizing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Finalize & Send to Pharmacy
                </Button>

                <Button
                  variant="outline"
                  onClick={handleRequestVideoCall}
                  disabled={isFinalizing || isRequestingVideo || isDisqualifying}
                  className="w-full rounded-2xl border-[#22c55e]/20 text-[#22c55e] h-11 font-black uppercase text-xs tracking-widest hover:bg-[#22c55e]/5 gap-2 transition-all flex items-center justify-center"
                >
                  {isRequestingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                  Request Video Call Visit
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleDisqualify}
                  disabled={isFinalizing || isRequestingVideo || isDisqualifying}
                  className="w-full text-red-500/40 hover:text-red-500 hover:bg-red-500/5 h-10 rounded-xl font-black uppercase text-[9px] tracking-[0.2em] transition-all"
                >
                  {isDisqualifying ? "Disqualifying..." : "Disqualify Specimen & Refund"}
                </Button>
              </div>
              <p className="text-center text-[9px] font-black text-[#7f9488] uppercase tracking-widest mt-4">
                Sent to: {order.pharmacy || "Patient's Preferred Network Pharmacy"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

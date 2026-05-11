import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { 
  ArrowLeft, Video, Mic, MicOff, VideoOff, MessageSquare, 
  Pill, Zap, ShieldCheck, Activity, Users, 
  Sparkles, CheckCircle2, MoreHorizontal, Loader2,
  Stethoscope, Clock, ChevronRight, AlertCircle, Search, Filter,
  Bot, FileSignature
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { useAuthStore } from "../../../../lib";
import { supabase } from "../../../../lib/supabaseClient";

function PatientPicker() {
  const navigate = useNavigate();
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            onClick={() => navigate(`/doctor/consult?orderId=${order.order_number}`)}
            className="group flex flex-col p-5 rounded-[1.25rem] bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 text-left relative overflow-hidden h-full"
          >
            <div className="flex items-start justify-between mb-4 w-full">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                   {order.patient_name?.charAt(0) || '?'}
                 </div>
                 <div>
                   <p className="text-sm font-bold text-[#0A2E1F]">{order.patient_name || "Unknown Patient"}</p>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{order.order_number}</p>
                 </div>
               </div>
               {order.urgent && (
                 <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[10px] font-bold uppercase py-0.5">Urgent</Badge>
               )}
            </div>

            <div className="space-y-2 flex-1">
               <div className="flex items-center gap-2 text-sm text-slate-600">
                 <Pill className="h-4 w-4 text-slate-400" />
                 <span className="font-semibold">{order.medication || 'Pending Consult'}</span>
               </div>
               <div className="flex items-center gap-2 text-xs text-slate-500">
                 <Clock className="h-3.5 w-3.5 text-slate-400" />
                 Wait time: {Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)} mins
               </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between w-full">
               <Badge variant="outline" className={cn(
                 "text-[10px] font-bold uppercase border",
                 order.status === 'medical_review' ? "bg-amber-50 text-amber-700 border-amber-200" :
                 order.status === 'order_submitted' ? "bg-blue-50 text-blue-700 border-blue-200" :
                 "bg-emerald-50 text-emerald-700 border-emerald-200"
               )}>
                 {order.status?.replace('_', ' ')}
               </Badge>
               <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                  Join Room <ChevronRight className="h-3 w-3" />
               </div>
            </div>
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
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4 overflow-hidden -mt-2 animate-in fade-in duration-700">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/doctor/consult')}
            className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 flex items-center justify-center transition-all text-slate-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#0A2E1F] leading-tight">{order.patient_name || 'Patient Details'}</h1>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                 ID: {order.order_number}
               </span>
               <span className="h-1 w-1 rounded-full bg-slate-300" />
               <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                 {order.category}
               </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="rounded-xl bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 py-1.5 px-3 text-[10px] font-bold uppercase shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" /> HIPAA SECURE
          </Badge>
          <div className="h-8 w-px bg-slate-200 mx-1" />
          {order.zoom_status === 'confirmed' && (
            <Button
              className="rounded-xl h-10 px-4 text-xs font-bold bg-[#0A2E1F] text-white hover:bg-[#153e2d] shadow-md shadow-emerald-900/10"
              onClick={() => window.open(order.zoom_join_url || 'https://zoom.us', '_blank')}
            >
              <Video className="h-4 w-4 mr-2" /> Join Zoom Meeting
            </Button>
          )}
          <Button
            variant="outline"
            className="rounded-xl h-10 px-4 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
            onClick={() => navigate(`/doctor/consult`)}
          >
            <Users className="h-4 w-4 mr-2" /> View Queue
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Column: Video & AI Scribe */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden min-w-0">
          
          {/* Video Feed */}
          <div className="flex-1 bg-black rounded-[2rem] relative overflow-hidden group shadow-xl flex items-center justify-center border-4 border-slate-100">
            <div className="text-center">
              <div className="h-28 w-28 rounded-full bg-slate-800 border-4 border-slate-700 mx-auto flex items-center justify-center mb-5 shadow-2xl">
                <span className="text-4xl font-black text-slate-400">
                  {order.patient_name?.charAt(0) || '?'}
                </span>
              </div>
              <p className="text-white text-lg font-bold">{order.patient_name}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                 <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase">Secure Connection Active</p>
              </div>
            </div>

            <div className="absolute top-6 left-6">
              <div 
                className={cn(
                  "bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 border transition-all",
                  isSyncingVitals ? "border-emerald-500/50 text-emerald-400" : "border-white/10 text-white"
                )}
                onMouseEnter={() => setIsSyncingVitals(true)}
                onMouseLeave={() => setIsSyncingVitals(false)}
              >
                <Activity className={cn("h-4 w-4", isSyncingVitals ? "animate-pulse" : "")} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {isSyncingVitals ? 'Syncing Live Vitals...' : 'Vitals Synced'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 px-6 py-4 bg-black/60 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:bottom-10 z-50">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                  isMuted ? "bg-red-500 text-white shadow-lg shadow-red-500/30" : "bg-white/10 text-white hover:bg-white/20 hover:scale-105")}
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>
              
              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                  isVideoOff ? "bg-red-500 text-white shadow-lg shadow-red-500/30" : "bg-white/10 text-white hover:bg-white/20 hover:scale-105")}
              >
                {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
              </button>

              <button 
                onClick={() => navigate('/doctor/queue')}
                className="h-14 w-24 bg-red-600 hover:bg-red-700 text-white rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl shadow-red-600/40 hover:scale-105"
              >
                <Zap className="h-7 w-7" />
              </button>

              <Link to={`/doctor/messages?userId=${order.user_id}`}>
                <button className="h-14 w-14 bg-white/10 text-white hover:bg-white/20 hover:scale-105 rounded-2xl flex items-center justify-center transition-all duration-300">
                  <MessageSquare className="h-6 w-6" />
                </button>
              </Link>
            </div>
          </div>

          {/* AI Scribe */}
          <Card className="h-44 border border-emerald-100 bg-emerald-50/50 shadow-sm overflow-hidden shrink-0 rounded-[1.5rem]">
            <CardContent className="p-5 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-emerald-100/50">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                  <Bot className="h-4 w-4" /> AI Scribe Active
                </span>
              </div>
              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-2">
                {transcript.length === 0 ? (
                   <div className="flex items-center justify-center h-full gap-3 text-emerald-600/60">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p className="text-sm font-semibold">Listening and securely transcribing...</p>
                   </div>
                ) : (
                  transcript.map((line, idx) => (
                    <div key={idx} className="flex gap-3 text-sm animate-in slide-in-from-left-1 duration-300">
                      <span className="text-emerald-400 font-mono text-xs mt-0.5 shrink-0">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>
                      <span className="text-emerald-900 font-medium">{line}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: SOAP Notes & e-Rx */}
        <div className="w-[420px] flex flex-col gap-6 overflow-hidden shrink-0">
          
          <Card className="flex-1 overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col rounded-[1.5rem]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <FileSignature className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-[#0A2E1F] uppercase tracking-wider text-sm">Clinical Notes</h3>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold uppercase tracking-widest shadow-sm">AI ASSISTED</Badge>
            </div>
            <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar">
              <div className="p-6 space-y-6">
                {(['subjective', 'objective', 'assessment', 'plan'] as const).map(field => (
                  <div key={field}>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {field}
                    </p>
                    <textarea
                      value={soapNotes[field]}
                      onChange={e => setSoapNotes({ ...soapNotes, [field]: e.target.value })}
                      className={cn(
                        "w-full text-sm font-medium leading-relaxed border p-4 rounded-xl resize-none transition-all outline-none",
                        field === 'assessment'
                          ? "bg-emerald-50/30 border-emerald-200 text-[#0A2E1F] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 h-24"
                          : "bg-slate-50 border-slate-200 text-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:bg-white h-24"
                      )}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* E-Prescribing */}
          <Card className="border border-emerald-200 bg-white shadow-md overflow-hidden shrink-0 rounded-[1.5rem]">
            <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2.5">
              <Pill className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-emerald-900 uppercase tracking-wider text-sm">E-Prescribing</h3>
            </div>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Medication</p>
                  <input 
                    value={medication}
                    onChange={(e) => setMedication(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-[#0A2E1F] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Instructions</p>
                  <textarea 
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-[#0A2E1F] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all h-20 resize-none"
                    placeholder="e.g. Inject three units weekly"
                  />
                </div>
              </div>
              
              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleFinalize}
                  disabled={isFinalizing || isRequestingVideo || isDisqualifying}
                  className="w-full rounded-xl bg-[#0A2E1F] hover:bg-[#153e2d] text-white h-12 font-bold uppercase text-xs tracking-widest shadow-lg shadow-emerald-900/20"
                >
                  {isFinalizing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Sign & Dispatch to Pharmacy
                </Button>

                <Button
                  variant="outline"
                  onClick={handleRequestVideoCall}
                  disabled={isFinalizing || isRequestingVideo || isDisqualifying}
                  className="w-full rounded-xl border-slate-200 text-slate-700 h-12 font-bold uppercase text-xs tracking-widest hover:bg-slate-50 hover:text-[#0A2E1F] transition-all gap-2"
                >
                  {isRequestingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                  Request Video Visit
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleDisqualify}
                  disabled={isFinalizing || isRequestingVideo || isDisqualifying}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 h-10 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all"
                >
                  {isDisqualifying ? "Processing..." : "Disqualify & Refund"}
                </Button>
              </div>
              <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4">
                Routing to: <span className="text-emerald-600">{order.pharmacy || "Network Pharmacy"}</span>
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

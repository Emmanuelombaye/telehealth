import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { 
  ArrowLeft, Video, Mic, MicOff, VideoOff, MessageSquare, 
  Pill, Zap, ShieldCheck, Activity, Users, 
  Sparkles, CheckCircle2, MoreHorizontal, Loader2
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { useAuthStore } from "../../../../lib";
import { supabase } from "../../../../lib/supabaseClient";

export function DoctorConsultPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const navigate = useNavigate();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScribeActive, setIsScribeActive] = useState(true);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const [soapNotes, setSoapNotes] = useState({
    subjective: "Loading...",
    objective: "Loading...",
    assessment: "Loading...",
    plan: "Loading..."
  });

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    async function fetchOrder() {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderId)
        .single();
      if (!error && data) {
        setOrder(data);
        
        // Dynamically build professional SOAP notes from patient data
        const vitals = data.patient_vitals ? JSON.stringify(data.patient_vitals) : 'No recent vitals reported.';
        
        setSoapNotes({ 
          subjective: data.intake_notes || `Patient seeking consultation for ${data.category || 'general condition'}.`,
          objective: `Age: ${data.patient_age || 'N/A'}. Gender: ${data.patient_sex || 'Not specified'}. Vitals: ${vitals}. Intake Complete: ${data.intake_complete ? 'Yes' : 'No'}.`,
          assessment: `Patient requesting evaluation for ${data.medication || 'treatment'}.`,
          plan: `Prescribe ${data.medication || 'medication'} ${data.dosage_instructions ? `(${data.dosage_instructions})` : 'as directed'}.`
        });
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
      const doctorName = currentUser?.user_metadata?.first_name ? `Dr. ${currentUser.user_metadata.first_name} ${currentUser.user_metadata.last_name}` : "Attending Physician";

      // 1. Create Visit Summary
      let summaryError = null;
      try {
        const { error } = await supabase.from('visit_summaries').insert([{
          patient_id: order.user_id,
          doctor_name: doctorName,
          specialty: order.category,
          diagnosis: soapNotes.assessment,
          type: 'video',
          date: new Date().toISOString(),
        }]);
        summaryError = error;
      } catch (e) {
        console.warn("Visit summaries table may not exist yet", e);
      }

      // 2. Create Prescription
      const { error: rxError } = await supabase.from('prescriptions').insert([{
        patient_id: order.user_id,
        medication: order.medication,
        dosage: order.dosage_instructions || "As directed",
        frequency: soapNotes.plan,
        status: 'active',
        refills_remaining: 3,
        doctor_id: currentUser?.id,
      }]);

      // 3. Update Order Status
      const newTimeline = order.timeline 
        ? [...order.timeline, { status: 'rx_sent', date: new Date().toLocaleString() }] 
        : [{ status: 'rx_sent', date: new Date().toLocaleString() }];

      const { error: orderError } = await supabase.from('orders').update({
        status: 'rx_sent',
        doctor: doctorName,
        last_approved_at: new Date().toISOString(),
        timeline: newTimeline
      }).eq('id', order.id);

      if (!rxError && !orderError) {
        navigate('/doctor/queue');
      } else {
        console.error("Rx Error:", rxError);
        console.error("Order Error:", orderError);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFinalizing(false);
    }
  };

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!order) return <div className="p-20 text-center font-bold">Patient record not found. Please select a patient from the queue.</div>;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4 overflow-hidden -mt-2">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <Link to="/doctor/queue" className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-black text-[#0A0D14]">{order.patient_name || 'Patient Details'}</h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Consultation #{order.order_number} · {order.category}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-100 gap-1.5 py-1 text-[10px] font-black">
            <ShieldCheck className="h-3 w-3" /> HIPAA SECURE
          </Badge>
          <div className="h-8 w-[1px] bg-slate-200 mx-2" />
          {order.zoom_status === 'confirmed' && (
             <Button variant="outline" size="sm" className="rounded-xl h-9 text-xs font-bold"
               onClick={() => window.open(order.zoom_join_url || 'https://zoom.us', '_blank')}>
               <Video className="h-3.5 w-3.5 mr-2" /> Join Zoom Call
             </Button>
          )}
          <Button variant="outline" size="sm" className="rounded-xl h-9 text-xs font-bold">
            <Users className="h-3.5 w-3.5 mr-2" /> Patient History
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left Column: Video & Controls */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 bg-slate-900 rounded-[32px] relative overflow-hidden group shadow-2xl flex items-center justify-center">
            {/* If no active video, show a professional placeholder */}
            <div className="text-center">
               <div className="h-24 w-24 rounded-full bg-slate-800 border-4 border-slate-700 mx-auto flex items-center justify-center mb-4">
                  <span className="text-3xl font-black text-slate-500">{order.patient_name?.charAt(0) || '?'}</span>
               </div>
               <p className="text-white font-bold">{order.patient_name}</p>
               <p className="text-slate-400 text-sm">Secure Connection Ready</p>
            </div>
            
            <div className="absolute top-6 left-6 space-y-2">
              <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  {order.patient_vitals ? 'Vitals Synced' : 'Vitals Pending'}
                </span>
              </div>
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl transition-all duration-300 group-hover:bottom-10">
              <button onClick={() => setIsMuted(!isMuted)} className={cn("h-12 w-12 rounded-full flex items-center justify-center transition-all", isMuted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20")}>
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              <button onClick={() => setIsVideoOff(!isVideoOff)} className={cn("h-12 w-12 rounded-full flex items-center justify-center transition-all", isVideoOff ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20")}>
                {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </button>
              <button className="h-14 w-20 bg-red-600 hover:bg-red-700 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-red-600/40">
                <Zap className="h-6 w-6 fill-current rotate-12" />
              </button>
              <Link to={`/doctor/messages?userId=${order.user_id}`}>
                <button className="h-12 w-12 bg-white/10 text-white hover:bg-white/20 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-5 w-5" />
                </button>
              </Link>
              <button className="h-12 w-12 bg-white/10 text-white hover:bg-white/20 rounded-full flex items-center justify-center">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>
          <Card className="h-40 border-none bg-emerald-50/50 dark:bg-emerald-950/20 overflow-hidden shrink-0">
            <CardContent className="p-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">AI Scribe Live Transcription</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                <p className="text-xs text-slate-400 italic">Listening to conversation and securely transcribing clinical notes...</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-[380px] flex flex-col gap-4 overflow-hidden shrink-0">
          <Card className="flex-1 overflow-hidden border-slate-200 shadow-xl flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-black text-xs uppercase tracking-widest">Clinical Documentation</h3>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-black uppercase tracking-tight">AI ASSISTED</Badge>
            </div>
            <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar">
              <div className="p-4 space-y-6">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">Subjective</p>
                   <textarea value={soapNotes.subjective} onChange={e => setSoapNotes({...soapNotes, subjective: e.target.value})} className="w-full text-xs font-medium leading-relaxed bg-white border border-slate-100 p-3 rounded-xl shadow-sm italic text-slate-600 resize-none h-24" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Objective</p>
                   <textarea value={soapNotes.objective} onChange={e => setSoapNotes({...soapNotes, objective: e.target.value})} className="w-full text-xs font-medium leading-relaxed bg-white border border-slate-100 p-3 rounded-xl shadow-sm text-slate-700 resize-none h-20" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assessment</p>
                   <textarea value={soapNotes.assessment} onChange={e => setSoapNotes({...soapNotes, assessment: e.target.value})} className="w-full text-xs font-bold text-primary bg-primary/5 border border-primary/20 p-3 rounded-xl resize-none h-20" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Plan</p>
                   <textarea value={soapNotes.plan} onChange={e => setSoapNotes({...soapNotes, plan: e.target.value})} className="w-full text-xs font-medium leading-relaxed bg-white border border-slate-100 p-3 rounded-xl shadow-sm text-slate-700 resize-none h-20" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 shadow-xl overflow-hidden bg-emerald-50/20 shrink-0">
            <div className="p-4 bg-emerald-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4" />
                <h3 className="font-black text-xs uppercase tracking-widest">E-Prescribing</h3>
              </div>
            </div>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-3">
                <div className="p-3 bg-white border border-emerald-100 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-sm font-black text-[#0A0D14]">{order.medication}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{order.dosage_instructions}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
              <Button onClick={handleFinalize} disabled={isFinalizing} className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 h-11 font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-600/20">
                {isFinalizing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Finalize & Send to Pharmacy
              </Button>
              <p className="text-center text-[9px] font-black text-emerald-700/60 uppercase tracking-widest">
                Sent to: {order.pharmacy || "Patient's Preferred Network Pharmacy"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { 
  ArrowLeft, Video, Mic, MicOff, VideoOff, MessageSquare, 
  Pill, Zap, ShieldCheck, Activity, Users, 
  Sparkles, CheckCircle2, MoreHorizontal, Loader2
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
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
    subjective: "Patient reports increasing difficulty with weight management despite diet. Energy levels are down.",
    objective: "BMI 31.4. No acute distress. BP 122/80.",
    assessment: "Class 1 Obesity. Candidate for GLP-1 therapy.",
    plan: "Start Semaglutide 0.25mg weekly for 4 weeks. Follow-up in 30 days."
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
        if (data.intake_notes) {
          setSoapNotes(prev => ({ ...prev, subjective: data.intake_notes }));
        }
      }
      setLoading(false);
    }
    fetchOrder();
  }, [orderId]);

  const handleFinalize = async () => {
    if (!order || isFinalizing) return;
    setIsFinalizing(true);
    try {
      // 1. Create Visit Summary
      const { error: summaryError } = await supabase.from('visit_summaries').insert([{
        patient_id: order.user_id,
        doctor_name: "Dr. Alex Rivera",
        specialty: order.category,
        diagnosis: soapNotes.assessment,
        type: 'video',
        date: new Date().toISOString(),
      }]);

      // 2. Create Prescription
      const { error: rxError } = await supabase.from('prescriptions').insert([{
        patient_id: order.user_id,
        medication_name: order.medication,
        dosage: order.dosage_instructions || "As directed",
        instructions: soapNotes.plan,
        status: 'active',
        refills_remaining: 3,
        prescribing_doctor: "Dr. Alex Rivera",
        last_filled: new Date().toISOString(),
      }]);

      // 3. Update Order Status
      const newTimeline = order.timeline 
        ? [...order.timeline, { status: 'rx_sent', date: new Date().toLocaleString() }] 
        : [{ status: 'rx_sent', date: new Date().toLocaleString() }];

      const { error: orderError } = await supabase.from('orders').update({
        status: 'rx_sent',
        doctor_name: "Dr. Alex Rivera",
        review_date: new Date().toISOString(),
        timeline: newTimeline
      }).eq('id', order.id);

      if (!summaryError && !rxError && !orderError) {
        navigate('/doctor/queue');
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
            <h1 className="text-lg font-black text-[#0A0D14]">{order.patient_name}</h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ongoing Consultation · {order.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-100 gap-1.5 py-1 text-[10px] font-black">
            <ShieldCheck className="h-3 w-3" /> HIPAA SECURE
          </Badge>
          <div className="h-8 w-[1px] bg-slate-200 mx-2" />
          <Button variant="outline" size="sm" className="rounded-xl h-9 text-xs font-bold"
            onClick={() => window.open('https://zoom.us/j/5551234567', '_blank')}>
            <Video className="h-3.5 w-3.5 mr-2" /> Open in Zoom
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl h-9 text-xs font-bold">
            <Users className="h-3.5 w-3.5 mr-2" /> Invite Specialist
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left Column: Video & Controls */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 bg-slate-900 rounded-[32px] relative overflow-hidden group shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80" 
              alt="Patient" 
              className={cn("w-full h-full object-cover transition-opacity duration-500", isVideoOff ? "opacity-30" : "opacity-100")}
            />
            <div className="absolute top-6 right-6 w-48 h-32 bg-slate-800 rounded-2xl border-2 border-white/20 overflow-hidden shadow-xl">
               <img 
                src="https://images.unsplash.com/photo-1559839734-2b71f15367ef?auto=format&fit=crop&w=800&q=80" 
                alt="Doctor" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute top-6 left-6 space-y-2">
              <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">HR: 72 BPM</span>
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
              <button className="h-12 w-12 bg-white/10 text-white hover:bg-white/20 rounded-full flex items-center justify-center">
                <MessageSquare className="h-5 w-5" />
              </button>
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
                <p className="text-xs text-slate-400 italic">Listening to conversation...</p>
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
              <p className="text-center text-[9px] font-black text-emerald-700/60 uppercase tracking-widest">Sent to: VialsRX Pharmacy (California)</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

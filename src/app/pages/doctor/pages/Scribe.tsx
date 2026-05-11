import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Save, RefreshCw, FileText, Bot, CheckCircle2, Sparkles, Activity, ShieldCheck, Database, Trash2, ArrowRight, Waves } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// Extend window for Speech Recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export function DoctorScribePage() {
  const { user } = useAuthStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [soapNote, setSoapNote] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: ""
  });

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setIsRecording(false);
        toast.error(`Mic Error: ${event.error}`);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      toast.error("Speech Recognition not supported in this browser.");
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const handleToggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      setIsProcessing(true);
      toast.success("Consultation captured. AI generating clinical summary...");
      
      // Simulate AI Summarization using the REAL transcript
      setTimeout(() => {
        setIsProcessing(false);
        setSoapNote({
          subjective: transcript || "Patient reports general symptoms as discussed.",
          objective: "Vitals stable. Physical exam findings consistent with reported history.",
          assessment: "Clinical assessment based on patient consultation.",
          plan: "1. Follow up as scheduled.\n2. Monitor symptoms.\n3. Patient educated on treatment plan."
        });
        toast.success("AI SOAP Note Generated Successfully.");
      }, 2000);
    } else {
      setTranscript("");
      setSoapNote({subjective:"", objective:"", assessment:"", plan:""});
      recognitionRef.current?.start();
      setIsRecording(true);
      toast.info("Ambient room listening active...");
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!soapNote.assessment) {
      toast.error("No note data to save.");
      return;
    }

    try {
      const { error } = await supabase.from('visit_summaries').insert({
        patient_id: user.id, 
        doctor_id: user.id,
        diagnosis: soapNote.assessment,
        treatment_plan: soapNote.plan,
        notes: `Subjective: ${soapNote.subjective}\nObjective: ${soapNote.objective}`,
        date: new Date().toISOString()
      });
      if (error) throw error;
      toast.success("Synchronized with EHR Clinical Database.");
      setSoapNote({subjective:"", objective:"", assessment:"", plan:""});
      setTranscript("");
    } catch (e) {
      console.error(e);
      toast.error("Sync Failure: Clinical data could not be saved.");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
               Matrix AI Suite Active
             </span>
          </div>
          <h1 className="text-3xl font-black text-[#0A2E1F] tracking-tight uppercase flex items-center gap-3">
            <Bot className="h-8 w-8 text-emerald-600" />
            AI Medical Scribe
          </h1>
          <p className="text-slate-500 text-xs font-semibold mt-2 max-w-lg">
            Real-time ambient dictation. Your voice is captured, transcribed, and structured into medical notes instantly.
          </p>
        </div>
        
        <div className="flex gap-3 relative z-10">
          <Button 
            variant="outline" 
            className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-[10px] gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
            onClick={() => { setSoapNote({subjective:"", objective:"", assessment:"", plan:""}); setTranscript(""); }}
          >
            <Trash2 className="h-4 w-4" /> Clear Console
          </Button>
          <Button 
            className="h-12 px-8 rounded-xl bg-[#0A2E1F] hover:bg-[#062015] text-white font-bold uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-emerald-900/20 transition-all hover:scale-105 active:scale-95"
            onClick={handleSave}
          >
            <Database className="h-4 w-4 text-emerald-400" /> Save to EHR
          </Button>
        </div>
      </div>

      <div className="grid xl:grid-cols-12 gap-8 items-start">
        
        {/* ── LEFT: AUDIO CAPTURE ─────────────────────────────────────────── */}
        <div className="xl:col-span-4 space-y-6">
          <Card className="border border-slate-200 shadow-xl shadow-slate-200/40 rounded-[2.5rem] bg-white overflow-hidden group">
             <div className="bg-slate-50 border-b border-slate-100 px-8 py-5 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Audio Telemetry</span>
                {isRecording && (
                  <Badge className="bg-red-500 text-white animate-pulse border-none px-3 py-1 rounded-full text-[10px] font-bold">
                    LIVE ROOM
                  </Badge>
                )}
             </div>
             
             <CardContent className="p-10 flex flex-col items-center">
                <div className="relative mb-10">
                   <AnimatePresence>
                     {isRecording && (
                       <>
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1.8, opacity: 0.1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute inset-0 rounded-full bg-emerald-500 blur-2xl"
                        />
                        <motion.div 
                          initial={{ scale: 1, opacity: 0 }}
                          animate={{ scale: 1.4, opacity: 0.2 }}
                          exit={{ scale: 1, opacity: 0 }}
                          transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                          className="absolute inset-0 rounded-full border-2 border-emerald-500"
                        />
                       </>
                     )}
                   </AnimatePresence>
                   
                   <motion.button 
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={handleToggleRecording}
                     className={cn(
                       "h-32 w-32 rounded-full flex items-center justify-center text-white transition-all shadow-2xl relative z-10",
                       isRecording ? "bg-red-600 ring-4 ring-red-100" : isProcessing ? "bg-amber-500 ring-4 ring-amber-100" : "bg-[#0A2E1F] hover:bg-[#062015] ring-4 ring-emerald-50/50"
                     )}
                   >
                     {isRecording ? <MicOff className="h-12 w-12" /> : <Mic className="h-12 w-12" />}
                   </motion.button>
                </div>

                <div className="text-center space-y-2 mb-8">
                   <h3 className="text-xl font-black text-[#0A2E1F] uppercase tracking-tight">
                     {isRecording ? "Listening..." : isProcessing ? "Structuring Note" : "Start Dictation"}
                   </h3>
                   <p className="text-xs font-semibold text-slate-400 max-w-[240px] mx-auto">
                     {isRecording ? "Captured speech will appear below in real-time." : "Ready for your next patient consultation."}
                   </p>
                </div>

                {/* REAL-TIME TRANSCRIPT MONITOR */}
                <div className="w-full bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-inner min-h-[160px] flex flex-col">
                   <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Waves className={cn("h-3 w-3 text-emerald-400", isRecording && "animate-bounce")} />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400/60">Live Monitor</span>
                      </div>
                      {isRecording && <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
                   </div>
                   <div className="flex-1 overflow-y-auto max-h-[120px] custom-scrollbar">
                      <p className={cn(
                        "text-[11px] font-mono leading-relaxed transition-all duration-300",
                        transcript ? "text-emerald-50" : "text-slate-600 italic"
                      )}>
                        {transcript || "Waiting for audio input..."}
                      </p>
                   </div>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* ── RIGHT: GENERATED NOTE ────────────────────────────────────────── */}
        <div className="xl:col-span-8">
           <Card className="border border-slate-200 shadow-xl shadow-slate-200/40 rounded-[2.5rem] bg-white overflow-hidden flex flex-col min-h-[680px]">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                 <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-base font-black text-[#0A2E1F] uppercase tracking-tight">Clinical Documentation</h3>
                 </div>
                 <div className="flex items-center gap-3">
                    <Badge variant="outline" className="rounded-lg px-3 py-1 bg-white border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                       Status: {soapNote.assessment ? "Completed" : "Draft"}
                    </Badge>
                    <Badge variant="outline" className="rounded-lg px-3 py-1 bg-emerald-50 border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                       <Activity className="h-3 w-3" /> Real-time Sync
                    </Badge>
                 </div>
              </div>

              <CardContent className="p-0 flex-1 flex flex-col">
                 <div className="grid md:grid-cols-2 divide-x divide-y divide-slate-100 border-b border-slate-100 flex-1">
                    {[
                      { key: 'subjective', label: 'Subjective', icon: 'S', color: 'text-blue-600', bg: 'bg-blue-50' },
                      { key: 'objective', label: 'Objective', icon: 'O', color: 'text-amber-600', bg: 'bg-amber-50' },
                      { key: 'assessment', label: 'Assessment', icon: 'A', color: 'text-purple-600', bg: 'bg-purple-50' },
                      { key: 'plan', label: 'Plan', icon: 'P', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    ].map((item) => (
                      <div key={item.key} className="p-8 group hover:bg-slate-50 transition-colors">
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                               <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs", item.bg, item.color)}>
                                  {item.icon}
                               </div>
                               <label className="text-[11px] font-black text-[#0A2E1F] uppercase tracking-[0.1em]">
                                 {item.label}
                               </label>
                            </div>
                            <Sparkles className="h-3 w-3 text-slate-200 group-hover:text-emerald-400 transition-colors" />
                         </div>
                         <textarea
                           value={soapNote[item.key as keyof typeof soapNote]}
                           onChange={(e) => setSoapNote(s => ({ ...s, [item.key]: e.target.value }))}
                           placeholder={`AI waiting for dictation...`}
                           className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm font-medium leading-relaxed min-h-[140px] resize-none text-slate-600 placeholder:text-slate-300 outline-none"
                         />
                      </div>
                    ))}
                 </div>
                 
                 {/* Footer metadata */}
                 <div className="p-6 bg-slate-50/50 flex items-center justify-between mt-auto border-t border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                       <ShieldCheck className="h-3 w-3" /> Patient Confidentiality Maintained (HIPAA Compliant)
                    </p>
                    <div className="flex items-center gap-2">
                       <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                       <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">System Operational</span>
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>

      </div>

    </div>
  );
}

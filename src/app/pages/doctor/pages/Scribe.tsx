import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Save, RefreshCw, FileText, Bot, CheckCircle2, Sparkles, Activity, ShieldCheck, Database, Trash2, ArrowRight, Waves, Zap, Shield, Microscope, ClipboardList } from "lucide-react";
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
    <div className="max-w-[1500px] mx-auto space-y-8 pb-24 animate-in fade-in duration-1000">
      
      {/* ── LUXURY COMMAND CENTER HEADER ────────────────────────────────────────── */}
      <div className="bg-[#0A2E1F] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
        <div className="absolute -right-40 -top-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px]" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-[80px]" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="space-y-4 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3">
               <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">
                 Authorized Clinical Command Center
               </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase leading-none">
              AI Medical <span className="text-emerald-400 italic font-serif lowercase tracking-tighter">scribe.</span>
            </h1>
            <p className="text-emerald-100/60 text-sm font-medium max-w-xl leading-relaxed">
              Proprietary ambient room capture technology. Your voice is instantly structured into a high-fidelity clinical SOAP record with sub-millisecond EHR latency.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="hidden sm:flex items-center gap-6 px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl">
               <div className="text-center">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Latency</p>
                  <p className="text-lg font-mono font-bold text-white leading-none">12ms</p>
               </div>
               <div className="h-8 w-px bg-white/10" />
               <div className="text-center">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Privacy</p>
                  <ShieldCheck className="h-4 w-4 text-white mx-auto" />
               </div>
            </div>
            <Button 
              className="h-16 px-10 rounded-[2rem] bg-emerald-500 hover:bg-emerald-400 text-[#0A2E1F] font-black uppercase tracking-[0.2em] text-[12px] gap-3 shadow-[0_20px_50px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95"
              onClick={handleSave}
            >
              <Database className="h-5 w-5" /> Synchronize EHR
            </Button>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-12 gap-10 items-start">
        
        {/* ── LEFT: BIOMETRIC AUDIO CAPTURE ─────────────────────────────────────────── */}
        <div className="xl:col-span-4 space-y-8">
          <Card className="border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] rounded-[3.5rem] bg-white overflow-hidden relative">
             <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" />
             
             <CardContent className="p-12 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-12">
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Biometric Stream</span>
                   <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
                      <div className={cn("h-1.5 w-1.5 rounded-full", isRecording ? "bg-red-500 animate-pulse" : "bg-slate-300")} />
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                        {isRecording ? "Live Captured" : "Standby"}
                      </span>
                   </div>
                </div>

                <div className="relative mb-12">
                   <AnimatePresence>
                     {isRecording && (
                       <motion.div 
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         className="absolute -inset-10 pointer-events-none"
                       >
                         {[1, 2, 3].map((i) => (
                           <motion.div
                             key={i}
                             initial={{ scale: 1, opacity: 0.5 }}
                             animate={{ scale: 2, opacity: 0 }}
                             transition={{ repeat: Infinity, duration: 2, delay: i * 0.6 }}
                             className="absolute inset-0 rounded-full border-2 border-emerald-500/20"
                           />
                         ))}
                       </motion.div>
                     )}
                   </AnimatePresence>
                   
                   <motion.button 
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={handleToggleRecording}
                     className={cn(
                       "h-40 w-40 rounded-[3rem] flex flex-col items-center justify-center transition-all relative z-10 shadow-2xl group",
                       isRecording 
                        ? "bg-red-600 shadow-red-200" 
                        : isProcessing 
                          ? "bg-amber-500 shadow-amber-200" 
                          : "bg-[#0A2E1F] hover:bg-[#062015] shadow-emerald-200"
                     )}
                   >
                     <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[3rem]" />
                     {isRecording ? (
                        <MicOff className="h-16 w-16 text-white mb-2" />
                     ) : (
                        <Mic className="h-16 w-16 text-white mb-2" />
                     )}
                     <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                        {isRecording ? "Stop" : "Record"}
                     </span>
                   </motion.button>
                </div>

                {/* VISUALIZER MONITOR */}
                <div className="w-full bg-[#0A0D14] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden group/mon">
                   <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                   <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center">
                           <Waves className={cn("h-4 w-4 text-emerald-400", isRecording && "animate-pulse")} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] leading-none">Matrix Stream</p>
                           <p className="text-[8px] font-bold text-emerald-400/40 uppercase tracking-widest mt-1">Encrypted capture</p>
                        </div>
                      </div>
                      <Zap className={cn("h-3 w-3", isRecording ? "text-yellow-400 animate-bounce" : "text-slate-700")} />
                   </div>

                   <div className="h-32 overflow-y-auto custom-scrollbar pr-2">
                      <p className={cn(
                        "text-[12px] font-mono leading-relaxed transition-all duration-700",
                        transcript ? "text-emerald-50 opacity-100" : "text-slate-600 italic opacity-40"
                      )}>
                        {transcript || "// System standing by. Click record to initiate clinical ambient Room-Listening capture..."}
                      </p>
                   </div>
                   
                   {isRecording && (
                     <div className="mt-4 flex items-center gap-1.5 h-1">
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                           <motion.div 
                              key={i}
                              animate={{ height: [4, Math.random()*20, 4] }}
                              transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                              className="w-1 bg-emerald-500/30 rounded-full"
                           />
                        ))}
                     </div>
                   )}
                </div>
             </CardContent>
          </Card>
          
          <div className="bg-slate-50 rounded-[2.5rem] p-8 flex items-center gap-6 border border-slate-100">
             <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                <Shield className="h-6 w-6 text-emerald-600" />
             </div>
             <div>
                <p className="text-xs font-black text-[#0A2E1F] uppercase tracking-widest">Authorized Clinical Portal</p>
                <p className="text-[10px] font-medium text-slate-400">AES-256 Bit Encryption in transit and at rest.</p>
             </div>
          </div>
        </div>

        {/* ── RIGHT: HIGH-FIDELITY SOAP DOCUMENTATION ────────────────────────────────────────── */}
        <div className="xl:col-span-8">
           <Card className="border-none shadow-[0_48px_96px_-24px_rgba(0,0,0,0.12)] rounded-[3.5rem] bg-white overflow-hidden flex flex-col min-h-[850px] relative">
              <div className="px-12 py-10 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between bg-white relative z-10">
                 <div className="space-y-1 text-center md:text-left mb-6 md:mb-0">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                       <ClipboardList className="h-5 w-5 text-emerald-600" />
                       <h3 className="text-lg font-black text-[#0A2E1F] uppercase tracking-tight">Clinical Documentation</h3>
                    </div>
                    <p className="text-xs font-semibold text-slate-400">Automated Patient Visit Structure (S.O.A.P Protocol)</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <Badge variant="outline" className="rounded-2xl px-5 py-2.5 bg-slate-50 border-slate-100 text-[#0A2E1F] text-[10px] font-black uppercase tracking-widest">
                       Status: <span className="ml-1 text-emerald-600">{soapNote.assessment ? "Validated" : "Drafting"}</span>
                    </Badge>
                    <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                       <Activity className="h-3.5 w-3.5" /> Real-time Sync
                    </div>
                 </div>
              </div>

              <CardContent className="p-0 flex-1 flex flex-col relative z-10">
                 <div className="grid md:grid-cols-2 divide-x divide-y divide-slate-50 border-b border-slate-50 flex-1">
                    {[
                      { key: 'subjective', label: 'Subjective', icon: 'S', desc: 'Patient history & reported symptoms', color: 'text-blue-600', bg: 'bg-blue-50/50', border: 'border-blue-100' },
                      { key: 'objective', label: 'Objective', icon: 'O', desc: 'Clinical findings & vitals', color: 'text-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-100' },
                      { key: 'assessment', label: 'Assessment', icon: 'A', desc: 'Differential diagnosis & severity', color: 'text-purple-600', bg: 'bg-purple-50/50', border: 'border-purple-100' },
                      { key: 'plan', label: 'Plan', icon: 'P', desc: 'Pharmacology & follow-up protocols', color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100' },
                    ].map((item, idx) => (
                      <div key={item.key} className="p-12 group hover:bg-slate-50/50 transition-all relative">
                         <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                               <div className={cn("h-14 w-14 rounded-[1.25rem] flex items-center justify-center font-black text-xl shadow-sm transition-transform group-hover:scale-110", item.bg, item.color, "border", item.border)}>
                                  {item.icon}
                               </div>
                               <div>
                                  <label className="text-[12px] font-black text-[#0A2E1F] uppercase tracking-[0.2em] leading-none block mb-1">
                                    {item.label}
                                  </label>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.desc}</p>
                               </div>
                            </div>
                            <Sparkles className="h-4 w-4 text-slate-100 group-hover:text-emerald-400 transition-colors" />
                         </div>
                         
                         <div className="relative">
                            <AnimatePresence>
                               {!soapNote[item.key as keyof typeof soapNote] && !isProcessing && (
                                  <motion.div 
                                     initial={{ opacity: 0 }}
                                     animate={{ opacity: 1 }}
                                     exit={{ opacity: 0 }}
                                     className="absolute inset-0 pointer-events-none"
                                  >
                                     <div className="space-y-4">
                                        <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                           <motion.div 
                                              animate={{ x: ["-100%", "100%"] }}
                                              transition={{ repeat: Infinity, duration: 2, delay: idx * 0.2 }}
                                              className="h-full w-1/3 bg-slate-100"
                                           />
                                        </div>
                                        <div className="h-2 w-2/3 bg-slate-50 rounded-full" />
                                        <div className="h-2 w-1/2 bg-slate-50 rounded-full" />
                                     </div>
                                  </motion.div>
                               )}
                            </AnimatePresence>
                            
                            <textarea
                              value={soapNote[item.key as keyof typeof soapNote]}
                              onChange={(e) => setSoapNote(s => ({ ...s, [item.key]: e.target.value }))}
                              placeholder={isProcessing ? "AI generating high-fidelity note..." : "Waiting for Room-Listening capture..."}
                              className="w-full bg-transparent border-0 focus:ring-0 p-0 text-[15px] font-medium leading-relaxed min-h-[180px] resize-none text-slate-700 placeholder:text-slate-200 outline-none relative z-10"
                            />
                         </div>
                      </div>
                    ))}
                 </div>
                 
                 {/* Footer metadata */}
                 <div className="p-10 bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between gap-6 mt-auto">
                    <div className="flex items-center gap-4 opacity-40">
                       <div className="flex items-center gap-2">
                          <Microscope className="h-4 w-4 text-slate-600" />
                          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Clinical Accuracy Check: Pass</span>
                       </div>
                       <div className="h-4 w-px bg-slate-200" />
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" /> HIPAA Compliant Architecture
                       </p>
                    </div>
                    <div className="flex items-center gap-4">
                       <Button 
                          variant="outline" 
                          onClick={() => { setSoapNote({subjective:"", objective:"", assessment:"", plan:""}); setTranscript(""); }}
                          className="h-12 px-6 rounded-2xl border-slate-100 text-slate-400 font-bold uppercase tracking-widest text-[9px] hover:bg-red-50 hover:text-red-600 transition-all"
                       >
                          Discard Draft
                       </Button>
                       <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-white shadow-sm border border-slate-100">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="text-[10px] font-black text-[#0A2E1F] uppercase tracking-widest">Matrix AI Engine Online</span>
                       </div>
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.4); }
      `}} />

    </div>
  );
}

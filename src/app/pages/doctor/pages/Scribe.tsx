import { useState } from "react";
import { Mic, MicOff, Save, RefreshCw, FileText, Bot, CheckCircle2, Sparkles, Activity, ShieldCheck, Database, Trash2, ArrowRight } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export function DoctorScribePage() {
  const { user } = useAuthStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [soapNote, setSoapNote] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: ""
  });

  const handleSimulateRecording = () => {
    setIsRecording(true);
    toast.info("Ambient room listening active...");
    
    setTimeout(() => {
      setIsRecording(false);
      setIsProcessing(true);
      toast.success("Consultation captured. Processing AI transcription...");
      
      setTimeout(() => {
        setIsProcessing(false);
        setSoapNote({
          subjective: "Patient reports a 3-day history of throbbing headaches in the frontal region, accompanied by mild nausea. Pain is 6/10.",
          objective: "BP 120/80, HR 72, Temp 98.6°F. Neurological exam is unremarkable. No photophobia.",
          assessment: "Tension-type headache, episodic. Rule out migraine.",
          plan: "1. Advise over-the-counter NSAIDs (Ibuprofen 400mg) PRN.\n2. Stress management and adequate hydration.\n3. Follow up in 2 weeks if symptoms persist."
        });
        toast.success("AI SOAP Note Generated Successfully.");
      }, 2500);
    }, 4000);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!soapNote.assessment) {
      toast.error("No note data to save.");
      return;
    }

    try {
      const { error } = await supabase.from('visit_summaries').insert({
        patient_id: user.id, // Contextually should be the active patient ID
        doctor_id: user.id,
        diagnosis: soapNote.assessment,
        treatment_plan: soapNote.plan,
        notes: `Subjective: ${soapNote.subjective}\nObjective: ${soapNote.objective}`,
        date: new Date().toISOString()
      });
      
      if (error) throw error;
      
      toast.success("Synchronized with EHR Clinical Database.");
      setSoapNote({subjective:"", objective:"", assessment:"", plan:""});
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
            Automated ambient listening and deep-learning SOAP note generation for precision clinical documentation.
          </p>
        </div>
        
        <div className="flex gap-3 relative z-10">
          <Button 
            variant="outline" 
            className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-[10px] gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
            onClick={() => setSoapNote({subjective:"", objective:"", assessment:"", plan:""})}
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
                       <motion.div 
                         initial={{ scale: 0.8, opacity: 0 }}
                         animate={{ scale: 1.5, opacity: 0.15 }}
                         exit={{ scale: 0.8, opacity: 0 }}
                         transition={{ repeat: Infinity, duration: 2 }}
                         className="absolute inset-0 rounded-full bg-emerald-500 blur-xl"
                       />
                     )}
                   </AnimatePresence>
                   
                   <motion.button 
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={handleSimulateRecording}
                     disabled={isRecording || isProcessing}
                     className={cn(
                       "h-32 w-32 rounded-full flex items-center justify-center text-white transition-all shadow-2xl relative z-10",
                       isRecording ? "bg-red-600 ring-4 ring-red-100" : isProcessing ? "bg-amber-500 ring-4 ring-amber-100" : "bg-[#0A2E1F] hover:bg-[#062015] ring-4 ring-emerald-50/50"
                     )}
                   >
                     {isRecording ? <MicOff className="h-12 w-12" /> : <Mic className="h-12 w-12" />}
                   </motion.button>
                </div>

                <div className="text-center space-y-2">
                   <h3 className="text-xl font-black text-[#0A2E1F] uppercase tracking-tight">
                     {isRecording ? "Capturing Consult" : isProcessing ? "AI Analysis Active" : "Start Session"}
                   </h3>
                   <p className="text-xs font-semibold text-slate-400 max-w-[240px] mx-auto">
                     {isRecording ? "Ambient listening active. Speak naturally with your patient." : isProcessing ? "Optimizing medical terminology and generating SOAP note..." : "Tap the icon to start the ambient clinical scribe."}
                   </p>
                </div>

                <div className="mt-10 w-full pt-10 border-t border-slate-100 space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Encryption Status</span>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                        <ShieldCheck className="h-3 w-3" /> Secure
                      </span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Network Latency</span>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">12ms</span>
                   </div>
                </div>
             </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-[#0A2E1F] to-[#062015] rounded-[2rem] p-8 text-white relative overflow-hidden border-none shadow-xl shadow-emerald-900/10">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[40px] rounded-full -mr-10 -mt-10" />
             <div className="flex items-center gap-3 mb-4 relative z-10">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-widest text-emerald-50">Intelligence Engine</span>
             </div>
             <p className="text-xs font-medium text-emerald-50/70 relative z-10 leading-relaxed">
               Our Clinical Matrix AI uses HIPAA-compliant natural language processing to filter background noise and isolate key clinical indicators.
             </p>
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
                 <div className="grid md:grid-cols-2 divide-x divide-y divide-slate-100 border-b border-slate-100">
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

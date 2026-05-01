import { useState } from "react";
import { Mic, MicOff, Save, RefreshCw, FileText, Bot, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../../../components/ui/shared";

export function DoctorScribePage() {
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
    setTimeout(() => {
      setIsRecording(false);
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setSoapNote({
          subjective: "Patient reports a 3-day history of throbbing headaches in the frontal region, accompanied by mild nausea. Pain is 6/10.",
          objective: "BP 120/80, HR 72, Temp 98.6°F. Neurological exam is unremarkable. No photophobia.",
          assessment: "Tension-type headache, episodic. Rule out migraine.",
          plan: "1. Advise over-the-counter NSAIDs (Ibuprofen 400mg) PRN.\n2. Stress management and adequate hydration.\n3. Follow up in 2 weeks if symptoms persist."
        });
      }, 1500);
    }, 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" /> AI Medical Scribe
          </h1>
          <p className="text-sm text-muted-foreground">Automated ambient listening and SOAP note generation.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl"><RefreshCw className="h-4 w-4 mr-2" /> Clear</Button>
          <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700"><Save className="h-4 w-4 mr-2" /> Save to EHR</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Audio Capture</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10 space-y-6">
            <div className="relative">
              {isRecording && <span className="absolute -inset-4 rounded-full bg-red-500/20 animate-ping" />}
              <button 
                onClick={handleSimulateRecording}
                disabled={isRecording || isProcessing}
                className={`h-24 w-24 rounded-full flex items-center justify-center text-white transition-all shadow-lg ${
                  isRecording ? "bg-red-500 scale-110" : isProcessing ? "bg-amber-500" : "bg-primary hover:bg-primary/90"
                }`}
              >
                {isRecording ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
              </button>
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg">
                {isRecording ? "Listening..." : isProcessing ? "AI Generating Notes..." : "Start Dictation"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isRecording ? "Capturing ambient room audio." : "Click microphone to start capturing consult."}
              </p>
            </div>
            {(soapNote.subjective !== "") && (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 mt-4 gap-1">
                <CheckCircle2 className="h-3 w-3" /> Note Generated Successfully
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" /> Generated SOAP Note
            </CardTitle>
            <Badge variant="outline" className="text-xs text-muted-foreground">Draft</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {Object.entries(soapNote).map(([key, value]) => (
                <div key={key} className="p-4 focus-within:bg-muted/30 transition-colors group">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider mb-2 block">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                  <textarea
                    value={value}
                    onChange={(e) => setSoapNote(s => ({ ...s, [key]: e.target.value }))}
                    placeholder={`AI will generate ${key} here...`}
                    className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm resize-none h-20 placeholder:text-muted-foreground/40 outline-none"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

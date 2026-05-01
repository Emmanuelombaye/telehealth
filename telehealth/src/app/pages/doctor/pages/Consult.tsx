import { useState } from "react";
import { Video, FileText, Pill, TestTube, Save, Mic, MicOff, VideoOff, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../../../components/ui/shared";

export function DoctorConsultPage() {
  const [tab, setTab] = useState<"notes" | "rx" | "labs">("notes");
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(true);

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Consultation Workspace</h1>
        <Badge className="bg-emerald-500 text-white text-xs animate-pulse">● Live Session</Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Video panel */}
        <div className="md:col-span-2 space-y-3">
          <Card className="overflow-hidden">
            <div className="bg-slate-900 h-48 md:h-64 flex items-center justify-center relative">
              <div className="text-center text-white/40">
                <Video className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">Patient Video Feed</p>
                <p className="text-xs mt-1">Alice Thompson</p>
              </div>
              <div className="absolute bottom-3 right-3 bg-slate-800 rounded-xl p-2 text-white/60 text-xs">
                <p className="font-bold">Dr. Brandan</p>
              </div>
              <div className="absolute bottom-3 left-3 flex gap-2">
                <button onClick={() => setMuted(m => !m)} className={`h-9 w-9 rounded-full flex items-center justify-center ${muted ? "bg-red-500" : "bg-white/20"}`}>
                  {muted ? <MicOff className="h-4 w-4 text-white" /> : <Mic className="h-4 w-4 text-white" />}
                </button>
                <button onClick={() => setVideoOn(v => !v)} className={`h-9 w-9 rounded-full flex items-center justify-center ${!videoOn ? "bg-red-500" : "bg-white/20"}`}>
                  {videoOn ? <Video className="h-4 w-4 text-white" /> : <VideoOff className="h-4 w-4 text-white" />}
                </button>
                <button className="h-9 w-9 rounded-full bg-red-500 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <div className="flex bg-muted rounded-2xl p-1 gap-1">
            {(["notes", "rx", "labs"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
                {t === "notes" && <><FileText className="h-3.5 w-3.5" /> Notes</>}
                {t === "rx" && <><Pill className="h-3.5 w-3.5" /> Prescribe</>}
                {t === "labs" && <><TestTube className="h-3.5 w-3.5" /> Order Labs</>}
              </button>
            ))}
          </div>

          <Card>
            <CardContent className="p-4">
              {tab === "notes" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Chief Complaint</label>
                    <textarea rows={2} className="w-full mt-1 border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary resize-none" placeholder="Patient's chief complaint..." />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Assessment & Plan</label>
                    <textarea rows={4} className="w-full mt-1 border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary resize-none" placeholder="Clinical assessment and treatment plan..." />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Diagnosis (ICD-10)</label>
                    <input className="w-full mt-1 border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary" placeholder="Search ICD-10 codes..." />
                  </div>
                  <Button className="w-full rounded-xl gap-1.5"><Save className="h-4 w-4" /> Save SOAP Note</Button>
                </div>
              )}
              {tab === "rx" && (
                <div className="space-y-3">
                  <p className="text-sm font-bold">Prescription Builder</p>
                  {["Medication Name", "Dosage", "Frequency", "Duration", "Pharmacy"].map(f => (
                    <input key={f} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary" placeholder={f} />
                  ))}
                  <textarea rows={2} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary resize-none" placeholder="Special instructions..." />
                  <Button className="w-full rounded-xl">Send Prescription</Button>
                </div>
              )}
              {tab === "labs" && (
                <div className="space-y-3">
                  <p className="text-sm font-bold">Order Lab Tests</p>
                  {["Complete Blood Count (CBC)", "Comprehensive Metabolic Panel", "Lipid Panel", "HbA1c", "Thyroid Panel (TSH)", "Urinalysis"].map(test => (
                    <label key={test} className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-accent">
                      <input type="checkbox" className="h-4 w-4 accent-primary" />
                      <span className="text-sm">{test}</span>
                    </label>
                  ))}
                  <Button className="w-full rounded-xl">Send Lab Orders</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Patient sidebar */}
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary">AT</div>
                <div>
                  <p className="font-bold text-sm">Alice Thompson</p>
                  <p className="text-xs text-muted-foreground">Age 34 · Female</p>
                </div>
              </div>
              {[
                { label: "Blood Type", value: "A+" },
                { label: "Allergies", value: "Penicillin" },
                { label: "Conditions", value: "Hypertension" },
                { label: "Last Visit", value: "May 1, 2026" },
              ].map((f, i) => (
                <div key={i} className="py-1.5 border-b border-border/50 last:border-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{f.label}</p>
                  <p className="text-sm font-medium">{f.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Current Medications</p>
              {["Lisinopril 10mg", "Metformin 500mg"].map((m, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5">
                  <Pill className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-sm">{m}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

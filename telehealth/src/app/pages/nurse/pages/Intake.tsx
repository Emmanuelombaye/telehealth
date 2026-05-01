import { FileCheck, Search, ClipboardList, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "../../../components/ui/shared";

export function NurseIntakePage() {
  const intakes = [
    { patient: "Alice Thompson", room: "Room 3", time: "10:05 AM", cc: "Chest tightness, shortness of breath", bp: "148/94", hr: "98", temp: "98.6°F", o2: "96%", pain: "6/10", status: "urgent" },
    { patient: "Robert Wilson", room: "Room 7", time: "10:22 AM", cc: "Follow-up diabetes management", bp: "130/82", hr: "78", temp: "98.2°F", o2: "99%", pain: "1/10", status: "normal" },
    { patient: "Maria Garcia", room: "Room 1", time: "10:45 AM", cc: "Severe headache, dizziness", bp: "162/100", hr: "105", temp: "99.1°F", o2: "97%", pain: "8/10", status: "urgent" },
    { patient: "James Brown", room: "Room 5", time: "11:00 AM", cc: "Routine annual checkup", bp: "120/78", hr: "72", temp: "98.4°F", o2: "100%", pain: "0/10", status: "normal" },
    { patient: "Emily Clark", room: "Room 2", time: "11:15 AM", cc: "Lower back pain after fall", bp: "118/75", hr: "80", temp: "98.8°F", o2: "99%", pain: "5/10", status: "moderate" },
  ];

  const statusConfig: Record<string, { label: string; className: string }> = {
    urgent: { label: "Urgent", className: "bg-red-100 text-red-700" },
    moderate: { label: "Moderate", className: "bg-amber-100 text-amber-700" },
    normal: { label: "Normal", className: "bg-emerald-100 text-emerald-700" },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileCheck className="h-6 w-6 text-pink-500" /> Intake Review</h1>
        <p className="text-sm text-muted-foreground">Review completed intake forms and captured vitals before the doctor sees the patient.</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Urgent Flags", value: "2", color: "text-red-500" },
          { label: "Awaiting Review", value: "5", color: "text-amber-500" },
          { label: "Cleared for Doctor", value: "12", color: "text-emerald-500" },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-5 text-center">
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground font-semibold mt-1">{s.label}</p>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader className="border-b pb-3"><CardTitle>Today's Intake Forms</CardTitle></CardHeader>
        <CardContent className="divide-y divide-border">
          {intakes.map((p, i) => (
            <div key={i} className="py-4 grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3">
                <p className="font-bold text-sm">{p.patient}</p>
                <p className="text-xs text-muted-foreground">{p.room} · {p.time}</p>
                <p className="text-xs text-muted-foreground mt-1 italic">"{p.cc}"</p>
              </div>
              <div className="col-span-6 grid grid-cols-5 gap-2 text-center">
                {[["BP", p.bp], ["HR", p.hr + " bpm"], ["Temp", p.temp], ["O₂", p.o2], ["Pain", p.pain]].map(([label, val]) => (
                  <div key={label} className="bg-muted/50 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">{label}</p>
                    <p className="text-xs font-bold mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
              <div className="col-span-2 text-center">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusConfig[p.status].className}`}>{statusConfig[p.status].label}</span>
              </div>
              <div className="col-span-1">
                <Button variant="outline" size="sm" className="h-7 text-xs w-full">Clear</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

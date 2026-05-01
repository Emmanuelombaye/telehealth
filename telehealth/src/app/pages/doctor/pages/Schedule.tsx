import { Calendar, Clock, Video, ChevronRight, Plus } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared";

const schedule = [
  { time: "09:00 AM", patient: "Alice Thompson", type: "Follow-up", duration: "30 min", status: "confirmed" },
  { time: "09:30 AM", patient: "Robert Wilson", type: "General Consult", duration: "45 min", status: "confirmed" },
  { time: "10:30 AM", patient: "Sarah Miller", type: "Lab Review", duration: "20 min", status: "pending" },
  { time: "11:00 AM", patient: "James Brown", type: "Prescription Renewal", duration: "15 min", status: "confirmed" },
  { time: "02:00 PM", patient: "Maria Garcia", type: "Cardiology Review", duration: "60 min", status: "confirmed" },
  { time: "03:30 PM", patient: "David Lee", type: "New Patient", duration: "45 min", status: "pending" },
];

export function DoctorSchedulePage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Schedule</h1>
        <Button size="sm" className="rounded-full gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Add Slot</Button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["Mon 19", "Tue 20", "Wed 21", "Thu 22", "Fri 23"].map((d, i) => (
          <button key={i} className={cn("flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold transition-all", i === 0 ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent")}>{d}</button>
        ))}
      </div>
      <div className="space-y-2">
        {schedule.map((s, i) => (
          <Card key={i} className={cn("hover:border-primary/40 transition-colors", s.status === "confirmed" && "border-l-4 border-l-primary")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-center shrink-0 w-16">
                  <p className="text-xs font-bold text-primary">{s.time}</p>
                  <p className="text-[10px] text-muted-foreground">{s.duration}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{s.patient}</p>
                  <p className="text-xs text-muted-foreground">{s.type}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={s.status === "confirmed" ? "success" : "secondary"} className="text-[10px]">{s.status}</Badge>
                  <Button size="sm" className="rounded-xl text-xs h-8 gap-1"><Video className="h-3.5 w-3.5" /> Start</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

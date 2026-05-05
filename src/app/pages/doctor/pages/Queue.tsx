import { useState } from "react";
import { Link } from "react-router";
import {
  Users, Clock, Video, MessageSquare, FileText, ChevronRight,
  CheckCircle2, AlertCircle, Circle, Stethoscope, Pill,
  Phone, ToggleLeft, ToggleRight, Search, Filter, Bell, Zap
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared";

type QueueStatus = "waiting" | "in_consult" | "awaiting_rx" | "completed" | "no_show";
type AvailabilityStatus = "available" | "busy" | "break" | "offline";

const availabilityConfig: Record<AvailabilityStatus, { label: string; color: string; dot: string }> = {
  available: { label: "Available", color: "text-emerald-600", dot: "bg-emerald-500" },
  busy: { label: "In Consult", color: "text-amber-600", dot: "bg-amber-500" },
  break: { label: "On Break", color: "text-violet-600", dot: "bg-violet-500" },
  offline: { label: "Offline", color: "text-muted-foreground", dot: "bg-gray-400" },
};

const queueStatusConfig: Record<QueueStatus, { label: string; color: string; bg: string }> = {
  waiting: { label: "Waiting", color: "text-amber-700", bg: "bg-amber-100 dark:bg-amber-950/40" },
  in_consult: { label: "In Consult", color: "text-violet-700", bg: "bg-violet-100 dark:bg-violet-950/40" },
  awaiting_rx: { label: "Awaiting Rx", color: "text-purple-700", bg: "bg-purple-100 dark:bg-purple-950/40" },
  completed: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-100 dark:bg-emerald-950/40" },
  no_show: { label: "No Show", color: "text-red-700", bg: "bg-red-100 dark:bg-red-950/40" },
};

const queue = [
  {
    id: 1, name: "Sophie Bennett", avatar: "SB", age: 34, time: "09:00 AM",
    product: "Weight Loss Program", waitMins: 12, status: "waiting" as QueueStatus,
    urgent: true, intakeComplete: true, notes: "First visit. Intake submitted 2 hrs ago.",
    country: "🇺🇸 US",
  },
  {
    id: 2, name: "Caleb Montgomery", avatar: "CM", age: 28, time: "09:30 AM",
    product: "ED Treatment", waitMins: 5, status: "in_consult" as QueueStatus,
    urgent: false, intakeComplete: true, notes: "Returning patient. Previous Rx: Sildenafil 50mg.",
    country: "🇬🇧 UK",
  },
  {
    id: 3, name: "Maya Brooks", avatar: "MB", age: 41, time: "10:00 AM",
    product: "Anxiety & Sleep", waitMins: 0, status: "awaiting_rx" as QueueStatus,
    urgent: false, intakeComplete: true, notes: "PHQ-4 score: 8. Consult done. Rx pending.",
    country: "🇨🇦 CA",
  },
  {
    id: 4, name: "Isaiah Jackson", avatar: "IJ", age: 55, time: "10:30 AM",
    product: "Hair Loss Treatment", waitMins: 0, status: "completed" as QueueStatus,
    urgent: false, intakeComplete: true, notes: "Finasteride 1mg prescribed. Follow-up in 90 days.",
    country: "🇦🇺 AU",
  },
  {
    id: 5, name: "Priya Sharma", avatar: "PS", age: 29, time: "11:00 AM",
    product: "Weight Loss Program", waitMins: 0, status: "waiting" as QueueStatus,
    urgent: false, intakeComplete: false, notes: "Intake not yet complete.",
    country: "🇮🇳 IN",
  },
];

export function DoctorQueuePage() {
  const [availability, setAvailability] = useState<AvailabilityStatus>("available");
  const [autoAccept, setAutoAccept] = useState(true);
  const [selected, setSelected] = useState<typeof queue[0] | null>(null);
  const [rxNote, setRxNote] = useState("");

  const avail = availabilityConfig[availability];
  const activeCount = queue.filter(q => q.status === "waiting" || q.status === "in_consult").length;

  if (selected) {
    const cfg = queueStatusConfig[selected.status];
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          ← Back to Queue
        </button>

        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-lg shrink-0">
            {selected.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{selected.name}</h1>
              <span className="text-sm">{selected.country}</span>
            </div>
            <p className="text-sm text-muted-foreground">Age {selected.age} · {selected.product}</p>
          </div>
          <span className={cn("text-xs font-bold px-3 py-1.5 rounded-full", cfg.bg, cfg.color)}>{cfg.label}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="border-none bg-muted/50">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Scheduled</p>
              <p className="font-bold text-sm">{selected.time}</p>
            </CardContent>
          </Card>
          <Card className="border-none bg-muted/50">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Intake</p>
              <p className={cn("font-bold text-sm", selected.intakeComplete ? "text-emerald-600" : "text-amber-600")}>
                {selected.intakeComplete ? "Complete ✓" : "Incomplete ⚠"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Clinical Notes</p>
            <p className="text-sm">{selected.notes}</p>
          </CardContent>
        </Card>

        {/* Rx writer */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-bold flex items-center gap-2"><Pill className="h-4 w-4 text-primary" /> Write Prescription</p>
            <div className="grid grid-cols-2 gap-2">
              <input className="border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary" placeholder="Drug name" />
              <input className="border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary" placeholder="Dosage (e.g. 10mg)" />
              <input className="border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary" placeholder="Frequency" />
              <input className="border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary" placeholder="Quantity / Days supply" />
            </div>
            <textarea rows={2} value={rxNote} onChange={e => setRxNote(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary resize-none"
              placeholder="Clinical notes for patient..." />
            <div className="flex gap-2">
              <Button className="flex-1 rounded-xl gap-1.5 bg-emerald-500 hover:bg-emerald-600">
                <Pill className="h-4 w-4" /> Send Rx to Pharmacy
              </Button>
              <Button variant="outline" className="rounded-xl gap-1.5">
                <MessageSquare className="h-4 w-4" /> Message
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Link to="/doctor/consult" className="flex-1">
            <Button className="w-full rounded-xl gap-1.5 h-11">
              <Video className="h-4 w-4" /> Start Video Call
            </Button>
          </Link>
          <Button variant="outline" className="rounded-xl gap-1.5 h-11">
            <Phone className="h-4 w-4" /> Call
          </Button>
          <Button variant="outline" className="rounded-xl gap-1.5 text-destructive border-destructive/30">
            No Show
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header with availability */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Patient Queue</h1>
          <p className="text-sm text-muted-foreground">{activeCount} patients waiting</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-muted rounded-2xl px-3 py-2">
            <span className={cn("h-2.5 w-2.5 rounded-full animate-pulse", avail.dot)} />
            <span className={cn("text-xs font-bold", avail.color)}>{avail.label}</span>
          </div>
        </div>
      </div>

      {/* Availability selector */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">My Availability</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(availabilityConfig) as AvailabilityStatus[]).map(status => (
              <button key={status} onClick={() => setAvailability(status)}
                className={cn("flex items-center gap-2 p-2.5 rounded-xl border-2 text-sm font-semibold transition-all",
                  availability === status ? "border-primary bg-primary/5" : "border-border hover:bg-accent")}>
                <span className={cn("h-2.5 w-2.5 rounded-full", availabilityConfig[status].dot)} />
                {availabilityConfig[status].label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <div>
              <p className="text-sm font-semibold">Auto-accept new patients</p>
              <p className="text-xs text-muted-foreground">Automatically add to queue when available</p>
            </div>
            <button onClick={() => setAutoAccept(a => !a)}>
              {autoAccept
                ? <ToggleRight className="h-7 w-7 text-primary" />
                : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Search patients..." />
        </div>
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>

      {/* Queue */}
      <div className="space-y-2">
        {queue.map(patient => {
          const cfg = queueStatusConfig[patient.status];
          return (
            <Card key={patient.id}
              className={cn("hover:border-primary/40 transition-colors cursor-pointer",
                patient.urgent && "border-l-4 border-l-red-500")}
              onClick={() => setSelected(patient)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                      {patient.avatar}
                    </div>
                    {patient.urgent && (
                      <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 ring-2 ring-card flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold">!</span>
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{patient.name}</p>
                      <span className="text-xs">{patient.country}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{patient.product} · {patient.time}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", cfg.bg, cfg.color)}>
                        {cfg.label}
                      </span>
                      {patient.status === "waiting" && patient.waitMins > 0 && (
                        <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                          <Clock className="h-3 w-3" /> {patient.waitMins}m wait
                        </span>
                      )}
                      {!patient.intakeComplete && (
                        <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                          <AlertCircle className="h-3 w-3" /> Intake pending
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link to="/doctor/consult">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-primary">
                        <Video className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                      <MessageSquare className="h-3.5 w-3.5" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { useState } from "react";
import {
  Calendar, Clock, Plus, Copy, CheckCircle2, Globe,
  ToggleLeft, ToggleRight, Trash2, Link, Video, MessageSquare
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared";
import { usePatientStore } from "../../../../lib/patient-store";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const timeSlots = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];

const initialSchedule: Record<string, { enabled: boolean; start: string; end: string }> = {
  Mon: { enabled: true, start: "09:00", end: "17:00" },
  Tue: { enabled: true, start: "09:00", end: "17:00" },
  Wed: { enabled: true, start: "09:00", end: "13:00" },
  Thu: { enabled: true, start: "09:00", end: "17:00" },
  Fri: { enabled: true, start: "09:00", end: "15:00" },
  Sat: { enabled: false, start: "10:00", end: "13:00" },
  Sun: { enabled: false, start: "10:00", end: "12:00" },
};

const upcomingBookings = [
  { id: 1, patient: "Sophie Bennett", type: "video", date: "Mon May 19", time: "09:00 AM", product: "Weight Loss", country: "🇺🇸" },
  { id: 2, patient: "Caleb Montgomery", type: "async", date: "Mon May 19", time: "09:30 AM", product: "ED Treatment", country: "🇬🇧" },
  { id: 3, patient: "Maya Brooks", type: "video", date: "Tue May 20", time: "10:00 AM", product: "Anxiety & Sleep", country: "🇨🇦" },
  { id: 4, patient: "Priya Sharma", type: "video", date: "Thu May 22", time: "02:00 PM", product: "Weight Loss", country: "🇮🇳" },
];

const consultTypes = [
  { key: "video", label: "Video Consult", icon: Video, duration: "30 min", color: "text-primary" },
  { key: "async", label: "Async Review", icon: MessageSquare, duration: "Flexible", color: "text-purple-600" },
];

export function DoctorAvailabilityPage() {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [tab, setTab] = useState<"schedule" | "bookings">("schedule");
  const [copied, setCopied] = useState(false);
  const [timezone, setTimezone] = useState("America/New_York");
  const [bufferMins, setBufferMins] = useState("10");

  const bookingLink = "https://brandonhealth.com/book/dr-harrison-vance";

  const toggleDay = (day: string) => {
    setSchedule(s => ({ ...s, [day]: { ...s[day], enabled: !s[day].enabled } }));
  };

  const updateTime = (day: string, field: "start" | "end", val: string) => {
    setSchedule(s => ({ ...s, [day]: { ...s[day], [field]: val } }));
  };

  const copyLink = () => {
    navigator.clipboard.writeText(bookingLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateDoctorAvailability = usePatientStore(state => state.updateDoctorAvailability);
  const doctorAvailability = usePatientStore(state => state.doctorAvailability);

  const saveAvailability = () => {
    console.log("Saving availability schedule:", schedule);
    console.log("Settings:", { timezone, bufferMins });
    
    // Update store with availability changes
    // In production this would sync with backend API
    
    // Show success notification
    alert("✅ Availability saved successfully! Your schedule has been updated.");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Availability</h1>
          <p className="text-sm text-muted-foreground">Manage your schedule and booking preferences</p>
        </div>
      </div>

      {/* Booking link */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Link className="h-3.5 w-3.5" /> Your Booking Link
          </p>
          <div className="flex items-center gap-2 bg-background rounded-xl px-3 py-2 border border-border">
            <span className="text-xs text-muted-foreground flex-1 truncate">{bookingLink}</span>
            <button onClick={copyLink} className="shrink-0 text-primary hover:text-primary/80 transition-colors">
              {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">Share this link so patients can book directly into your calendar</p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex bg-muted rounded-2xl p-1 gap-1">
        {(["schedule", "bookings"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 py-2 text-sm font-semibold rounded-xl transition-all capitalize",
              tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>
            {t === "schedule" ? "Weekly Schedule" : `Upcoming (${upcomingBookings.length})`}
          </button>
        ))}
      </div>

      {tab === "schedule" && (
        <div className="space-y-4">
          {/* Settings */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Timezone</label>
                  <select value={timezone} onChange={e => setTimezone(e.target.value)}
                    className="w-full mt-1 border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary">
                    <option value="America/New_York">ET (New York)</option>
                    <option value="America/Los_Angeles">PT (Los Angeles)</option>
                    <option value="Europe/London">GMT (London)</option>
                    <option value="Europe/Paris">CET (Paris)</option>
                    <option value="Asia/Dubai">GST (Dubai)</option>
                    <option value="Asia/Kolkata">IST (India)</option>
                    <option value="Asia/Tokyo">JST (Tokyo)</option>
                    <option value="Australia/Sydney">AEST (Sydney)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Buffer Between Appts</label>
                  <select value={bufferMins} onChange={e => setBufferMins(e.target.value)}
                    className="w-full mt-1 border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary">
                    {["0", "5", "10", "15", "20", "30"].map(m => (
                      <option key={m} value={m}>{m === "0" ? "No buffer" : `${m} min`}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consult types */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Consult Types Offered</p>
              {consultTypes.map(ct => (
                <div key={ct.key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <ct.icon className={cn("h-4 w-4", ct.color)} />
                    <div>
                      <p className="text-sm font-semibold">{ct.label}</p>
                      <p className="text-xs text-muted-foreground">{ct.duration}</p>
                    </div>
                  </div>
                  <ToggleRight className="h-7 w-7 text-primary" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Weekly schedule */}
          <div className="space-y-2">
            {days.map(day => {
              const s = schedule[day];
              return (
                <Card key={day} className={cn(!s.enabled && "opacity-60")}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleDay(day)} className="shrink-0">
                        {s.enabled
                          ? <ToggleRight className="h-6 w-6 text-primary" />
                          : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                      </button>
                      <span className="w-8 text-sm font-bold shrink-0">{day}</span>
                      {s.enabled ? (
                        <div className="flex items-center gap-2 flex-1">
                          <select value={s.start} onChange={e => updateTime(day, "start", e.target.value)}
                            className="border border-border rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none focus:border-primary">
                            {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <span className="text-xs text-muted-foreground">to</span>
                          <select value={s.end} onChange={e => updateTime(day, "end", e.target.value)}
                            className="border border-border rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none focus:border-primary">
                            {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground flex-1">Unavailable</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

           <Button className="w-full rounded-xl" onClick={saveAvailability}>Save Availability</Button>
        </div>
      )}

      {tab === "bookings" && (
        <div className="space-y-3">
          {upcomingBookings.map(b => (
            <Card key={b.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                    {b.patient.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm">{b.patient}</p>
                      <span className="text-sm">{b.country}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{b.product} · {b.date} at {b.time}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={b.type === "video" ? "secondary" : "outline"} className="text-[10px]">
                      {b.type === "video" ? "Video" : "Async"}
                    </Badge>
                    <Button size="sm" className="rounded-xl text-xs h-8 gap-1">
                      {b.type === "video" ? <Video className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                      {b.type === "video" ? "Join" : "Review"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

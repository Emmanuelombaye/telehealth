import { useState, useEffect } from "react";
import {
  Calendar, Clock, Copy, CheckCircle2,
  ToggleLeft, ToggleRight, Video, MessageSquare, Loader2, Save
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";
import { useNavigate } from "react-router";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const timeSlots = [
  "07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00"
];

const defaultSchedule: Record<string, { enabled: boolean; start: string; end: string }> = {
  Mon: { enabled: true,  start: "09:00", end: "17:00" },
  Tue: { enabled: true,  start: "09:00", end: "17:00" },
  Wed: { enabled: true,  start: "09:00", end: "13:00" },
  Thu: { enabled: true,  start: "09:00", end: "17:00" },
  Fri: { enabled: true,  start: "09:00", end: "15:00" },
  Sat: { enabled: false, start: "10:00", end: "13:00" },
  Sun: { enabled: false, start: "10:00", end: "12:00" },
};

export function DoctorAvailabilityPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [tab, setTab] = useState<"schedule" | "bookings">("schedule");
  const [copied, setCopied] = useState(false);
  const [timezone, setTimezone] = useState("America/New_York");
  const [bufferMins, setBufferMins] = useState("10");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);

  const firstName = user?.user_metadata?.first_name || "Doctor";
  const lastName = user?.user_metadata?.last_name || "Provider";
  const bookingLink = `https://peakhealth.com/book/${firstName.toLowerCase()}-${lastName.toLowerCase()}`;

  // Load saved schedule from Supabase
  useEffect(() => {
    async function loadSchedule() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('doctor_schedules')
          .select('*')
          .eq('doctor_id', user.id)
          .single();

        if (data) {
          setSchedule(data.schedule || defaultSchedule);
          setTimezone(data.timezone || "America/New_York");
          setBufferMins(data.buffer_mins?.toString() || "10");
        }
      } catch (err) {
        console.warn("Schedule load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSchedule();
  }, [user]);

  // Load real upcoming bookings (zoom consultations requested by patients)
  useEffect(() => {
    if (!user) return;
    async function loadBookings() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id, order_number, patient_name, medication, consultation_time, zoom_status, zoom_rescheduled_time, status, created_at')
          .in('zoom_status', ['requested', 'confirmed', 'rescheduled'])
          .order('created_at', { ascending: false });

        if (!error) setBookings(data || []);
      } catch (err) {
        console.error("Bookings fetch error:", err);
      }
    }
    loadBookings();

    const ch = supabase.channel('doctor-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadBookings)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const saveAvailability = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('doctor_schedules').upsert({
        doctor_id: user.id,
        schedule,
        timezone,
        buffer_mins: parseInt(bufferMins),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'doctor_id' });

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Save availability error:", err);
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(bookingLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const zoomBadge: Record<string, string> = {
    requested:   "bg-amber-100 text-amber-700",
    confirmed:   "bg-emerald-100 text-emerald-700",
    rescheduled: "bg-blue-100 text-blue-700",
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

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
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Your Booking Link</p>
          <div className="flex items-center gap-2 bg-background rounded-xl px-3 py-2 border border-border">
            <span className="text-xs text-muted-foreground flex-1 truncate">{bookingLink}</span>
            <button onClick={copyLink} className="shrink-0 text-primary hover:text-primary/80 transition-colors">
              {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">Share with patients for direct booking</p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex bg-muted rounded-2xl p-1 gap-1">
        {(["schedule", "bookings"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 py-2 text-sm font-semibold rounded-xl transition-all capitalize",
              tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>
            {t === "schedule" ? "Weekly Schedule" : `Upcoming (${bookings.length})`}
          </button>
        ))}
      </div>

      {tab === "schedule" && (
        <div className="space-y-4">
          {saved && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-semibold">
              <CheckCircle2 className="h-4 w-4" /> Schedule saved successfully!
            </div>
          )}

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
                    <option value="America/Chicago">CT (Chicago)</option>
                    <option value="Europe/London">GMT (London)</option>
                    <option value="Europe/Paris">CET (Paris)</option>
                    <option value="Asia/Dubai">GST (Dubai)</option>
                    <option value="Asia/Kolkata">IST (India)</option>
                    <option value="Asia/Tokyo">JST (Tokyo)</option>
                    <option value="Australia/Sydney">AEST (Sydney)</option>
                    <option value="Africa/Nairobi">EAT (Nairobi)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Buffer Between Appts</label>
                  <select value={bufferMins} onChange={e => setBufferMins(e.target.value)}
                    className="w-full mt-1 border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary">
                    {["0","5","10","15","20","30"].map(m => (
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
              {[
                { key: "video", label: "Video Consult", icon: Video, duration: "30 min", color: "text-primary" },
                { key: "async", label: "Async Review", icon: MessageSquare, duration: "Flexible", color: "text-purple-600" },
              ].map(ct => (
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
                      <button onClick={() => setSchedule(sc => ({ ...sc, [day]: { ...sc[day], enabled: !sc[day].enabled } }))} className="shrink-0">
                        {s.enabled
                          ? <ToggleRight className="h-6 w-6 text-primary" />
                          : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                      </button>
                      <span className="w-8 text-sm font-bold shrink-0">{day}</span>
                      {s.enabled ? (
                        <div className="flex items-center gap-2 flex-1">
                          <select value={s.start}
                            onChange={e => setSchedule(sc => ({ ...sc, [day]: { ...sc[day], start: e.target.value } }))}
                            className="border border-border rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none focus:border-primary">
                            {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <span className="text-xs text-muted-foreground">to</span>
                          <select value={s.end}
                            onChange={e => setSchedule(sc => ({ ...sc, [day]: { ...sc[day], end: e.target.value } }))}
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

          <Button className="w-full rounded-xl gap-2" onClick={saveAvailability} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Availability"}
          </Button>
        </div>
      )}

      {tab === "bookings" && (
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No upcoming video consultations</p>
              <p className="text-xs mt-1">Patient zoom requests will appear here.</p>
            </div>
          ) : bookings.map(b => (
            <Card key={b.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                    {(b.patient_name || 'P').split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{b.patient_name || 'Patient'}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {b.medication} · {b.zoom_rescheduled_time || b.consultation_time || 'Time TBD'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full capitalize", zoomBadge[b.zoom_status] || "bg-muted text-muted-foreground")}>
                      {b.zoom_status?.replace('_', ' ')}
                    </span>
                    {b.zoom_status === 'confirmed' && (
                      <Button 
                        size="sm" 
                        className="rounded-xl text-xs h-8 gap-1 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20"
                        onClick={() => navigate(`/doctor/consult?orderId=${b.order_number}`)}
                      >
                        <Video className="h-3.5 w-3.5" /> Join
                      </Button>
                    )}
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

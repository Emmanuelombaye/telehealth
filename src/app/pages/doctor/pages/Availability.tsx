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
  const [consultTypes, setConsultTypes] = useState({ video: true, async: true });

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
          const savedSchedule = data.schedule || defaultSchedule;
          setSchedule(savedSchedule);
          setTimezone(data.timezone || "America/New_York");
          setBufferMins(data.buffer_mins?.toString() || "10");
          // Support both legacy column and nested JSON structure
          if (data.consult_types) setConsultTypes(data.consult_types);
          else if (savedSchedule.consult_types) setConsultTypes(savedSchedule.consult_types);
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
        schedule: { ...schedule, consult_types: consultTypes },
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      <p className="text-sm font-medium text-slate-500">Loading availability matrix...</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Clinical Availability</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Configure your practice hours and consultation preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex bg-slate-100/80 p-1.5 rounded-2xl gap-1.5 border border-slate-200/50">
            {(["schedule", "bookings"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn("flex-1 py-2.5 text-sm font-black rounded-xl transition-all capitalize tracking-tight",
                  tab === t ? "bg-white shadow-sm text-emerald-700 border border-emerald-100" : "text-slate-500 hover:text-slate-700")}>
                {t === "schedule" ? "Weekly Matrix" : `Upcoming (${bookings.length})`}
              </button>
            ))}
          </div>

          {tab === "schedule" && (
            <div className="space-y-6">
              {saved && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-[1.5rem] text-sm text-emerald-700 font-bold animate-in zoom-in duration-300">
                  <CheckCircle2 className="h-5 w-5" /> All availability changes synchronized to backend.
                </div>
              )}

              {/* Weekly schedule */}
              <div className="space-y-3">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Weekly Operating Hours</p>
                {days.map(day => {
                  const s = schedule[day];
                  return (
                    <Card key={day} className={cn(
                      "border border-slate-100 rounded-2xl transition-all duration-300",
                      !s.enabled ? "bg-slate-50/50 opacity-60" : "bg-white hover:border-emerald-200 hover:shadow-sm"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-6">
                          <button 
                            onClick={() => setSchedule(sc => ({ ...sc, [day]: { ...sc[day], enabled: !sc[day].enabled } }))} 
                            className="shrink-0 transition-transform active:scale-90"
                          >
                            {s.enabled
                              ? <ToggleRight className="h-9 w-9 text-emerald-600" />
                              : <ToggleLeft className="h-9 w-9 text-slate-300" />}
                          </button>
                          <span className="w-10 text-sm font-black text-slate-900 shrink-0">{day.toUpperCase()}</span>
                          {s.enabled ? (
                            <div className="flex items-center gap-3 flex-1">
                              <select value={s.start}
                                onChange={e => setSchedule(sc => ({ ...sc, [day]: { ...sc[day], start: e.target.value } }))}
                                className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none">
                                {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">TO</span>
                              <select value={s.end}
                                onChange={e => setSchedule(sc => ({ ...sc, [day]: { ...sc[day], end: e.target.value } }))}
                                className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none">
                                {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex-1">Practice Closed</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Button className="w-full h-14 rounded-[1.5rem] gap-2 text-base font-black shadow-lg shadow-emerald-600/20 bg-emerald-600 hover:bg-emerald-700 transition-all active:scale-95" onClick={saveAvailability} disabled={saving}>
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {saving ? "SYNCING..." : "COMMIT AVAILABILITY CHANGES"}
              </Button>
            </div>
          )}

          {tab === "bookings" && (
            <div className="space-y-3">
              {bookings.length === 0 ? (
                <div className="text-center py-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                  <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Calendar className="h-8 w-8 text-slate-200" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Queue Empty</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-[240px] mx-auto font-medium">Patient zoom requests will appear here in real-time.</p>
                </div>
              ) : bookings.map(b => (
                <Card key={b.id} className="border-slate-100 rounded-2xl hover:border-emerald-200 hover:shadow-md transition-all group">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center font-black text-emerald-700 text-sm shrink-0 border border-emerald-100">
                        {(b.patient_name || 'P').split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 text-base">{b.patient_name || 'Patient'}</p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-tight mt-0.5">
                          {b.medication} · {b.zoom_rescheduled_time || b.consultation_time || 'Time TBD'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={cn("text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider", zoomBadge[b.zoom_status] || "bg-slate-100 text-slate-500")}>
                          {b.zoom_status?.replace('_', ' ')}
                        </span>
                        {b.zoom_status === 'confirmed' && (
                          <Button 
                            size="sm" 
                            className="rounded-xl text-xs h-9 font-black px-4 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                            onClick={() => navigate(`/doctor/consult?orderId=${b.order_number}`)}
                          >
                            <Video className="h-4 w-4 mr-2" /> JOIN
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

        <div className="space-y-6">
          {/* Booking link */}
          <Card className="bg-emerald-600 border-none shadow-xl shadow-emerald-600/20 rounded-[2rem] overflow-hidden group">
            <CardContent className="p-6 relative">
              <div className="absolute -right-4 -top-4 h-24 w-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <p className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.3em] mb-3">Your Digital Practice</p>
              <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-4 border border-white/20 backdrop-blur-sm">
                <span className="text-[11px] font-bold text-white flex-1 truncate">{bookingLink}</span>
                <button onClick={copyLink} className="shrink-0 text-white hover:scale-110 transition-transform">
                  {copied ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <Copy className="h-5 w-5 opacity-70" />}
                </button>
              </div>
              <p className="text-[11px] text-emerald-50/70 mt-3 font-medium leading-relaxed italic">"Share this link with patients for direct, one-click practice booking."</p>
            </CardContent>
          </Card>

          {/* Consult types */}
          <Card className="border-slate-100 rounded-[2rem] shadow-sm">
            <CardContent className="p-6 space-y-4">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Consult Types Offered</p>
              {[
                { key: "video", label: "Video Consult", icon: Video, duration: "30 min", color: "text-emerald-600", bg: "bg-emerald-50" },
                { key: "async", label: "Async Review", icon: MessageSquare, duration: "Flexible", color: "text-indigo-600", bg: "bg-indigo-50" },
              ].map(ct => (
                <div key={ct.key} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:border-emerald-100">
                  <div className="flex items-center gap-4">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-white", ct.bg)}>
                      <ct.icon className={cn("h-5 w-5", ct.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{ct.label}</p>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{ct.duration}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setConsultTypes(prev => ({ ...prev, [ct.key]: !prev[ct.key as keyof typeof prev] }))}
                    className="shrink-0 active:scale-90 transition-transform"
                  >
                    {consultTypes[ct.key as keyof typeof consultTypes] 
                      ? <ToggleRight className="h-9 w-9 text-emerald-600" />
                      : <ToggleLeft className="h-9 w-9 text-slate-300" />}
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="border-slate-100 rounded-[2rem] shadow-sm">
            <CardContent className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Practice Timezone</label>
                  <select value={timezone} onChange={e => setTimezone(e.target.value)}
                    className="w-full mt-2 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none">
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Buffer Interval</label>
                  <select value={bufferMins} onChange={e => setBufferMins(e.target.value)}
                    className="w-full mt-2 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none">
                    {["0","5","10","15","20","30"].map(m => (
                      <option key={m} value={m}>{m === "0" ? "No buffer" : `${m} min`}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>    </div>
  );
}


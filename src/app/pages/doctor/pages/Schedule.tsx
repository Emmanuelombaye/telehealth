import { useState, useEffect, useRef } from "react";
import { Calendar, Clock, Video, ChevronRight, Plus, Loader2, CalendarPlus, CheckCircle2, AlertCircle, Activity, ShieldCheck, UserCircle, Send, Circle, Database, MessageCircle, X } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";
import { toCalendlyInlineEmbedUrl, defaultCalendlySchedulingUrl } from "../../../../lib/calendlyEmbed";
import { useNavigate } from "react-router";
import * as FramerMotion from "framer-motion";
const { motion, AnimatePresence } = FramerMotion;
import { toast } from "sonner";

export function DoctorSchedulePage() {
  const user = useAuthStore((s) => s.user);
  const [scheduledOrders, setScheduledOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleTimes, setRescheduleTimes] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [schedulingEmbedUrl, setSchedulingEmbedUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const availabilityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("calendly_url")
        .eq("id", user.id)
        .maybeSingle();
      const u = data?.calendly_url?.trim();
      if (u && u.startsWith("http")) {
        setSchedulingEmbedUrl(
          toCalendlyInlineEmbedUrl(u, { primaryColor: "0a2e1f" }) || u
        );
      } else {
        setSchedulingEmbedUrl(defaultCalendlySchedulingUrl());
      }
    })();
  }, [user?.id]);

  const fetchSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .not('zoom_status', 'is', null)
        .neq('zoom_status', 'not_requested')
        .neq('zoom_status', 'canceled')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setScheduledOrders(data || []);
    } catch (err) {
      console.error("Schedule fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
    const channel = supabase.channel('doctor-schedule-watch-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchSchedule())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleConfirm = async (id: string, orderNumber: string) => {
    setIsUpdating(id);
    try {
      setScheduledOrders(prev => prev.map(o => o.id === id ? { ...o, zoom_status: 'confirmed' } : o));
      const { error } = await supabase.from('orders').update({ zoom_status: 'confirmed' }).eq('order_number', orderNumber);
      if (error) throw error;
      toast.success("Session confirmed.");
      setSelectedId(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to confirm session.");
      fetchSchedule();
    } finally {
      setIsUpdating(null);
    }
  };

  const handleReschedule = async (id: string, orderNumber: string) => {
    const time = rescheduleTimes[id];
    if (!time) { toast.error("Please enter a proposed time."); return; }
    setIsUpdating(id);
    try {
      setScheduledOrders(prev => prev.map(o => o.id === id ? { ...o, zoom_status: 'rescheduled', zoom_rescheduled_time: time } : o));
      const { error } = await supabase.from('orders').update({ zoom_status: 'rescheduled', zoom_rescheduled_time: time }).eq('order_number', orderNumber);
      if (error) throw error;
      toast.success("Reschedule request sent to patient.");
      setRescheduleTimes(prev => { const n = { ...prev }; delete n[id]; return n; });
      setSelectedId(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send reschedule request.");
      fetchSchedule();
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-20 animate-in fade-in duration-700">

      {/* HEADER */}
      <div className="bg-white border border-slate-200 rounded-[1.75rem] px-8 py-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-60" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Active Video Logistics</span>
          </div>
          <h1 className="text-2xl font-black text-[#0A2E1F] tracking-tight uppercase">Clinical Schedule</h1>
          <p className="text-slate-500 text-xs font-medium mt-1">Manage consultations · Click any card to take action</p>
        </div>
        <Button
          onClick={() => availabilityRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="relative z-10 h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-xs shadow-lg shadow-emerald-600/20 gap-2 transition-all hover:scale-105 active:scale-95"
        >
          <CalendarPlus className="h-4 w-4" /> Update Availability
        </Button>
      </div>

      {/* MAIN GRID */}
      <div className="grid xl:grid-cols-12 gap-8">

        {/* SESSION LIST */}
        <div className="xl:col-span-8 space-y-5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-black text-[#0A2E1F] tracking-tight uppercase">Upcoming Sessions</h3>
            <Badge variant="outline" className="text-[10px] font-bold tracking-widest bg-white border-slate-200 text-slate-500 px-3 py-1">
              {scheduledOrders.length} {scheduledOrders.length === 1 ? 'Action' : 'Actions'} Pending
            </Badge>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 bg-white rounded-[1.75rem] shadow-sm border border-slate-100">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Syncing Matrix...</p>
              </motion.div>
            ) : scheduledOrders.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-dashed border-slate-200 rounded-[1.75rem]">
                  <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                    <Calendar className="h-7 w-7 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-bold text-sm">No Active Consultations</p>
                  <p className="text-slate-400 text-xs mt-1">Your queue is clear.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div className="space-y-3" initial="hidden" animate="show"
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}>
                {scheduledOrders.map((s) => {
                  const timeDisplay = s.zoom_rescheduled_time || s.consultation_time || "Pending";
                  const isConfirmed = s.zoom_status === "confirmed";
                  const isRequested = s.zoom_status === "requested";
                  const isRescheduled = s.zoom_status === "rescheduled";
                  const isSelected = selectedId === s.id;

                  const statusColor = isConfirmed
                    ? { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Confirmed" }
                    : isRequested
                    ? { bar: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200", label: "Action Required" }
                    : { bar: "bg-blue-400", badge: "bg-blue-50 text-blue-700 border-blue-200", label: "Pending Patient" };

                  return (
                    <motion.div key={s.id}
                      variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 26 } } }}
                    >
                      {/* ── CARD ── */}
                      <div
                        onClick={() => setSelectedId(isSelected ? null : s.id)}
                        className={cn(
                          "relative bg-white border rounded-[1.25rem] overflow-hidden cursor-pointer",
                          "transition-all duration-300 ease-out",
                          // Resting
                          "border-slate-200 shadow-sm",
                          // Selected / hover state: lift + left emerald border glow
                          isSelected
                            ? "border-emerald-400 shadow-[0_0_0_2px_rgba(52,211,153,0.2),0_12px_40px_rgba(10,46,31,0.12)] -translate-y-0.5 scale-[1.005]"
                            : "hover:border-slate-300 hover:shadow-md hover:-translate-y-px hover:scale-[1.002]",
                        )}
                      >
                        {/* Coloured left accent bar */}
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-[1.25rem] transition-all duration-300", statusColor.bar,
                          isSelected ? "w-1.5" : ""
                        )} />

                        {/* Shimmer overlay on select */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/60 via-transparent to-transparent pointer-events-none" />
                        )}

                        <div className="flex items-center gap-4 px-5 py-4 pl-6">
                          {/* Time badge */}
                          <div className={cn(
                            "shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-xl border text-center transition-all duration-300",
                            isSelected ? "bg-emerald-600 border-emerald-700 shadow-md shadow-emerald-600/20" : "bg-slate-50 border-slate-200",
                          )}>
                            <Clock className={cn("h-4 w-4 mb-1 transition-colors", isSelected ? "text-emerald-100" : "text-slate-400")} />
                            <p className={cn("text-[10px] font-black uppercase tracking-wide leading-tight transition-colors", isSelected ? "text-white" : "text-[#0A2E1F]")}>
                              {timeDisplay.split(' ')[0]}
                            </p>
                          </div>

                          {/* Patient info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-black text-[#0A2E1F] truncate">{s.patient_name || "Unknown Patient"}</p>
                              <span className={cn("text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0", statusColor.badge)}>
                                {statusColor.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                              <span className="bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[80px]">{s.category || "Treatment"}</span>
                              <span className="truncate">{s.medication}</span>
                            </div>
                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">#{s.order_number}</p>
                          </div>

                          {/* Right: action shortcut or expand indicator */}
                          <div className="shrink-0 flex items-center gap-2">
                            {isConfirmed && (
                              <Button
                                onClick={e => { e.stopPropagation(); navigate(`/doctor/consult?orderId=${s.order_number}`); }}
                                className="h-9 px-4 rounded-xl bg-[#0A2E1F] hover:bg-[#0d3f2a] text-white font-bold text-[10px] gap-1.5 shadow-md"
                              >
                                <Video className="h-3.5 w-3.5" /> Join
                              </Button>
                            )}
                            {isRescheduled && (
                              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
                                <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                                <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest whitespace-nowrap">Awaiting</span>
                              </div>
                            )}
                            <div className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center border transition-all duration-300",
                              isSelected
                                ? "bg-emerald-500 border-emerald-600 text-white rotate-45"
                                : "bg-slate-50 border-slate-200 text-slate-400"
                            )}>
                              {isSelected ? <X className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
                            </div>
                          </div>
                        </div>

                        {/* ── EXPANDING ACTION TRAY ── */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              key={`tray-${s.id}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-5 pt-1 border-t border-slate-100">
                                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quick Actions</p>

                                  {/* Propose time input */}
                                  {(isRequested || isRescheduled) && (
                                    <motion.div
                                      initial={{ opacity: 0, y: -6 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.1 }}
                                      className="flex items-center gap-2"
                                    >
                                      <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-200 transition-all">
                                        <Clock className="h-4 w-4 text-slate-300 shrink-0" />
                                        <input
                                          type="text"
                                          autoFocus
                                          placeholder="e.g. Tomorrow at 2:00 PM..."
                                          className="flex-1 text-xs font-medium outline-none bg-transparent text-slate-700 placeholder:text-slate-400"
                                          value={rescheduleTimes[s.id] || ""}
                                          onChange={e => setRescheduleTimes(prev => ({ ...prev, [s.id]: e.target.value }))}
                                          onKeyDown={e => { if (e.key === 'Enter') handleReschedule(s.id, s.order_number); }}
                                          onClick={e => e.stopPropagation()}
                                        />
                                      </div>
                                      <Button
                                        onClick={e => { e.stopPropagation(); handleReschedule(s.id, s.order_number); }}
                                        disabled={isUpdating === s.id}
                                        className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-600/20 shrink-0"
                                      >
                                        {isUpdating === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                        Send
                                      </Button>
                                    </motion.div>
                                  )}

                                  {/* Action buttons row */}
                                  <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="flex flex-wrap gap-2"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    {isRequested && (
                                      <Button
                                        onClick={() => handleConfirm(s.id, s.order_number)}
                                        disabled={isUpdating === s.id}
                                        className="h-9 px-5 rounded-xl bg-[#0A2E1F] hover:bg-[#061a12] text-white font-bold text-[11px] uppercase tracking-wider gap-2 shadow-lg shadow-emerald-900/20 border border-emerald-800/30 transition-all active:scale-95"
                                      >
                                        {isUpdating === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                                        Confirm Session
                                      </Button>
                                    )}
                                    {isConfirmed && (
                                      <Button
                                        onClick={() => navigate(`/doctor/consult?orderId=${s.order_number}`)}
                                        className="h-9 px-5 rounded-xl bg-[#0A2E1F] hover:bg-[#061a12] text-white font-bold text-[11px] uppercase tracking-wider gap-2 shadow-lg shadow-emerald-900/20 border border-emerald-800/30 transition-all active:scale-95"
                                      >
                                        <Video className="h-3.5 w-3.5 text-emerald-400" /> Join Consultation Room
                                      </Button>
                                    )}
                                    <Button
                                      variant="outline"
                                      onClick={() => setSelectedId(null)}
                                      className="h-9 px-4 rounded-xl border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex items-center gap-2 group/dismiss"
                                    >
                                      <AlertCircle className="h-3.5 w-3.5 opacity-0 group-hover/dismiss:opacity-100 transition-opacity" />
                                      Dismiss
                                    </Button>
                                  </motion.div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SIDEBAR */}
        <div className="xl:col-span-4 space-y-5">
          <Card className="border-none shadow-xl shadow-emerald-900/10 rounded-[1.75rem] bg-gradient-to-br from-[#0A2E1F] to-[#062015] text-white p-7 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-emerald-400/30 transition-colors duration-700" />
            <div className="flex items-center gap-3 mb-5 relative z-10">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-black tracking-widest uppercase text-emerald-50">Clinical Matrix</h3>
            </div>
            <div className="space-y-3 relative z-10">
              {[
                { label: "Identity Verification", status: "Validated", icon: UserCircle },
                { label: "Telemetry Sync", status: "Active", icon: Activity },
                { label: "Encrypted Stream", status: "Secured", icon: ShieldCheck },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2.5">
                    <item.icon className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-50/80">{item.label}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{item.status}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-7 rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <h3 className="text-xs font-black text-[#0A2E1F] uppercase tracking-widest mb-5 flex items-center justify-between">
              Network Utilization <Activity className="h-4 w-4 text-slate-400" />
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <p className="text-xs font-bold text-slate-500 uppercase">Current Load</p>
                <p className="text-xl font-black text-emerald-600">84%</p>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: '84%' }} transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* AVAILABILITY ENGINE */}
      <div className="pt-12 border-t border-slate-100" ref={availabilityRef}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 mb-7">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-[1rem] bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <CalendarPlus className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#0A2E1F] uppercase tracking-tight">Availability Engine</h2>
              <p className="text-xs font-bold text-slate-400 mt-0.5">Manage global consultation slots.</p>
            </div>
          </div>
          <Badge variant="outline" className="px-4 py-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-widest text-[10px] font-bold gap-2">
            <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500 animate-pulse" /> Live Sync
          </Badge>
        </div>
        <div className="overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50 rounded-[1.75rem] bg-white">
          {schedulingEmbedUrl ? (
          <iframe
            src={schedulingEmbedUrl}
            width="100%" height="700" frameBorder="0" title="Your scheduling calendar"
            className="w-full bg-white"
          />
          ) : (
            <div className="h-[400px] flex items-center justify-center text-slate-500 text-sm font-medium">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading your calendar…
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

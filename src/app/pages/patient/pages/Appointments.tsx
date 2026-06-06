import { useState, useEffect, type ReactNode } from "react";
import { Calendar, Clock, Video, MessageSquare, Plus, AlertCircle, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, Button, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";
import { defaultCalendlyBookingPageUrl, toSchedulingOpenTabUrl } from "../../../../lib/calendlyEmbed";
import { getMockSchedulingSlots, isMockSchedulingEnabled } from "../../../../lib/mockScheduling";
import { toast } from "sonner";

// Real-time zoom status config
const zoomStatusConfig: Record<string, { label: string; icon: ReactNode; card: string; badge: string }> = {
  not_requested: {
    label: "No live visit on calendar",
    icon: <MessageSquare className="h-5 w-5 text-slate-400" />,
    card: "bg-slate-50 border-slate-200",
    badge: "bg-slate-100 text-slate-500",
  },
  requested: {
    label: "Visit requested — book time",
    icon: <Clock className="h-5 w-5 text-amber-500 animate-pulse" />,
    card: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-700",
  },
  confirmed: {
    label: "Live visit confirmed — Zoom / Meet ready",
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
    card: "bg-emerald-50 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
  },
  rescheduled: {
    label: "Visit rescheduled by clinician",
    icon: <RefreshCw className="h-5 w-5 text-blue-600" />,
    card: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-700",
  },
  cancelled: {
    label: "Live visit cancelled",
    icon: <XCircle className="h-5 w-5 text-red-500" />,
    card: "bg-red-50 border-red-200",
    badge: "bg-red-100 text-red-600",
  },
};

/** Columns that exist on older DBs — never omit or the page breaks before migrations ship. */
const APPOINTMENTS_ORDER_SELECT_BASE =
  "id, order_number, medication, consultation_time, zoom_status, zoom_doctor_message, zoom_rescheduled_time, status, ordered_date, zoom_join_url, doctor_id, consultation_live";

function isMissingSchedulingBookingColumnError(err: { message?: string; details?: string; code?: string } | null): boolean {
  const m = `${err?.message || ""} ${err?.details || ""}`.toLowerCase();
  return (
    m.includes("scheduling_booking") ||
    (m.includes("column") && m.includes("does not exist")) ||
    err?.code === "42703"
  );
}

export function AppointmentsPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchOrders = async () => {
    if (!user?.id) {
      setOrders([]);
      setFetchError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      let q = supabase
        .from("orders")
        .select(`${APPOINTMENTS_ORDER_SELECT_BASE}, scheduling_booking_url`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      const first = await q;
      /** Widen rows so fallback select (without scheduling_booking_url) stays assignable. */
      let data: Record<string, any>[] | null = first.data ?? null;
      let error = first.error;
      if (error && isMissingSchedulingBookingColumnError(error)) {
        const retry = await supabase
          .from("orders")
          .select(APPOINTMENTS_ORDER_SELECT_BASE)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        data = retry.data ?? null;
        error = retry.error;
      }
      if (error) throw error;
      setOrders(data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Appointments fetch error:", err);
      setOrders([]);
      setFetchError(err instanceof Error ? err.message : "Could not load appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setOrders([]);
      setLoading(false);
      setFetchError(null);
      return;
    }

    const uid = user.id;
    void fetchOrders();

    const channel = supabase
      .channel("patient-appointments-live")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const row = payload.new as { id?: string; user_id?: string; order_number?: string };
          if (row.user_id !== uid) return;
          setOrders((prev) =>
            prev.map((o) => {
              const sameById =
                o.id != null && row.id != null && String(o.id) === String(row.id);
              const sameByOrderNum =
                row.order_number != null &&
                o.order_number != null &&
                String(o.order_number) === String(row.order_number);
              if (sameById || sameByOrderNum) return { ...o, ...payload.new };
              return o;
            })
          );
          setLastUpdated(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const zoomOrders = orders.filter(o => o.zoom_status && o.zoom_status !== 'not_requested');
  const noZoomOrders = orders.filter(o => !o.zoom_status || o.zoom_status === 'not_requested');

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded-xl w-48" />
        {[1,2,3].map(i => <div key={i} className="h-28 bg-muted rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 px-4 py-6 text-foreground min-h-[50vh]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Step 9 of 9 · Patient portal</p>
          <h1 className="text-xl font-bold text-foreground">Appointments & live visits</h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
            Scheduling (Cal.com / Calendly) and video (Zoom / Google Meet) stay inside the same nine-step journey: booking
            completes step 8 intake when required; this page is your hub in step 9.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {lastUpdated ? `Live · Updated ${lastUpdated.toLocaleTimeString()}` : "Syncing…"}
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-1.5" />
          </p>
        </div>
      </div>

      {fetchError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
        >
          <p className="font-semibold">Could not load appointments</p>
          <p className="mt-1 text-xs opacity-90">{fetchError}</p>
          <Button type="button" variant="outline" className="mt-3 h-9 rounded-lg text-xs" onClick={() => void fetchOrders()}>
            Try again
          </Button>
        </div>
      )}

      {/* Live telehealth — same stack as step 8 (intake), surfaced in step 9 */}
      {zoomOrders.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Live telehealth (Zoom / Meet)</p>
          {zoomOrders.map(order => {
            const status = order.zoom_status || 'not_requested';
            const cfg = zoomStatusConfig[status] || zoomStatusConfig.not_requested;
            const displayTime = order.zoom_rescheduled_time || order.consultation_time;

            return (
              <Card key={order.id} className={`border-2 ${cfg.card}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-white border border-border flex items-center justify-center shrink-0">
                        {cfg.icon}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{order.medication}</p>
                        <p className="text-xs text-muted-foreground">Order #{order.order_number}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Time display */}
                  {displayTime && (
                    <div className="flex items-center gap-2 p-3 bg-white/70 rounded-xl border border-white">
                      <Video className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        {order.zoom_rescheduled_time && (
                          <p className="text-[10px] text-blue-600 font-bold">RESCHEDULED BY DOCTOR</p>
                        )}
                        <p className="text-sm font-bold">{displayTime}</p>
                        {order.zoom_rescheduled_time && order.consultation_time && (
                          <p className="text-[10px] text-muted-foreground line-through">{order.consultation_time}</p>
                        )}
                      </div>
                      {status === 'confirmed' && (
                        <div className="ml-auto flex items-center gap-2">
                          {order.consultation_live && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          )}
                          <Button 
                            onClick={() => window.open(order.zoom_join_url || `https://zoom.us`, '_blank')}
                            className={cn(
                              "h-10 px-4 text-xs rounded-xl font-bold uppercase tracking-widest shadow-lg transition-all",
                              order.consultation_live 
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse" 
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            )}
                          >
                            <Video className="h-4 w-4 mr-2" />
                            {order.consultation_live ? "Doctor is Waiting — Launch Zoom" : "Launch Zoom Meeting"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Doctor's message */}
                  {order.zoom_doctor_message && (
                    <div className="flex items-start gap-2 p-3 bg-white/80 border border-white rounded-xl">
                      <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">Message from your doctor</p>
                        <p className="text-sm text-foreground">{order.zoom_doctor_message}</p>
                      </div>
                    </div>
                  )}

                  {/* Status-specific guidance */}
                  {status === 'requested' && (
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200 mt-2">
                      <p className="text-xs text-amber-700 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        Please book a time on the doctor's calendar.
                      </p>
                      <Button 
                        onClick={async () => {
                          if (isMockSchedulingEnabled()) {
                            const slot = getMockSchedulingSlots(1)[0];
                            const { error } = await supabase
                              .from("orders")
                              .update({
                                zoom_status: "confirmed",
                                consultation_time: slot?.isoStart ?? new Date().toISOString(),
                              })
                              .eq("id", order.id);
                            if (error) {
                              toast.error("Could not save booking.");
                              return;
                            }
                            toast.success(
                              slot
                                ? `Visit booked for ${slot.dayLabel} at ${slot.timeLabel}`
                                : "Visit booked.",
                            );
                            return;
                          }

                          let bookingUrl = defaultCalendlyBookingPageUrl();
                          if (!bookingUrl) {
                            toast.error("No scheduling URL configured.");
                            return;
                          }

                          if (order.doctor_id) {
                            const { data: profile } = await supabase
                              .from('profiles')
                              .select('calendly_url')
                              .eq('id', order.doctor_id)
                              .single();

                            if (profile?.calendly_url && String(profile.calendly_url).trim().startsWith("http")) {
                              bookingUrl =
                                toSchedulingOpenTabUrl(String(profile.calendly_url).trim()) ||
                                String(profile.calendly_url).trim();
                            } else if (
                              order.scheduling_booking_url &&
                              String(order.scheduling_booking_url).trim().startsWith("http")
                            ) {
                              bookingUrl =
                                toSchedulingOpenTabUrl(String(order.scheduling_booking_url).trim()) ||
                                String(order.scheduling_booking_url).trim();
                            }
                          } else if (
                            order.scheduling_booking_url &&
                            String(order.scheduling_booking_url).trim().startsWith("http")
                          ) {
                            bookingUrl =
                              toSchedulingOpenTabUrl(String(order.scheduling_booking_url).trim()) ||
                              String(order.scheduling_booking_url).trim();
                          }

                          window.open(bookingUrl, '_blank');
                        }}
                        className="h-8 px-3 text-xs rounded-xl bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
                      >
                        <Calendar className="h-3 w-3" /> Book Time
                      </Button>
                    </div>
                  )}
                  {status === 'cancelled' && (
                    <p className="text-xs text-red-600 flex items-center gap-1.5">
                      <AlertCircle className="h-3 w-3" />
                      Live visit was cancelled. Your clinician may complete the review asynchronously.
                    </p>
                  )}
                  {status === 'rescheduled' && (
                    <div className="space-y-3">
                      <p className="text-xs text-blue-700 flex items-center gap-1.5">
                        <RefreshCw className="h-3 w-3" />
                        Your doctor has proposed a new time.
                      </p>
                      <Button 
                        size="sm" 
                        className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold h-9"
                        onClick={async () => {
                          const { error } = await supabase
                            .from('orders')
                            .update({ 
                              zoom_status: 'confirmed',
                              consultation_time: order.zoom_rescheduled_time,
                              zoom_rescheduled_time: null 
                            })
                            .eq('id', order.id);
                          if (error) alert("Failed to accept time. Please try again.");
                        }}
                      >
                        Accept New Time
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Async orders (no zoom) */}
      {noZoomOrders.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Async review (no live visit)</p>
          {noZoomOrders.map(order => (
            <Card key={order.id} className="border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{order.medication}</p>
                  <p className="text-xs text-muted-foreground">#{order.order_number} · Doctor reviewing async</p>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded-full">
                  Async
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {orders.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-bold text-foreground">No appointments yet</p>
          <p className="text-sm text-muted-foreground">Start a treatment to schedule your first consultation.</p>
          <a href="/" className="inline-block mt-2">
            <Button className="rounded-xl gap-2"><Plus className="h-4 w-4" /> Shop Treatments</Button>
          </a>
        </div>
      )}
    </div>
  );
}

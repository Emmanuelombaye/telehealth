import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Users, Clock, Video, MessageSquare, FileText, ChevronRight,
  CheckCircle2, AlertCircle, Circle, Stethoscope, Pill,
  Phone, ToggleLeft, ToggleRight, Search, Filter, Bell, Zap
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { OrderStatus, Order } from "../../../../lib/patient-store";
import { supabase } from "../../../../lib/supabaseClient";

type AvailabilityStatus = "available" | "busy" | "break" | "offline";

const availabilityConfig: Record<AvailabilityStatus, { label: string; color: string; dot: string }> = {
  available: { label: "Available", color: "text-emerald-600", dot: "bg-emerald-500" },
  busy: { label: "In Consult", color: "text-amber-600", dot: "bg-amber-500" },
  break: { label: "On Break", color: "text-violet-600", dot: "bg-violet-500" },
  offline: { label: "Offline", color: "text-muted-foreground", dot: "bg-gray-400" },
};

const queueStatusConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  order_submitted: { label: "Waiting Review", color: "text-amber-700", bg: "bg-amber-100 dark:bg-amber-950/40" },
  doctor_reviewing: { label: "In Review", color: "text-violet-700", bg: "bg-violet-100 dark:bg-violet-950/40" },
  rx_sent: { label: "Rx Sent", color: "text-emerald-700", bg: "bg-emerald-100 dark:bg-emerald-950/40" },
  shipped: { label: "Shipped", color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-950/40" },
  delivered: { label: "Delivered", color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-950/40" },
};

export function DoctorQueuePage() {
  const [availability, setAvailability] = useState<AvailabilityStatus>("available");
  const [autoAccept, setAutoAccept] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  
  // Rx Form State
  const [rxDrug, setRxDrug] = useState("");
  const [rxDosage, setRxDosage] = useState("");
  const [rxNote, setRxNote] = useState("");

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  // Zoom management state
  const [zoomAction, setZoomAction] = useState<'confirm' | 'reschedule' | 'cancel' | null>(null);
  const [zoomRescheduleTime, setZoomRescheduleTime] = useState("");
  const [zoomMessage, setZoomMessage] = useState("");
  const [zoomSaving, setZoomSaving] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    }
    fetchOrders();

    // Set up Realtime subscription for live queue updates!
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('Live order update received!', payload);
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const queue = orders.filter(o => o.status === "order_submitted" || o.status === "doctor_reviewing");

  const avail = availabilityConfig[availability];
  const activeCount = queue.length;

  const handleSendRx = async () => {
    if (!selected) return;
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'doctor_approved', doctor_note: rxNote })
        .eq('id', selected.id);
      if (error) throw error;
      setOrders(orders.map(o => o.id === selected.id ? { ...o, status: 'doctor_approved' } : o));
      setSelected(null);
    } catch (err) {
      console.error("Failed to approve Rx:", err);
    }
  };

  const handleZoomAction = async () => {
    if (!selected || !zoomAction) return;
    setZoomSaving(true);
    const times = ["9:00 AM","10:30 AM","12:00 PM","1:00 PM","2:45 PM","4:00 PM","5:00 PM"];
    const dates = ["Today","Tomorrow","Wednesday","Thursday","Friday"];
    try {
      const update: Record<string, any> = { zoom_doctor_message: zoomMessage || null };
      if (zoomAction === 'confirm') {
        update.zoom_status = 'confirmed';
      } else if (zoomAction === 'reschedule') {
        update.zoom_status = 'rescheduled';
        update.zoom_rescheduled_time = zoomRescheduleTime;
      } else if (zoomAction === 'cancel') {
        update.zoom_status = 'cancelled';
      }
      const { error } = await supabase.from('orders').update(update).eq('id', selected.id);
      if (error) throw error;
      // Update local optimistic state so UI refreshes immediately
      const updated = { ...selected, ...update };
      setSelected(updated);
      setOrders(orders.map(o => o.id === selected.id ? updated : o));
      setZoomAction(null);
      setZoomRescheduleTime("");
      setZoomMessage("");
    } catch (err) {
      console.error("Zoom update failed:", err);
    } finally {
      setZoomSaving(false);
    }
  };

  if (selected) {
    const cfg = queueStatusConfig[selected.status];
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          ← Back to Queue
        </button>

        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-lg shrink-0">
            {selected.patientAvatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{selected.patientName}</h1>
              <span className="text-sm">{selected.patientCountry}</span>
            </div>
            <p className="text-sm text-muted-foreground">Age {selected.patientAge} · {selected.category}</p>
          </div>
          <span className={cn("text-xs font-bold px-3 py-1.5 rounded-full", cfg.bg, cfg.color)}>{cfg.label}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="border-none bg-muted/50">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Requested Product</p>
              <p className="font-bold text-sm">{selected.medication}</p>
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
          <CardContent className="p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5"><FileText className="h-4 w-4" /> Intake Questionnaire Answers</p>
              <div className="space-y-4">
                {/* Clinical Vitals — from patient_vitals JSONB */}
                {(() => {
                  const v = selected.patient_vitals || selected.patientVitals || {};
                  const hasVitals = v.height || v.weight || v.dob;
                  return hasVitals ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">DOB / Sex</p>
                          <p className="text-sm font-semibold text-slate-800">{v.dob || '—'} · {v.sex || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Height</p>
                          <p className="text-sm font-semibold text-slate-800">{v.height || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Weight</p>
                          <p className="text-sm font-semibold text-slate-800">{v.weight || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">BMI</p>
                          <p className={`text-sm font-semibold ${parseFloat(v.bmi) >= 30 ? 'text-rose-600' : parseFloat(v.bmi) >= 25 ? 'text-amber-600' : 'text-emerald-600'}`}>{v.bmi || '—'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Blood Type</p>
                          <p className="text-sm font-semibold text-slate-800">{v.bloodType || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Hair · Eye</p>
                          <p className="text-sm font-semibold text-slate-800">{v.hairColor || '—'} · {v.eyeColor || '—'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Shipping Address</p>
                          <p className="text-sm font-semibold text-slate-800">{v.address || '—'}</p>
                        </div>
                      </div>
                      {(v.allergies || v.currentMeds) && (
                        <div className="grid grid-cols-2 gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                          <div>
                            <p className="text-[10px] text-rose-700 uppercase font-bold">⚠ Allergies</p>
                            <p className="text-sm font-semibold text-rose-800">{v.allergies || 'None reported'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Current Meds</p>
                            <p className="text-sm font-semibold text-slate-800">{v.currentMeds || 'None'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <div><p className="text-[10px] text-slate-500 uppercase font-bold">Age</p><p className="text-sm font-semibold text-slate-800">{selected.patient_age || selected.patientAge || '—'}</p></div>
                      <div><p className="text-[10px] text-slate-500 uppercase font-bold">Country</p><p className="text-sm font-semibold text-slate-800">{selected.patient_country || selected.patientCountry || '—'}</p></div>
                    </div>
                  );
                })()}

                {/* Patient Answers */}
                <div className="space-y-3 pt-2">
                  {selected.intakeAnswers ? (
                    Object.entries(selected.intakeAnswers).map(([q, a]) => (
                      <div key={q} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        <p className="text-xs font-semibold text-slate-600 mb-1">{q}</p>
                        <p className="text-sm text-slate-800">{Array.isArray(a) ? a.join(", ") : a}</p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        <p className="text-xs font-semibold text-slate-600 mb-1">What are your primary weight-loss goals and timeline?</p>
                        <p className="text-sm text-slate-800">I want to lose 30 lbs before my wedding in 6 months. I've tried dieting but hit a plateau.</p>
                      </div>
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        <p className="text-xs font-semibold text-slate-600 mb-1">Have you ever had pancreatitis, gallbladder disease, or MEN-2?</p>
                        <p className="text-sm font-medium text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> No history</p>
                      </div>
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        <p className="text-xs font-semibold text-slate-600 mb-1">List all current medications and supplements</p>
                        <p className="text-sm text-slate-800">Just a daily multivitamin and occasional ibuprofen.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Chief Complaint & Clinical Notes</p>
              <p className="text-sm bg-amber-50 text-amber-900 p-3 rounded-xl border border-amber-100">{selected.intakeNotes}</p>
            </div>
            
            {/* Zoom Management Panel */}
            {(() => {
              const zoomStatus = selected.zoom_status || 'not_requested';
              const reqTime = selected.consultation_time;
              const reschedTime = selected.zoom_rescheduled_time;
              const docMsg = selected.zoom_doctor_message;
              const zoomDates = ["Today","Tomorrow","Wednesday","Thursday","Friday"];
              const zoomTimes = ["9:00 AM","10:30 AM","12:00 PM","1:00 PM","2:45 PM","4:00 PM"];

              const statusBadge: Record<string, { label: string; cls: string }> = {
                requested:    { label: "Zoom Requested", cls: "bg-amber-100 text-amber-700 border-amber-200" },
                confirmed:    { label: "Zoom Confirmed ✓", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
                rescheduled:  { label: "Rescheduled", cls: "bg-blue-100 text-blue-700 border-blue-200" },
                cancelled:    { label: "Zoom Cancelled", cls: "bg-slate-100 text-slate-500 border-slate-200" },
                not_requested:{ label: "No Zoom Requested", cls: "bg-slate-100 text-slate-500 border-slate-200" },
              };
              const badge = statusBadge[zoomStatus] || statusBadge.not_requested;

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Video Consultation</p>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${badge.cls}`}>{badge.label}</span>
                  </div>

                  {/* Show patient's requested time */}
                  {reqTime && zoomStatus !== 'not_requested' && (
                    <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <Video className="h-4 w-4 text-amber-600 shrink-0" />
                      <div>
                        <p className="text-xs text-amber-700 font-bold">Patient requested</p>
                        <p className="text-sm font-semibold text-amber-900">{reqTime}</p>
                      </div>
                      {zoomStatus === 'confirmed' && (
                        <Button className="ml-auto h-8 px-3 text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white">Join Zoom</Button>
                      )}
                    </div>
                  )}

                  {/* Show rescheduled time */}
                  {reschedTime && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <Video className="h-4 w-4 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-xs text-blue-700 font-bold">New time (rescheduled by you)</p>
                        <p className="text-sm font-semibold text-blue-900">{reschedTime}</p>
                      </div>
                    </div>
                  )}

                  {/* Doctor's message if any */}
                  {docMsg && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                      <p className="font-bold text-slate-700 mb-0.5">Your message to patient:</p>
                      <p>{docMsg}</p>
                    </div>
                  )}

                  {/* Action buttons — only for requested/rescheduled */}
                  {(zoomStatus === 'requested' || zoomStatus === 'rescheduled') && (
                    <div className="flex gap-2">
                      <button onClick={() => setZoomAction('confirm')}
                        className={`flex-1 text-xs font-bold py-2 rounded-xl border-2 transition-all ${zoomAction === 'confirm' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-emerald-400 text-emerald-700 hover:bg-emerald-50'}`}>
                        ✓ Confirm
                      </button>
                      <button onClick={() => setZoomAction('reschedule')}
                        className={`flex-1 text-xs font-bold py-2 rounded-xl border-2 transition-all ${zoomAction === 'reschedule' ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-400 text-blue-700 hover:bg-blue-50'}`}>
                        ↻ Reschedule
                      </button>
                      <button onClick={() => setZoomAction('cancel')}
                        className={`flex-1 text-xs font-bold py-2 rounded-xl border-2 transition-all ${zoomAction === 'cancel' ? 'bg-red-500 border-red-500 text-white' : 'border-slate-300 text-slate-500 hover:bg-slate-50'}`}>
                        ✕ Cancel
                      </button>
                    </div>
                  )}

                  {/* Confirmed — allow rescheduling */}
                  {zoomStatus === 'confirmed' && (
                    <button onClick={() => setZoomAction('reschedule')}
                      className="w-full text-xs font-bold py-2 rounded-xl border-2 border-blue-300 text-blue-600 hover:bg-blue-50 transition-all">
                      ↻ Reschedule This Meeting
                    </button>
                  )}

                  {/* Not requested — doctor can propose a zoom */}
                  {zoomStatus === 'not_requested' && (
                    <button onClick={() => setZoomAction('confirm')}
                      className="w-full text-xs font-bold py-2 rounded-xl border-2 border-primary/40 text-primary hover:bg-primary/5 transition-all">
                      + Initiate Zoom Meeting
                    </button>
                  )}

                  {/* Reschedule picker */}
                  {zoomAction === 'reschedule' && (
                    <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-xs font-bold text-blue-700">Select new date & time:</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {zoomDates.map(d => (
                          <button key={d} onClick={() => setZoomRescheduleTime(zoomRescheduleTime.includes(d) ? zoomRescheduleTime : zoomRescheduleTime.split(' at ')[1] ? `${d} at ${zoomRescheduleTime.split(' at ')[1]}` : d)}
                            className={`text-xs font-semibold px-2 py-1 rounded-lg border transition-all ${zoomRescheduleTime.startsWith(d) ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-300 text-blue-700 bg-white'}`}>
                            {d}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {zoomTimes.map(t => (
                          <button key={t} onClick={() => { const d = zoomRescheduleTime.split(' at ')[0] || 'TBD'; setZoomRescheduleTime(`${d} at ${t}`); }}
                            className={`text-xs font-semibold px-2 py-1 rounded-lg border transition-all ${zoomRescheduleTime.endsWith(t) ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-300 text-blue-700 bg-white'}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message field — always shown when action selected */}
                  {zoomAction && (
                    <div className="space-y-2">
                      <textarea
                        value={zoomMessage}
                        onChange={e => setZoomMessage(e.target.value)}
                        rows={2}
                        placeholder={zoomAction === 'cancel' ? "Reason for cancelling (shown to patient)..." : zoomAction === 'reschedule' ? "Message to patient about new time..." : "Optional message to patient..."}
                        className="w-full border border-border rounded-xl px-3 py-2 text-xs bg-background focus:outline-none focus:border-primary resize-none"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleZoomAction} disabled={zoomSaving || (zoomAction === 'reschedule' && !zoomRescheduleTime)}
                          className="flex-1 h-9 text-xs rounded-xl bg-slate-800 hover:bg-slate-900 text-white">
                          {zoomSaving ? "Saving..." : "Save & Notify Patient"}
                        </Button>
                        <Button variant="outline" onClick={() => { setZoomAction(null); setZoomRescheduleTime(""); setZoomMessage(""); }}
                          className="h-9 text-xs rounded-xl">Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Rx writer */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-bold flex items-center gap-2"><Pill className="h-4 w-4 text-primary" /> Write Prescription</p>
            <div className="grid grid-cols-2 gap-2">
              <input 
                className="border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary" 
                placeholder="Drug name" 
                defaultValue={selected.medication}
                onChange={e => setRxDrug(e.target.value)}
              />
              <input 
                className="border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary" 
                placeholder="Dosage (e.g. 10mg)" 
                defaultValue={selected.dosageInstructions}
                onChange={e => setRxDosage(e.target.value)}
              />
            </div>
            <textarea rows={2} value={rxNote} onChange={e => setRxNote(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary resize-none"
              placeholder="Clinical notes for pharmacy/patient..." />
            <div className="flex gap-2">
              <Button onClick={handleSendRx} className="flex-1 rounded-xl gap-1.5 bg-emerald-500 hover:bg-emerald-600">
                <Pill className="h-4 w-4" /> Send Rx to Pharmacy
              </Button>
              <Button variant="outline" className="rounded-xl gap-1.5">
                <MessageSquare className="h-4 w-4" /> Message
              </Button>
            </div>
          </CardContent>
        </Card>
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
        </CardContent>
      </Card>

      {/* Queue */}
      <div className="space-y-2">
        {queue.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-border rounded-xl">
            No patients currently in queue.
          </div>
        ) : queue.map(patient => {
          const cfg = queueStatusConfig[patient.status];
          return (
            <Card key={patient.id}
              className={cn("hover:border-primary/40 transition-colors cursor-pointer",
                patient.urgent && "border-l-4 border-l-red-500")}
              onClick={() => {
                setSelected(patient);
                if (patient.status === "order_submitted") {
                  updateOrderStatus(patient.id, "doctor_reviewing");
                }
              }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                      {patient.patientAvatar}
                    </div>
                    {patient.urgent && (
                      <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 ring-2 ring-card flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold">!</span>
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{patient.patientName}</p>
                      <span className="text-xs">{patient.patientCountry}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{patient.category} · {patient.time || patient.orderedDate}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", cfg.bg, cfg.color)}>
                        {cfg.label}
                      </span>
                      {patient.id === "RX-44810" && (
                        <span className="text-[10px] bg-sky-100 text-sky-700 font-bold px-2 py-0.5 rounded-full border border-sky-200">
                          REFILL (30 DAY)
                        </span>
                      )}
                      {patient.status === "order_submitted" && patient.waitMins && patient.waitMins > 0 && (
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

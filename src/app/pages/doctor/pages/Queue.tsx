import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Users, Clock, Video, MessageSquare, FileText, ChevronRight,
  CheckCircle2, AlertCircle, Circle, Stethoscope, Pill,
  Phone, ToggleLeft, ToggleRight, Search, Filter, Bell, Zap
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared";
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
      
      // Update local state optimistic UI
      setOrders(orders.map(o => o.id === selected.id ? { ...o, status: 'doctor_approved' } : o));
      setSelected(null);
    } catch (err) {
      console.error("Failed to approve Rx:", err);
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
                {/* Clinical Vitals */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Date of Birth</p>
                    <p className="text-sm font-semibold text-slate-800">10/14/1992</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Height</p>
                    <p className="text-sm font-semibold text-slate-800">5'8"</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Weight</p>
                    <p className="text-sm font-semibold text-slate-800">214 lbs</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">BMI</p>
                    <p className="text-sm font-semibold text-rose-600 bg-rose-50 inline-px px-2 rounded">32.5</p>
                  </div>
                </div>

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
            
            {selected.consultationTime && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Required Consultation</p>
                <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Video className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">Zoom Call Scheduled</p>
                      <p className="text-xs text-primary font-semibold">{selected.consultationTime}</p>
                    </div>
                  </div>
                  <Button className="rounded-xl h-10 px-4 text-sm gap-2">
                    Join Zoom
                  </Button>
                </div>
              </div>
            )}
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

import { useState, useEffect } from "react";
import {
  Package, CheckCircle2, Stethoscope, Pill, Truck, ShoppingBag, FileText,
  ChevronRight, Search, MapPin, ExternalLink, MessageSquare, Copy, Activity, Video, ShieldCheck
} from "lucide-react";
import { Link } from "react-router";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import {
  buildOrderTrackingVerticalSteps,
  getOrderTrackingVerticalIndex,
  type FulfillmentRailStep,
} from "../../../../lib";
import type { Order } from "../../../../lib";
import { useAuthStore } from "../../../../lib";
import { supabase } from "../../../../lib/supabaseClient";

const stepIcon: Record<string, any> = {
  order_submitted: ShoppingBag,
  account_created: CheckCircle2,
  id_verified: ShieldCheck,
  intake_completed: Activity,
  medical_review: Stethoscope,
  consultation: Video,
  rx_sent: Pill,
  shipped: Truck,
  delivered: Package,
  follow_up: MessageSquare,
  refill_eligible: CheckCircle2,
};

function trackingRowIcon(step: FulfillmentRailStep) {
  return stepIcon[step.key] ?? FileText;
}

export function PatientOrderTrackingPage() {
  const [selected, setSelected] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    async function fetchOrders() {
      const user = useAuthStore.getState().user;
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    }
    fetchOrders();

    const user = useAuthStore.getState().user;
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `user_id=eq.${user?.id}`
      }, (payload) => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const copyTracking = (num: string) => {
    navigator.clipboard.writeText(num).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Keep the selected order state in sync if it updates
  const activeSelected = selected ? orders.find(o => o.id === selected.id) || selected : null;

  if (activeSelected) {
    const trackSteps = buildOrderTrackingVerticalSteps(activeSelected);
    const trackIdx = getOrderTrackingVerticalIndex(activeSelected);
    const zoomSt = (activeSelected.zoom_status || activeSelected.zoomStatus || "not_requested") as string;
    const joinUrl =
      typeof activeSelected.zoom_join_url === "string" && /^https?:\/\//i.test(activeSelected.zoom_join_url)
        ? activeSelected.zoom_join_url
        : undefined;
    const showVideoCareCard =
      zoomSt === "requested" || zoomSt === "confirmed" || zoomSt === "rescheduled";

    return (
      <div className="max-w-lg mx-auto space-y-5">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          ← Back to Orders
        </button>
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Step 9 of 9 · Patient portal — real-time order progress
        </p>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-primary">{activeSelected.sub_brand || activeSelected.subBrand}</p>
            <h1 className="text-xl font-bold">{activeSelected.medication}</h1>
            <p className="text-xs text-muted-foreground">{activeSelected.id.substring(0,8)} · Ordered {activeSelected.ordered_date || activeSelected.orderedDate}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{activeSelected.dosage_instructions || activeSelected.dosageInstructions}</p>
          </div>
          <span className="font-extrabold text-primary shrink-0">{typeof activeSelected.amount === 'number' ? `$${activeSelected.amount}` : activeSelected.amount}</span>
        </div>

        {/* Pipeline stepper */}
        <Card>
          <CardContent className="p-5">
            <div className="space-y-0">
              {trackSteps.map((step, i) => {
                const Icon = trackingRowIcon(step);
                const done = i <= trackIdx;
                const active = i === trackIdx;
                const timelineEntry =
                  step.key !== "consultation"
                    ? (activeSelected.timeline || []).find((t: { status: string }) => t.status === step.key)
                    : undefined;
                const consultWhen =
                  step.key === "consultation"
                    ? activeSelected.consultation_time ||
                      activeSelected.consultationTime ||
                      activeSelected.zoom_rescheduled_time ||
                      null
                    : null;
                return (
                  <div key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all",
                        done ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {i < trackSteps.length - 1 && (
                        <div className={cn("w-0.5 flex-1 my-1 min-h-[20px]", done && i < trackIdx ? "bg-primary" : "bg-border")} />
                      )}
                    </div>
                    <div className={cn("pb-4 flex-1", i === trackSteps.length - 1 && "pb-0")}>
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-sm font-semibold", done ? "text-foreground" : "text-muted-foreground")}>
                          {step.label}
                          {active && <span className="ml-2 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold">CURRENT</span>}
                        </p>
                        {(timelineEntry?.date || consultWhen) && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {timelineEntry?.date || (typeof consultWhen === "string" ? consultWhen : "")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Video / sync visit */}
        {showVideoCareCard && (
          <Card
            className={cn(
              "shadow-sm border",
              zoomSt === "requested" ? "border-blue-200 bg-blue-50/50 animate-pulse" : "border-emerald-200 bg-emerald-50/50"
            )}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                    zoomSt === "requested" ? "bg-blue-100" : "bg-emerald-100"
                  )}
                >
                  <Video className={cn("h-6 w-6", zoomSt === "requested" ? "text-blue-600" : "text-emerald-600")} />
                </div>
                <div className="flex-1">
                  <h3
                    className={cn(
                      "text-sm font-black uppercase tracking-tight",
                      zoomSt === "requested" ? "text-blue-900" : "text-emerald-900"
                    )}
                  >
                    {zoomSt === "requested"
                      ? "Video consult requested"
                      : zoomSt === "rescheduled"
                        ? "Visit rescheduled"
                        : "Video visit scheduled"}
                  </h3>
                  <p
                    className={cn(
                      "text-xs mt-1 leading-relaxed",
                      zoomSt === "requested" ? "text-blue-700" : "text-emerald-800"
                    )}
                  >
                    {activeSelected.zoom_doctor_message ||
                      (joinUrl
                        ? "Use your meeting link below or open Appointments for details."
                        : "Your physician has requested a live video consultation to finalize your treatment plan.")}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    {joinUrl && (
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-10 rounded-xl text-xs font-bold gap-2"
                        onClick={() => window.open(joinUrl, "_blank", "noopener,noreferrer")}
                      >
                        Join meeting <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Link to="/patient/appointments" className="flex-1">
                      <Button
                        variant={joinUrl ? "outline" : "primary"}
                        className={cn(
                          "w-full h-10 rounded-xl text-xs font-bold gap-2",
                          joinUrl ? "" : "bg-blue-600 hover:bg-blue-700 text-white"
                        )}
                      >
                        {joinUrl ? "Appointments" : "View schedule"} <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Follow-up banner */}
        {activeSelected.status === 'follow_up' && (
          <Card className="border-amber-200 bg-amber-50 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-black text-amber-900 uppercase tracking-tight">Information Required</h3>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    {activeSelected.doctor_note || "Your physician needs some additional information to proceed with your treatment."}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Link to="/patient/messages" className="flex-1">
                      <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white h-10 rounded-xl text-xs font-bold gap-2">
                         Open Messages <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Doctor note */}
        {(activeSelected.doctor_note || activeSelected.doctorNote) && (
          <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Stethoscope className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{activeSelected.doctor || "Medical Provider"}</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">{activeSelected.doctor_note || activeSelected.doctorNote}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pharmacy update note */}
        {(activeSelected.pharmacy_note || activeSelected.pharmacyNote) && (
          <Card className="border-amber-200 bg-amber-50 shadow-sm rounded-2xl overflow-hidden mt-4">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Package className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Pharmacy Update</p>
                  <p className="text-xs font-bold text-amber-900 italic mt-1">"{activeSelected.pharmacy_note || activeSelected.pharmacyNote}"</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tracking */}
        {(activeSelected.tracking_number || activeSelected.tracking) && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" /> Shipment Tracking
                </p>
                <Badge variant="secondary" className="text-[10px]">{activeSelected.carrier || "Standard Courier"}</Badge>
              </div>
              <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                <span className="font-mono text-sm flex-1">{activeSelected.tracking_number || activeSelected.tracking}</span>
                <button onClick={() => copyTracking((activeSelected.tracking_number || activeSelected.tracking)!)}
                  className="text-muted-foreground hover:text-foreground transition-colors">
                  <Copy className="h-4 w-4" />
                </button>
                {copied && <span className="text-xs text-emerald-600 font-semibold">Copied!</span>}
              </div>
              {activeSelected.estimatedDelivery && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  Estimated delivery: <span className="font-semibold text-foreground">{activeSelected.estimatedDelivery}</span>
                </div>
              )}
              {activeSelected.trackingUrl && (
                <a href={activeSelected.trackingUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="w-full rounded-xl text-xs gap-1.5 mt-2">
                    <ExternalLink className="h-3.5 w-3.5" /> Track on {activeSelected.carrier}
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* Message doctor */}
        {activeSelected.doctor_id ? (
          <Link to={`/patient/messages?userId=${activeSelected.doctor_id}`}>
            <Button variant="outline" className="w-full rounded-xl gap-2 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30 transition-all">
              <MessageSquare className="h-4 w-4" /> Message {activeSelected.doctor || "Medical Provider"}
            </Button>
          </Link>
        ) : (
          <Button variant="outline" disabled className="w-full rounded-xl gap-2 opacity-50 cursor-not-allowed">
            <MessageSquare className="h-4 w-4" /> Message Medical Provider
            <span className="text-[10px] block opacity-70">(Assigned upon approval)</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold">My Orders</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track your treatment programs from intake to delivery</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Search by order ID or product..." />
      </div>

      <div className="space-y-3">
        {orders.map(order => {
          const vSteps = buildOrderTrackingVerticalSteps(order);
          const vIdx = getOrderTrackingVerticalIndex(order);
          const cur = vSteps[vIdx];
          const Icon = cur ? trackingRowIcon(cur) : Package;
          const progress = vSteps.length ? Math.round(((vIdx + 1) / vSteps.length) * 100) : 0;
          return (
            <Card key={order.id} className="hover:border-primary/40 transition-colors cursor-pointer"
              onClick={() => setSelected(order)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{order.sub_brand || order.subBrand}</p>
                        <p className="font-bold text-sm truncate">{order.medication}</p>
                        <p className="text-xs text-muted-foreground">{order.id.substring(0,8)} · Ordered {order.ordered_date || order.orderedDate || new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="font-bold text-primary text-sm shrink-0">{typeof order.amount === 'number' ? `$${order.amount}` : order.amount}</span>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-semibold text-primary">{cur?.label ?? "Processing"}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    {(order.tracking_number || order.tracking) && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Truck className="h-3 w-3" /> Tracking: <span className="font-mono">{order.tracking_number || order.tracking}</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

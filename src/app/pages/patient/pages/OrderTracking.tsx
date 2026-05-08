import { useState, useEffect } from "react";
import {
  Package, CheckCircle2, Stethoscope, Pill, Truck, ShoppingBag, Hourglass, FileText,
  ChevronRight, Search, MapPin, ExternalLink, MessageSquare, Copy
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { ORDER_STEPS, getStepIndex, type Order } from "../../../../lib/patient-store";
import { supabase } from "../../../../lib/supabaseClient";

const stepIcon: Record<string, any> = {
  order_submitted: FileText,
  doctor_reviewing: Stethoscope,
  rx_sent: Pill,
  shipped: Package,
  delivered: CheckCircle2,
};

const statusSteps = ORDER_STEPS.map(s => ({ ...s, icon: stepIcon[s.key] }));

export function PatientOrderTrackingPage() {
  const [selected, setSelected] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);

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
      }
    }
    fetchOrders();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
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
    const currentIdx = getStepIndex(activeSelected.status);
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          ← Back to Orders
        </button>

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
              {statusSteps.map((step, i) => {
                const done = i <= currentIdx;
                const active = i === currentIdx;
                const timelineEntry = activeSelected.timeline.find(t => t.status === step.key);
                return (
                  <div key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all",
                        done ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                        <step.icon className="h-4 w-4" />
                      </div>
                      {i < statusSteps.length - 1 && (
                        <div className={cn("w-0.5 flex-1 my-1 min-h-[20px]", done && i < currentIdx ? "bg-primary" : "bg-border")} />
                      )}
                    </div>
                    <div className={cn("pb-4 flex-1", i === statusSteps.length - 1 && "pb-0")}>
                      <div className="flex items-center justify-between">
                        <p className={cn("text-sm font-semibold", done ? "text-foreground" : "text-muted-foreground")}>
                          {step.label}
                          {active && <span className="ml-2 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold">CURRENT</span>}
                        </p>
                        {timelineEntry && <span className="text-[10px] text-muted-foreground">{timelineEntry.date}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

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
        <Button variant="outline" className="w-full rounded-xl gap-2">
          <MessageSquare className="h-4 w-4" /> Message {activeSelected.doctor}
        </Button>
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
          const currentIdx = getStepIndex(order.status);
          const step = statusSteps[currentIdx];
          const progress = Math.round(((currentIdx + 1) / statusSteps.length) * 100);
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
                          {step && <step.icon className="h-3.5 w-3.5 text-primary" />}
                          <span className="text-xs font-semibold text-primary">{step?.label}</span>
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

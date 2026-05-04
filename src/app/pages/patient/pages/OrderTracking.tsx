import { useState } from "react";
import {
  Package, CheckCircle2, Clock, Stethoscope, Pill, Truck,
  ChevronRight, Search, MapPin, ExternalLink, MessageSquare, Copy
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared";

type OrderStatus = "intake_submitted" | "doctor_review" | "prescribed" | "pharmacy" | "shipped" | "delivered";

const statusSteps: { key: OrderStatus; label: string; icon: any; desc: string }[] = [
  { key: "intake_submitted", label: "Intake Submitted", icon: CheckCircle2, desc: "Your health questionnaire was received" },
  { key: "doctor_review", label: "Doctor Review", icon: Stethoscope, desc: "A licensed physician is reviewing your case" },
  { key: "prescribed", label: "Prescribed", icon: Pill, desc: "Prescription approved and sent to pharmacy" },
  { key: "pharmacy", label: "At Pharmacy", icon: Package, desc: "Medication being prepared for shipment" },
  { key: "shipped", label: "Shipped", icon: Truck, desc: "On its way to you" },
  { key: "delivered", label: "Delivered", icon: CheckCircle2, desc: "Package delivered successfully" },
];

const orders = [
  {
    id: "RX-A7K2M9", product: "Weight Loss Program", category: "GLP-1 / Metabolic",
    status: "shipped" as OrderStatus, date: "May 19, 2026", amount: "$199",
    doctor: "Dr. Sarah Johnson", doctorNote: "Approved. Starting dose: 0.25mg weekly. Follow up in 4 weeks.",
    tracking: "1Z999AA10123456784", carrier: "UPS",
    trackingUrl: "https://www.ups.com/track",
    estimatedDelivery: "May 22, 2026",
    timeline: [
      { status: "intake_submitted", date: "May 19, 9:02 AM" },
      { status: "doctor_review", date: "May 19, 11:30 AM" },
      { status: "prescribed", date: "May 19, 2:15 PM" },
      { status: "pharmacy", date: "May 19, 4:00 PM" },
      { status: "shipped", date: "May 20, 8:45 AM" },
    ],
  },
  {
    id: "RX-B3N8P1", product: "ED Treatment", category: "Men's Health",
    status: "doctor_review" as OrderStatus, date: "May 20, 2026", amount: "$49",
    doctor: "Dr. Marcus Thorne", doctorNote: null,
    tracking: null, carrier: null, trackingUrl: null,
    estimatedDelivery: null,
    timeline: [
      { status: "intake_submitted", date: "May 20, 8:00 AM" },
      { status: "doctor_review", date: "May 20, 10:00 AM" },
    ],
  },
];

const statusOrder = statusSteps.map(s => s.key);

function getStepIndex(status: OrderStatus) {
  return statusOrder.indexOf(status);
}

export function PatientOrderTrackingPage() {
  const [selected, setSelected] = useState<typeof orders[0] | null>(null);
  const [copied, setCopied] = useState(false);

  const copyTracking = (num: string) => {
    navigator.clipboard.writeText(num).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (selected) {
    const currentIdx = getStepIndex(selected.status);
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          ← Back to Orders
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{selected.product}</h1>
            <p className="text-xs text-muted-foreground">{selected.id} · {selected.date}</p>
          </div>
          <span className="font-extrabold text-primary">{selected.amount}</span>
        </div>

        {/* Pipeline stepper */}
        <Card>
          <CardContent className="p-5">
            <div className="space-y-0">
              {statusSteps.map((step, i) => {
                const done = i <= currentIdx;
                const active = i === currentIdx;
                const timelineEntry = selected.timeline.find(t => t.status === step.key);
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
                          {active && <span className="ml-2 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold">NOW</span>}
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
        {selected.doctorNote && (
          <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Stethoscope className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{selected.doctor}</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">{selected.doctorNote}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tracking */}
        {selected.tracking && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" /> Shipment Tracking
                </p>
                <Badge variant="secondary" className="text-[10px]">{selected.carrier}</Badge>
              </div>
              <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                <span className="font-mono text-sm flex-1">{selected.tracking}</span>
                <button onClick={() => copyTracking(selected.tracking!)}
                  className="text-muted-foreground hover:text-foreground transition-colors">
                  <Copy className="h-4 w-4" />
                </button>
                {copied && <span className="text-xs text-emerald-600 font-semibold">Copied!</span>}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Estimated delivery: <span className="font-semibold text-foreground">{selected.estimatedDelivery}</span>
              </div>
              <a href={selected.trackingUrl!} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="w-full rounded-xl text-xs gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" /> Track on {selected.carrier}
                </Button>
              </a>
            </CardContent>
          </Card>
        )}

        {/* Message doctor */}
        <Button variant="outline" className="w-full rounded-xl gap-2">
          <MessageSquare className="h-4 w-4" /> Message {selected.doctor}
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
                      <div>
                        <p className="font-bold text-sm">{order.product}</p>
                        <p className="text-xs text-muted-foreground">{order.id} · {order.date}</p>
                      </div>
                      <span className="font-bold text-primary text-sm shrink-0">{order.amount}</span>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <step.icon className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-semibold text-primary">{step.label}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    {order.tracking && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Truck className="h-3 w-3" /> Tracking: <span className="font-mono">{order.tracking}</span>
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

import { Pill, RefreshCw, MapPin, Clock, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared";

const prescriptions = [
  { id: 1, name: "Lisinopril", dosage: "10mg", frequency: "Once daily", prescriber: "Dr. Sarah Johnson", refills: 3, daysLeft: 28, status: "active", pharmacy: "CVS Pharmacy" },
  { id: 2, name: "Metformin", dosage: "500mg", frequency: "Twice daily", prescriber: "Dr. Sarah Johnson", refills: 1, daysLeft: 5, status: "refill-ready", pharmacy: "Walgreens" },
  { id: 3, name: "Atorvastatin", dosage: "20mg", frequency: "Once nightly", prescriber: "Dr. Michael Chen", refills: 5, daysLeft: 14, status: "active", pharmacy: "CVS Pharmacy" },
  { id: 4, name: "Amoxicillin", dosage: "500mg", frequency: "Three times daily", prescriber: "Dr. Sarah Johnson", refills: 0, daysLeft: 0, status: "completed", pharmacy: "CVS Pharmacy" },
];

export function PrescriptionsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Prescriptions</h1>
        <Button size="sm" variant="outline" className="rounded-full text-xs gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Request Refill
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", count: 3, color: "text-primary" },
          { label: "Refill Ready", count: 1, color: "text-amber-600" },
          { label: "Completed", count: 1, color: "text-muted-foreground" },
        ].map((s, i) => (
          <Card key={i} className="border-none bg-muted/50">
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-extrabold ${s.color}`}>{s.count}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {prescriptions.map(rx => (
          <Card key={rx.id} className={cn("hover:border-primary/40 transition-colors",
            rx.status === "refill-ready" && "border-l-4 border-l-amber-500")}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center shrink-0",
                  rx.status === "active" ? "bg-primary/10" : rx.status === "refill-ready" ? "bg-amber-100 dark:bg-amber-950/40" : "bg-muted")}>
                  <Pill className={cn("h-5 w-5", rx.status === "active" ? "text-primary" : rx.status === "refill-ready" ? "text-amber-600" : "text-muted-foreground")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-sm">{rx.name} {rx.dosage}</p>
                    <Badge variant={rx.status === "active" ? "secondary" : rx.status === "refill-ready" ? "default" : "outline"}
                      className={cn("text-[10px] shrink-0", rx.status === "refill-ready" && "bg-amber-500 text-white")}>
                      {rx.status === "refill-ready" ? "Refill Ready" : rx.status.charAt(0).toUpperCase() + rx.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{rx.frequency} · {rx.prescriber}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {rx.status !== "completed" && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {rx.daysLeft > 0 ? `${rx.daysLeft} days left` : "Expired"}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{rx.pharmacy}
                    </div>
                    <span className="text-xs text-muted-foreground">{rx.refills} refills left</span>
                  </div>
                  {rx.status === "refill-ready" && (
                    <Button size="sm" className="mt-2 rounded-xl text-xs h-8 bg-amber-500 hover:bg-amber-600">
                      Request Refill
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

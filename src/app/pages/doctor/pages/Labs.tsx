import { TestTube, Clock, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared";

const labOrders = [
  { id: 1, patient: "Alice Thompson", tests: ["CBC", "CMP"], ordered: "May 12", status: "results-ready", priority: "routine" },
  { id: 2, patient: "Robert Wilson", tests: ["HbA1c", "Lipid Panel"], ordered: "May 14", status: "pending", priority: "urgent" },
  { id: 3, patient: "Sarah Miller", tests: ["TSH", "Free T4"], ordered: "May 15", status: "in-progress", priority: "routine" },
  { id: 4, patient: "Maria Garcia", tests: ["BNP", "Troponin", "ECG"], ordered: "May 16", status: "pending", priority: "stat" },
];

const statusConfig = {
  "results-ready": { color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950/40", icon: CheckCircle2, label: "Results Ready" },
  "pending": { color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/40", icon: Clock, label: "Pending" },
  "in-progress": { color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950/40", icon: TestTube, label: "In Progress" },
};

const priorityColors = { routine: "bg-muted text-muted-foreground", urgent: "bg-amber-100 text-amber-700", stat: "bg-red-100 text-red-700" };

export function DoctorLabsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Lab Requests</h1>
        <Button size="sm" className="rounded-full gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> New Order</Button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[{ label: "Results Ready", count: 1, color: "text-emerald-600" }, { label: "Pending", count: 2, color: "text-amber-600" }, { label: "In Progress", count: 1, color: "text-blue-600" }].map((s, i) => (
          <Card key={i} className="border-none bg-muted/50">
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-extrabold ${s.color}`}>{s.count}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-3">
        {labOrders.map(order => {
          const cfg = statusConfig[order.status as keyof typeof statusConfig];
          const Icon = cfg.icon;
          return (
            <Card key={order.id} className="hover:border-primary/40 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shrink-0", cfg.bg)}>
                    <Icon className={cn("h-5 w-5", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm">{order.patient}</p>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize", priorityColors[order.priority as keyof typeof priorityColors])}>{order.priority}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{order.tests.join(", ")} · Ordered {order.ordered}</p>
                    <Badge variant="outline" className={cn("text-[10px] mt-1.5", cfg.color)}>{cfg.label}</Badge>
                  </div>
                  {order.status === "results-ready" && (
                    <Button size="sm" className="rounded-xl text-xs shrink-0">Review</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

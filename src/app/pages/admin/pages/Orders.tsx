import { Package, Clock, CheckCircle2, XCircle, Search, Filter, Eye } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared";

const orders = [
  { id: "ORD-2026-0892", patient: "Alice Thompson", treatment: "General Consultation", doctor: "Dr. Sarah Johnson", date: "May 19, 2026", amount: "$75", status: "confirmed" },
  { id: "ORD-2026-0891", patient: "Robert Wilson", treatment: "Cardiology Assessment", doctor: "Dr. Michael Chen", date: "May 20, 2026", amount: "$200", status: "pending" },
  { id: "ORD-2026-0890", patient: "Sarah Miller", treatment: "Mental Health Session", doctor: "Dr. Liu Wei", date: "May 18, 2026", amount: "$120", status: "completed" },
  { id: "ORD-2026-0889", patient: "James Brown", treatment: "Dermatology Async", doctor: "Dr. Amira Hassan", date: "May 17, 2026", amount: "$60", status: "cancelled" },
  { id: "ORD-2026-0888", patient: "Maria Garcia", treatment: "Cardiology Assessment", doctor: "Dr. Michael Chen", date: "May 16, 2026", amount: "$200", status: "completed" },
];

const statusConfig = {
  confirmed: { color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950/40", icon: Clock },
  pending: { color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/40", icon: Clock },
  completed: { color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950/40", icon: CheckCircle2 },
  cancelled: { color: "text-red-600", bg: "bg-red-100 dark:bg-red-950/40", icon: XCircle },
};

export function AdminOrdersPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Orders</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-xs"><Filter className="h-3.5 w-3.5" /> Filter</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{ label: "Total Today", value: "47", color: "text-primary" }, { label: "Confirmed", value: "28", color: "text-blue-600" }, { label: "Completed", value: "15", color: "text-emerald-600" }, { label: "Cancelled", value: "4", color: "text-red-600" }].map((s, i) => (
          <Card key={i} className="border-none bg-muted/50"><CardContent className="p-3 text-center"><p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p><p className="text-[11px] text-muted-foreground">{s.label}</p></CardContent></Card>
        ))}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Search orders..." />
      </div>
      <div className="space-y-2">
        {orders.map(order => {
          const cfg = statusConfig[order.status as keyof typeof statusConfig];
          const Icon = cfg.icon;
          return (
            <Card key={order.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", cfg.bg)}>
                    <Icon className={cn("h-5 w-5", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-sm">{order.patient}</p>
                      <span className="text-xs font-bold text-primary">{order.amount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{order.treatment} · {order.doctor}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">{order.id}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">{order.date}</span>
                      <Badge variant="outline" className={cn("text-[10px] ml-1", cfg.color)}>{order.status}</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl shrink-0"><Eye className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

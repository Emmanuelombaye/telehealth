import { TrendingUp, CheckCircle2, Clock, Truck, AlertCircle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "../../../components/ui/shared";

export function PharmacyFulfillmentPage() {
  const orders = [
    { id: "ORD-9981", patient: "Alice Thompson", drug: "Lisinopril 10mg x30", pharmacist: "Dr. R. Lee", time: "10:14 AM", status: "ready" },
    { id: "ORD-9980", patient: "Robert Wilson", drug: "Metformin 500mg x60", pharmacist: "Dr. R. Lee", time: "09:52 AM", status: "processing" },
    { id: "ORD-9979", patient: "Maria Garcia", drug: "Atorvastatin 20mg x30", pharmacist: "Pending", time: "09:30 AM", status: "pending" },
    { id: "ORD-9978", patient: "James Brown", drug: "Sertraline 50mg x30", pharmacist: "Dr. S. Kim", time: "Yesterday", status: "dispatched" },
    { id: "ORD-9977", patient: "Emily Clark", drug: "Amoxicillin 500mg x21", pharmacist: "Dr. S. Kim", time: "Yesterday", status: "delivered" },
  ];

  const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
    pending: { label: "Pending Review", icon: AlertCircle, className: "bg-amber-100 text-amber-700" },
    processing: { label: "Processing", icon: Clock, className: "bg-blue-100 text-blue-700" },
    ready: { label: "Ready for Pickup", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700" },
    dispatched: { label: "Dispatched", icon: Truck, className: "bg-purple-100 text-purple-700" },
    delivered: { label: "Delivered", icon: CheckCircle2, className: "bg-slate-100 text-slate-600" },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="h-6 w-6 text-teal-500" /> Prescription Fulfillment</h1>
          <p className="text-sm text-muted-foreground">Track dispensing workflow from prescription to delivery.</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Pending", value: "12", color: "text-amber-500" },
          { label: "Processing", value: "8", color: "text-blue-500" },
          { label: "Ready Pickup", value: "5", color: "text-emerald-500" },
          { label: "Delivered Today", value: "47", color: "text-slate-500" },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-5 text-center">
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground font-semibold mt-1">{s.label}</p>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Order Queue</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:border-teal-500" placeholder="Search order or patient..." />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b"><tr>{["Order ID","Patient","Prescription","Pharmacist","Time","Status","Action"].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {orders.map((o, i) => {
                const s = statusConfig[o.status];
                return (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-bold">{o.id}</td>
                    <td className="px-5 py-3 font-semibold">{o.patient}</td>
                    <td className="px-5 py-3 text-muted-foreground">{o.drug}</td>
                    <td className="px-5 py-3 text-muted-foreground">{o.pharmacist}</td>
                    <td className="px-5 py-3 text-muted-foreground">{o.time}</td>
                    <td className="px-5 py-3"><span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${s.className}`}><s.icon className="h-3 w-3" />{s.label}</span></td>
                    <td className="px-5 py-3"><Button variant="outline" size="sm" className="h-7 text-xs">Update</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

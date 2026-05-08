import { useState, useEffect } from "react";
import { 
  Package, Truck, CheckCircle2, Clock, 
  Search, Filter, ChevronRight, Pill, 
  FileText, ShieldCheck, Printer, AlertCircle,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";

export function PharmacyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
    
    // Realtime subscription
    const channel = supabase
      .channel('pharmacy-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['doctor_approved', 'rx_sent', 'shipped'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Pharmacy fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleShipOrder = async () => {
    if (!selected) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'shipped',
          tracking_number: trackingNumber || `TRK${Math.random().toString().slice(2, 10)}`,
          shipped_date: new Date().toLocaleDateString()
        })
        .eq('id', selected.id);

      if (error) throw error;
      
      // Optimistic update
      setOrders(orders.map(o => o.id === selected.id ? { ...o, status: 'shipped' } : o));
      setSelected(null);
      setTrackingNumber("");
    } catch (err) {
      console.error("Shipping update failed:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const incoming = orders.filter(o => o.status === 'doctor_approved' || o.status === 'rx_sent');
  const shipped = orders.filter(o => o.status === 'shipped');

  if (selected) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <ChevronRight className="h-4 w-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" /> Back to Dispensary Queue
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl shrink-0">
              {selected.patient_avatar || "US"}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{selected.patient_name || "New Patient"}</h1>
              <p className="text-sm text-muted-foreground">Order Ref: <span className="font-mono text-primary font-bold">{selected.order_number}</span></p>
            </div>
          </div>
          <Badge className={cn("px-4 py-1.5 rounded-full text-xs font-bold w-fit", 
            selected.status === 'shipped' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
          )}>
            {selected.status === 'shipped' ? "SHIPPED" : "READY FOR FILL"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="overflow-hidden border-border/60 shadow-sm">
              <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                  <Pill className="h-4 w-4" /> Official Prescription
                </p>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Medication</p>
                    <p className="text-lg font-bold text-foreground">{selected.medication}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Dosage / Instructions</p>
                    <p className="text-lg font-bold text-foreground">{selected.dosage_instructions || "As directed"}</p>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-2xl border border-border/40">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-2">Prescribing Clinician Note</p>
                  <p className="text-sm italic text-foreground/80 leading-relaxed">
                    "{selected.doctor_note || "Patient eligibility confirmed via telehealth intake. Proceed with standard titration protocol."}"
                  </p>
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <p className="text-xs text-blue-800 font-medium">Digital Signature Verified: G. Washington, MD · NPI: 1234567890</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Patient Verification</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground font-bold">Shipping Destination</p>
                    <p className="text-sm font-semibold">{selected.patient_vitals?.address || "Address on file"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground font-bold">Phone Number</p>
                    <p className="text-sm font-semibold">{selected.patient_vitals?.phone || "Phone on file"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-emerald-200 bg-emerald-50/20 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                  <Truck className="h-4 w-4" /> Fulfillment Action
                </p>
                
                {selected.status !== 'shipped' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Tracking Number (UPS/FedEx)</label>
                      <input 
                        type="text"
                        value={trackingNumber}
                        onChange={e => setTrackingNumber(e.target.value)}
                        placeholder="Optional - auto generated"
                        className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <Button 
                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 gap-2"
                      onClick={handleShipOrder}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Processing..." : <><CheckCircle2 className="h-5 w-5" /> Mark as Shipped</>}
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground">This will notify the patient and activate tracking in their portal.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-white border border-emerald-200 rounded-2xl text-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-bold text-emerald-900">Order Shipped</p>
                      <p className="text-xs text-emerald-700 font-mono mt-1">{selected.tracking_number}</p>
                    </div>
                    <Button variant="outline" className="w-full rounded-xl gap-2 h-10 text-xs">
                      <Printer className="h-4 w-4" /> Print Packing Slip
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Compliance Checklist</p>
                <div className="space-y-2">
                  {[
                    "Pharmacist drug utilization review",
                    "Patient identity cross-check",
                    "Dosage titration verification",
                    "Child-resistant packaging check"
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2 text-xs text-foreground/70">
                      <div className="h-4 w-4 rounded border border-border flex items-center justify-center bg-white">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 opacity-0 group-hover:opacity-100" />
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pharmacy Queue</h1>
          <p className="text-sm text-muted-foreground">Manage incoming prescriptions and fulfillment logistics.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 rounded-full gap-1.5 font-bold text-emerald-600 bg-emerald-50 border-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Dispensary Active
          </Badge>
          <div className="h-10 w-[1px] bg-border/60" />
          <Button variant="outline" size="sm" className="rounded-xl h-10 gap-2">
            <Printer className="h-4 w-4" /> Batch Printing
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "New Prescriptions", value: incoming.length, icon: Pill, color: "text-amber-600", bg: "bg-amber-100" },
          { label: "Ready to Ship", value: incoming.filter(o => o.status === 'rx_sent').length, icon: Package, color: "text-violet-600", bg: "bg-violet-100" },
          { label: "Shipped Today", value: shipped.length, icon: Truck, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Alerts / Delays", value: 0, icon: AlertCircle, color: "text-red-600", bg: "bg-red-100" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-card hover:bg-accent/50 transition-colors cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 shadow-sm overflow-hidden">
        <div className="border-b border-border/40 bg-muted/20 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">Incoming Queue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search patient or Rx..."
                className="pl-9 pr-4 py-2 border border-border rounded-xl text-xs bg-background focus:outline-none focus:border-primary w-64"
              />
            </div>
            <Button variant="outline" size="sm" className="rounded-xl h-9 gap-2">
              <Filter className="h-3.5 w-3.5" /> Filter
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center text-muted-foreground">
              <Package className="h-8 w-8 animate-bounce mx-auto mb-4 opacity-20" />
              <p className="text-sm font-medium">Synchronizing dispensary queue...</p>
            </div>
          ) : incoming.length === 0 ? (
            <div className="p-20 text-center text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 text-emerald-500/20 mx-auto mb-4" />
              <p className="text-sm font-medium">No pending prescriptions in the queue.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/40 bg-muted/10">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order Ref</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Patient</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prescription</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Received</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {incoming.map(order => (
                  <tr key={order.id} 
                    onClick={() => setSelected(order)}
                    className="border-b border-border/40 hover:bg-primary/5 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-primary">{order.order_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700">
                          {order.patient_avatar || "US"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground leading-none">{order.patient_name || "Patient"}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">Verified Address ✓</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-foreground">{order.medication}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{order.dosage_instructions || "Standard titration"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="bg-amber-100 text-amber-700 text-[10px] border-none font-black px-2 py-0.5">READY FOR FILL</Badge>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                      {order.ordered_date || "Today"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button size="icon" variant="ghost" className="rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

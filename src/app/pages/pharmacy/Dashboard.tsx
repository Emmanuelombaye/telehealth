import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { 
  ClipboardList, Package, Truck, FlaskConical, Pill,
  AlertTriangle, CheckCircle2, Search, Filter,
  ArrowUpRight, Clock, Box, ShieldAlert, Activity,
  ChevronRight, MoreHorizontal, Printer, Mail
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../components/ui/shared.tsx";

export function PharmacyDashboard() {
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        console.error("Pharmacy fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();

    const channel = supabase
      .channel('pharmacy-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleShip = async (id: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'shipped',
          tracking_number: `TRK${Math.random().toString().slice(2, 10)}`,
          shipped_date: new Date().toLocaleDateString()
        })
        .eq('id', id);
      if (error) throw error;
      // Realtime subscription will handle the UI update
    } catch (err) {
      console.error("Shipping update failed:", err);
    }
  };

  // Compute metrics from real data
  const newRxCount = orders.filter(o => o.status === 'doctor_approved' || o.status === 'rx_sent').length;
  const readyToShipCount = orders.filter(o => o.status === 'shipped').length;
  
  const stats = [
    { label: "New Rx Requests", value: newRxCount.toString(), sub: "Real-time sync", icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Ready to Pack", value: orders.filter(o => o.status === 'rx_sent').length.toString(), sub: "Pharmacist check", icon: ShieldAlert, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Total Shipped", value: readyToShipCount.toString(), sub: "Dispensary total", icon: Package, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Live Queue", value: orders.length.toString(), sub: "Total records", icon: Activity, color: "text-violet-600", bg: "bg-violet-50" },
  ];

  const incomingRx = orders
    .filter(o => o.status !== 'shipped' && o.status !== 'delivered')
    .slice(0, 5)
    .map(o => ({
      rawId: o.id,
      id: o.order_number || o.id.slice(0, 8),
      patient: o.patient_name || "Unknown Patient",
      drug: o.medication || "Consultation Request",
      date: o.ordered_date || "Recent",
      status: o.status.replace('_', ' '),
      urgent: o.urgent || false
    }));

  const shippingQueue = orders
    .filter(o => o.status === 'shipped')
    .slice(0, 3)
    .map(o => ({
      id: o.order_number || o.id.slice(0, 8),
      patient: o.patient_name || "Patient",
      status: "In Transit"
    }));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#0A0D14]">Dispensary Dashboard</h1>
          <p className="text-slate-500 font-medium">VialsRX Pharmacy #4401 · Hub Hub</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-2xl gap-2 font-bold h-11" onClick={() => window.location.href='/pharmacy/orders'}>
            <Printer className="h-4 w-4" /> Full Queue
          </Button>
          <Button className="rounded-2xl gap-2 font-black uppercase text-xs tracking-widest h-11 bg-[#0A0D14] text-white">
            <FlaskConical className="h-4 w-4" /> Compounding Log
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-200/40 hover:scale-[1.02] transition-transform duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-300" />
              </div>
              <p className="text-3xl font-black text-[#0A0D14] mb-1">{stat.value}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-2">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Rx Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black text-[#0A0D14] flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> Incoming Prescriptions
            </h2>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {["all", "urgent", "flagged"].map(t => (
                <button 
                  key={t} 
                  onClick={() => setActiveTab(t)}
                  className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === t ? "bg-white text-[#0A0D14] shadow-sm" : "text-slate-400")}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {incomingRx.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold border-2 border-dashed border-slate-100 rounded-3xl">
                No incoming prescriptions.
              </div>
            ) : incomingRx.map((rx, i) => (
              <Card key={i} className={cn("hover:border-primary/40 transition-all cursor-pointer group", rx.urgent && "border-l-4 border-l-red-500")}>
                <CardContent className="p-5 flex items-center gap-6">
                  <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <Pill className="h-7 w-7 text-slate-400 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-[#0A0D14]">{rx.patient}</p>
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tight">{rx.id}</Badge>
                      {rx.urgent && <Badge className="bg-red-500 text-white text-[9px] font-black animate-pulse">URGENT</Badge>}
                    </div>
                    <p className="text-sm font-bold text-slate-500">{rx.drug}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-2">
                      <Clock className="h-3 w-3" /> Received {rx.date}
                    </p>
                  </div>
                    <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right mr-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                      <span className={cn("text-xs font-black capitalize", rx.status.includes('shipped') ? 'text-blue-600' : 'text-emerald-600')}>
                        {rx.status}
                      </span>
                    </div>
                    {rx.status.includes('doctor approved') || rx.status.includes('rx sent') ? (
                      <Button 
                        onClick={(e) => { e.stopPropagation(); handleShip(rx.rawId); }}
                        className="rounded-xl h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] tracking-widest"
                      >
                        SHIP
                      </Button>
                    ) : (
                      <Button variant="outline" size="icon" className="rounded-xl h-10 w-10" onClick={() => window.location.href='/pharmacy/orders'}>
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="ghost" onClick={() => window.location.href='/pharmacy/orders'} className="w-full h-12 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold hover:bg-slate-50">
              View All {orders.length} Dispensary Orders
            </Button>
          </div>
        </div>

        {/* Sidebar: Shipping & Inventory */}
        <div className="space-y-8">
          {/* Shipping Queue */}
          <div className="space-y-4">
             <h2 className="text-xl font-black text-[#0A0D14] flex items-center gap-2">
              <Truck className="h-5 w-5 text-emerald-600" /> Shipping Hub
            </h2>
            <Card className="border-none shadow-xl shadow-slate-200/40 bg-emerald-500 text-white">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Daily Logistics</p>
                <p className="text-2xl font-black mb-4">Pickup Hub</p>
                <div className="space-y-3">
                  {shippingQueue.length === 0 ? (
                    <p className="text-xs font-bold opacity-60 italic text-center py-4">No shipments active</p>
                  ) : shippingQueue.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/10 rounded-2xl border border-white/10">
                      <div>
                        <p className="text-[10px] font-black uppercase opacity-80">{s.id}</p>
                        <p className="text-sm font-bold truncate max-w-[120px]">{s.patient}</p>
                      </div>
                      <Badge className="bg-white text-emerald-600 text-[9px] font-black">{s.status}</Badge>
                    </div>
                  ))}
                </div>
                <Button onClick={() => window.location.href='/pharmacy/orders'} className="w-full mt-4 bg-white text-emerald-600 hover:bg-white/90 rounded-xl font-black uppercase text-[10px] tracking-widest h-10">
                  Manage Logistics
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Snapshot */}
          <div className="space-y-4">
             <h2 className="text-xl font-black text-[#0A0D14] flex items-center gap-2">
              <Box className="h-5 w-5 text-amber-600" /> Inventory
            </h2>
            <Card className="border-slate-100 shadow-lg">
              <CardContent className="p-4 space-y-4">
                {[
                  { name: "Semaglutide 0.25mg", stock: 12, total: 100, status: "Low Stock" },
                  { name: "Sildenafil 50mg", stock: 88, total: 100, status: "Healthy" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-black text-[#0A0D14]">{item.name}</p>
                      <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                        item.stock < 20 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600")}>
                        {item.status}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-1000", item.stock < 20 ? "bg-red-500" : "bg-emerald-500")}
                        style={{ width: `${(item.stock / item.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

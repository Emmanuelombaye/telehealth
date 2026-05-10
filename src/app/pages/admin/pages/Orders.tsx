import { useState, useEffect } from "react";
import { Truck, CheckCircle, Edit2, Search, Printer, ArrowDownUp, CloudDownload, RefreshCw, ChevronDown, Columns, Filter, MoreHorizontal, ArrowUpRight, Package, ShieldCheck, Activity } from "lucide-react";
import { Card, Button, Badge } from "../../../components/ui/shared.tsx";
import { AdminDataTable, StatusText } from "../../../components/ui/tables/AdminDataTable";
import { OrderStatus } from "../../../../lib/patient-store";
import { useAuthStore } from "../../../../lib/auth-store";
import { supabase } from "../../../../lib/supabaseClient";
import { cn } from "../../../components/ui/utils";
import { toast } from "sonner";

const statusStyles: Record<OrderStatus, string> = {
  "order_submitted": "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200",
  "account_created": "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-200",
  "id_verified": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200",
  "intake_completed": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200",
  "medical_review": "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200",
  "rx_sent": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200",
  "shipped": "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200",
  "delivered": "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400 border-slate-200",
  "refill_eligible": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200",
};

const statusLabels: Record<OrderStatus, string> = {
  "order_submitted": "Submitted",
  "account_created": "Registered",
  "id_verified": "ID Verified",
  "intake_completed": "Intake Done",
  "medical_review": "MD Review",
  "rx_sent": "Rx Sent",
  "shipped": "Shipped",
  "delivered": "Delivered",
  "refill_eligible": "Refill Opt",
};

export function AdminOrdersPage() {
  const { role, brandId } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({ patientName: "", medication: "", amount: "" });

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (role === 'brand_admin' && brandId) {
        // If brand admin, filter by their brand. 
        // Note: For demo purposes, if brandId is 'Brand A', we also show 'Peak Health' orders
        query = query.or(`sub_brand.eq."${brandId}",sub_brand.eq."Peak Health"`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCreateManual = async () => {
    if (!newOrder.patientName || !newOrder.medication) return;
    try {
      const orderRef = "MAN-" + Math.random().toString(36).substring(7).toUpperCase();
      const { error } = await supabase.from('orders').insert([{
        order_number: orderRef,
        patient_name: newOrder.patientName,
        medication: newOrder.medication,
        amount: newOrder.amount || "0",
        sub_brand: brandId || "Peak Health",
        status: "order_submitted",
        ordered_date: new Date().toLocaleDateString(),
        timeline: [{ status: "order_submitted", date: new Date().toLocaleString() }]
      }]);
      if (error) throw error;
      toast.success("Order Synced to Matrix", {
        description: `Reference ${orderRef} has been added to dispatch queue.`,
      });
      setIsManualModalOpen(false);
      setNewOrder({ patientName: "", medication: "", amount: "" });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    const headers = "Order #,Patient,Medication,Status,Amount\n";
    const rows = orders.map(o => `${o.order_number},${o.patient_name},${o.medication},${o.status},${o.amount}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    toast.info("Exporting Clinical Ledger", {
      description: "Your CSV file is being prepared for download.",
    });
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('orders_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [role, brandId]);
  
  const handleMarkShipped = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      const newTimeline = order && order.timeline 
        ? [...order.timeline, { status: 'shipped', date: new Date().toLocaleDateString() }] 
        : [{ status: 'shipped', date: new Date().toLocaleDateString() }];

      await supabase
        .from('orders')
        .update({ 
          status: 'shipped', 
          tracking_number: trackingNumber, 
          carrier: carrier,
          shipped_date: new Date().toLocaleDateString(),
          pharmacy_note: pharmacyNote,
          timeline: newTimeline
        })
        .eq('id', orderId);
      
      setEditingOrder(null);
      setTrackingNumber("");
      setPharmacyNote("");
      fetchOrders();
    } catch(err) {
      console.error(err);
    }
  };

  const handleUpdateNote = async (orderId: string, note: string) => {
    try {
       await supabase.from('orders').update({ pharmacy_note: note }).eq('id', orderId);
       fetchOrders();
    } catch (err) {
       console.error(err);
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      const newTimeline = order && order.timeline 
        ? [...order.timeline, { status: 'delivered', date: new Date().toLocaleDateString() }] 
        : [{ status: 'delivered', date: new Date().toLocaleDateString() }];

      await supabase
        .from('orders')
        .update({ 
          status: 'delivered',
          timeline: newTimeline 
        })
        .eq('id', orderId);
      
      fetchOrders();
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-10 relative">
      {/* Manual Entry Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-black italic uppercase tracking-tighter">Manual Dispatch Entry</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Create offline medication order</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Patient Name</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary/40 transition-all"
                  placeholder="e.g. John Doe"
                  value={newOrder.patientName}
                  onChange={e => setNewOrder({...newOrder, patientName: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Clinical Product</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary/40 transition-all"
                  placeholder="e.g. Semaglutide 0.25mg"
                  value={newOrder.medication}
                  onChange={e => setNewOrder({...newOrder, medication: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Amount ($)</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary/40 transition-all"
                  placeholder="e.g. 245"
                  type="number"
                  value={newOrder.amount}
                  onChange={e => setNewOrder({...newOrder, amount: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button 
                className="flex-1 rounded-xl h-12 bg-primary hover:bg-primary/90 text-white font-black uppercase italic tracking-widest"
                onClick={handleCreateManual}
              >
                Sync to Matrix
              </Button>
              <Button 
                variant="ghost" 
                className="flex-1 rounded-xl h-12 text-slate-400 font-black uppercase italic tracking-widest hover:bg-slate-50"
                onClick={() => setIsManualModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Order Dispatch</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
             Pharmacy Fulfillment & Global Logistics Matrix
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button 
            variant="outline" 
            className="rounded-xl border-border/60 gap-2 h-10 px-4 text-xs font-bold uppercase italic"
            onClick={handleExportCSV}
           >
             <CloudDownload className="h-4 w-4" /> Export CSV
           </Button>
           <Button 
            className="rounded-xl bg-primary hover:bg-primary/90 gap-2 h-10 px-4 text-xs font-bold uppercase italic shadow-lg shadow-primary/20"
            onClick={() => setIsManualModalOpen(true)}
           >
             <Plus className="h-4 w-4" /> Create Manual Entry
           </Button>
        </div>
      </div>

      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden bg-white rounded-[2.5rem]">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="SEARCH BY ORDER #, MRN, OR PATIENT..."
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold italic outline-none focus:border-primary/30 transition-all placeholder:text-slate-300"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-50 text-slate-400">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-50 text-slate-400">
              <RefreshCw className="h-4 w-4" onClick={fetchOrders} />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                <th className="py-5 px-8">Patient & ID</th>
                <th className="py-5 px-6">Source Brand</th>
                <th className="py-5 px-6">Clinical Product</th>
                <th className="py-5 px-6">Submission</th>
                <th className="py-5 px-6">Matrix Status</th>
                <th className="py-5 px-8 text-right">Fulfillment Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/40 transition-colors group">
                  <td className="py-5 px-8">
                    <div>
                      <div className="font-black text-sm italic uppercase tracking-tight text-slate-900">{item.patient_name || item.patientName}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="text-[10px] text-primary font-black uppercase tracking-tighter">ORD: {item.order_number || item.id.substring(0, 8)}</div>
                        {item.mrn && <div className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-black border border-emerald-100">MRN: {item.mrn}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <Badge variant="outline" className="bg-slate-50 border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500">
                      {item.sub_brand || item.subBrand || "Peak Health"}
                    </Badge>
                  </td>
                  <td className="py-5 px-6">
                    <div>
                      <div className="text-xs font-bold text-slate-900 uppercase italic">{item.medication}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{item.pharmacy || 'Default Pharmacy'}</div>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <div className="text-xs font-bold text-slate-500">{item.ordered_date || item.orderedDate || new Date(item.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="py-5 px-6">
                    <span className={cn("px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm", statusStyles[item.status as OrderStatus] || "bg-slate-100 border-slate-200")}>
                      {statusLabels[item.status as OrderStatus] || String(item.status).replace(/_/g, ' ')}
                    </span>
                    {item.pharmacy_note && (
                      <div className="mt-2 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg max-w-[150px]">
                        NOTE: {item.pharmacy_note}
                      </div>
                    )}
                  </td>
                  <td className="py-5 px-8 text-right">
                    <div className="flex flex-col items-end gap-2">
                      {item.status === "rx_sent" && editingOrder !== item.id && (
                        <Button 
                          size="sm" 
                          className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase italic gap-2 shadow-lg shadow-primary/10"
                          onClick={() => setEditingOrder(item.id)}
                        >
                          <Truck className="h-3.5 w-3.5" /> Manual Ship Override
                        </Button>
                      )}
                      
                      {editingOrder === item.id && (
                        <div className="flex flex-col gap-3 min-w-[280px] bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-lg">
                          <div className="flex gap-2">
                             <select 
                               className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold"
                               value={carrier}
                               onChange={(e) => setCarrier(e.target.value)}
                             >
                               <option>USPS</option>
                               <option>FedEx</option>
                               <option>UPS</option>
                               <option>DHL</option>
                             </select>
                             <input 
                              type="text" 
                              placeholder="Tracking #" 
                              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium outline-none focus:border-primary"
                              value={trackingNumber}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                            />
                          </div>
                          <textarea
                            placeholder="Pharmacy Note / Fulfillment Update (e.g. 'Backordered until Monday')"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-primary resize-none h-20"
                            value={pharmacyNote}
                            onChange={(e) => setPharmacyNote(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase flex-1 rounded-lg" onClick={() => handleMarkShipped(item.id)}>
                              Update & Disptach
                            </Button>
                            <Button size="sm" variant="ghost" className="h-9 text-[10px] font-black uppercase flex-1 rounded-lg" onClick={() => setEditingOrder(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {item.status === "shipped" && (
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-tight">
                             <Truck className="h-3 w-3 text-blue-500" /> {item.carrier}: <span className="font-mono text-slate-900">{item.tracking_number || item.tracking}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-9 px-4 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-[10px] font-black uppercase italic gap-2"
                            onClick={() => handleMarkDelivered(item.id)}
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Mark Delivered
                          </Button>
                        </div>
                      )}
                      
                      {item.status === "delivered" && (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest italic">Delivered</span>
                        </div>
                      )}

                      {item.status === "order_submitted" && (
                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Awaiting Clinical Authorization</div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Network Stats */}
      <div className="grid grid-cols-4 gap-6">
         {[
           { label: "Matrix Sync", value: "Online", color: "text-emerald-500", icon: Activity },
           { label: "Dispatch Load", value: "Optimal", color: "text-emerald-500", icon: Package },
           { label: "Encryption", value: "SHA-256", color: "text-slate-400", icon: ShieldCheck },
           { label: "Latency", value: "24ms", color: "text-slate-400", icon: Zap },
         ].map((stat, i) => (
           <Card key={i} className="border-none shadow-sm rounded-3xl bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className={cn("text-sm font-black italic uppercase", stat.color)}>{stat.value}</p>
                </div>
              </div>
           </Card>
         ))}
      </div>
    </div>
  );
}

function Plus(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function Zap(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 14.71 10.15 4h1.34l-3.32 8.71h5.83L7.85 20h-1.34l3.32-8.71H4z" />
    </svg>
  );
}

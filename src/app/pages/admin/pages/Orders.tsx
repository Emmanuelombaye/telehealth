import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { Truck, CheckCircle, Edit2, Search, Printer, ArrowDownUp, CloudDownload, RefreshCw, ChevronDown, Columns, Filter, MoreHorizontal, ArrowUpRight, Package, ShieldCheck, Activity, Zap } from "lucide-react";
import { Card, Button, Badge } from "../../../components/ui/shared.tsx";
import { AdminDataTable, StatusText } from "../../../components/ui/tables/AdminDataTable";
import { OrderStatus } from "../../../../lib/patient-store";
import { useAuthStore } from "../../../../lib/auth-store";
import { supabase } from "../../../../lib/supabaseClient";
import { ORDERS_ADMIN_NON_CLINICAL_SELECT, applyOrdersBrandScope } from "../../../../lib/adminScope";
import { logAdminAudit } from "../../../../lib/adminAudit";
import { cn } from "../../../components/ui/utils";
import { toast } from "sonner";
import { AdminScopeNotice } from "../../../components/admin/AdminScopeNotice.tsx";

const statusStyles: Record<OrderStatus, string> = {
  "order_submitted": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "account_created": "bg-slate-50 text-slate-400 border-slate-100",
  "id_verified": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "intake_completed": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "medical_review": "bg-amber-50 text-amber-700 border-amber-100",
  "rx_sent": "bg-[#0A2E1F] text-white border-[#0A2E1F]/10",
  "follow_up": "bg-rose-50 text-rose-800 border-rose-200",
  "shipped": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "delivered": "bg-slate-50 text-slate-400 border-slate-100",
  "refill_eligible": "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const statusLabels: Record<OrderStatus, string> = {
  "order_submitted": "Submitted",
  "account_created": "Registered",
  "id_verified": "Verified",
  "intake_completed": "Intake",
  "medical_review": "Clinical review",
  "rx_sent": "Prescribed",
  "follow_up": "Follow-up",
  "shipped": "Dispatched",
  "delivered": "Delivered",
  "refill_eligible": "Refill",
};

export function AdminOrdersPage() {
  const location = useLocation();
  const scopeVariant = location.pathname.startsWith("/superadmin") ? "platform" : "brand";
  const { role, brandId } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({ patientName: "", medication: "", amount: "" });
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("USPS");
  const [pharmacyNote, setPharmacyNote] = useState("");

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      let query = supabase
        .from('orders')
        .select(ORDERS_ADMIN_NON_CLINICAL_SELECT)
        .order('created_at', { ascending: false });

      query = applyOrdersBrandScope(query, role, brandId);

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
      await logAdminAudit({
        action: "order.manual_create",
        targetType: "order",
        targetId: orderRef,
        detail: { patient: newOrder.patientName, medication: newOrder.medication },
      });
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

  const handleExportCSV = async () => {
    const headers = "Order #,Patient,Medication,Status,Amount\n";
    const rows = orders.map(o => `${o.order_number},${o.patient_name},${o.medication},${o.status},${o.amount}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    await logAdminAudit({
      action: "order.export_csv",
      targetType: "orders",
      detail: { row_count: orders.length },
    });
    toast.info("Exporting operations ledger", {
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

      await logAdminAudit({
        action: "order.mark_shipped",
        targetType: "order",
        targetId: order?.order_number || String(orderId),
        detail: { carrier, tracking: trackingNumber },
      });
      
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
       await logAdminAudit({
         action: "order.pharmacy_note_update",
         targetType: "order",
         targetId: String(orderId),
         detail: { note_len: note.length },
       });
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

      await logAdminAudit({
        action: "order.mark_delivered",
        targetType: "order",
        targetId: order?.order_number || String(orderId),
      });
      
      fetchOrders();
    } catch(err) {
      console.error(err);
    }
  };

  return (
      <div className="max-w-[1600px] mx-auto space-y-6 pb-10 relative animate-in fade-in duration-1000">
      <AdminScopeNotice variant={scopeVariant} />

      {/* Manual Entry Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A2E1F]/60 backdrop-blur-md p-4">
          <div className="bg-white border border-slate-50 rounded-[3rem] w-full max-w-lg p-12 shadow-2xl animate-in fade-in zoom-in duration-500">
            <div className="flex items-center gap-6 mb-10">
              <div className="h-16 w-16 rounded-3xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-inner">
                <Package className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-[#0A2E1F]">Manual Dispatch</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Operational fulfillment · admin record</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Patient Identity</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold text-[#0A2E1F] outline-none focus:border-emerald-500/30 transition-all placeholder:text-slate-200"
                  placeholder="Full Legal Name"
                  value={newOrder.patientName}
                  onChange={e => setNewOrder({...newOrder, patientName: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Medication label (SKU / display)</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold text-[#0A2E1F] outline-none focus:border-emerald-500/30 transition-all placeholder:text-slate-200"
                  placeholder="e.g. Tirzepatide 2.5mg"
                  value={newOrder.medication}
                  onChange={e => setNewOrder({...newOrder, medication: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Transaction Value ($)</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold text-[#0A2E1F] outline-none focus:border-emerald-500/30 transition-all placeholder:text-slate-200"
                  placeholder="Value in USD"
                  type="number"
                  value={newOrder.amount}
                  onChange={e => setNewOrder({...newOrder, amount: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-12">
              <Button 
                className="flex-1 rounded-[1.5rem] h-16 bg-[#0A2E1F] text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-emerald-900/10"
                onClick={handleCreateManual}
              >
                Sync to Ledger
              </Button>
              <Button 
                variant="ghost" 
                className="flex-1 rounded-[1.5rem] h-16 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-50"
                onClick={() => setIsManualModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-6">
           <div className="h-16 w-16 rounded-2xl bg-[#22c55e]/10 flex items-center justify-center border border-[#22c55e]/20">
              <Package size={28} className="text-[#22c55e]" />
           </div>
           <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter text-[#0A2E1F]">Manage orders</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">
                 Fulfillment, refunds, and logistics — non-clinical fields only
              </p>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <Button 
            variant="outline" 
            className="rounded-2xl border-slate-200 gap-3 h-12 px-6 text-[10px] font-black uppercase italic tracking-widest hover:bg-slate-50 transition-all"
            onClick={handleExportCSV}
           >
             <CloudDownload className="h-4 w-4" /> Export Ledger
           </Button>
           <Button 
            className="rounded-2xl bg-[#0A2E1F] hover:bg-emerald-950 gap-3 h-12 px-6 text-[10px] font-black uppercase italic tracking-widest shadow-xl shadow-emerald-900/10 text-white"
            onClick={() => setIsManualModalOpen(true)}
           >
             <Plus className="h-4 w-4" /> Manual Entry
           </Button>
        </div>
      </div>

      <Card className="border-none shadow-3xl shadow-slate-200/50 overflow-hidden bg-white rounded-[3rem]">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between gap-6 bg-slate-50/20">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
            <input
              type="text"
              placeholder="FILTER COMMAND CENTER BY ORDER, MRN, OR IDENTITY..."
              className="w-full pl-16 pr-6 py-4 bg-white border border-slate-100 rounded-3xl text-[11px] font-black italic outline-none focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-slate-200 uppercase tracking-widest"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="h-12 w-12 rounded-2xl hover:bg-white text-slate-400 border border-transparent hover:border-slate-100">
              <Filter className="h-5 w-5" />
            </Button>
            <Button variant="ghost" className="h-12 w-12 rounded-2xl hover:bg-white text-slate-400 border border-transparent hover:border-slate-100" onClick={fetchOrders}>
              <RefreshCw className="h-5 w-5" />
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
                        <div className="text-[10px] text-primary font-black uppercase tracking-tighter">ORD: {item.order_number || (item.id ? String(item.id).substring(0, 8) : "N/A")}</div>
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
                  <td className="py-8 px-8 text-right">
                    <div className="flex flex-col items-end gap-3">
                      {item.status === "rx_sent" && editingOrder !== item.id && (
                        <Button 
                          className="h-10 px-6 rounded-2xl bg-[#0A2E1F] hover:bg-emerald-950 text-white text-[10px] font-black uppercase italic gap-3 shadow-xl shadow-emerald-900/10 transition-all"
                          onClick={() => setEditingOrder(item.id)}
                        >
                          <Truck className="h-4 w-4" /> Manual Bridge Update
                        </Button>
                      )}
                      
                      {editingOrder === item.id && (
                        <div className="flex flex-col gap-6 min-w-[360px] bg-white p-8 rounded-[2rem] border border-emerald-100 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-500">
                          <div className="flex items-center gap-4 mb-2">
                             <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-inner">
                               <RefreshCw className="h-5 w-5 text-emerald-600 animate-spin" />
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-[#0A2E1F] uppercase tracking-[0.2em]">Clinical Logistics</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Pharmacy Sync Terminal</p>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                             <select 
                               className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-black text-[#0A2E1F] uppercase outline-none focus:border-emerald-500/30 transition-all appearance-none"
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
                              placeholder="TRACKING ID" 
                              className="col-span-2 bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-xs font-bold text-[#0A2E1F] outline-none focus:border-emerald-500/30 placeholder:text-slate-200 transition-all uppercase tracking-widest"
                              value={trackingNumber}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                            />
                          </div>
                          <textarea
                            placeholder="FULFILLMENT NOTES (COMMIT TO CLINICAL LEDGER)"
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 text-xs font-medium text-[#0A2E1F] outline-none focus:border-emerald-500/30 resize-none h-32 placeholder:text-slate-200 transition-all"
                            value={pharmacyNote}
                            onChange={(e) => setPharmacyNote(e.target.value)}
                          />
                          <div className="flex gap-4">
                            <Button className="h-14 bg-[#0A2E1F] hover:bg-emerald-950 text-white text-[10px] font-black uppercase tracking-widest flex-1 rounded-2xl shadow-xl shadow-emerald-900/10" onClick={() => handleMarkShipped(item.id)}>
                              Commit Dispatch
                            </Button>
                            <Button variant="ghost" className="h-14 text-slate-400 text-[10px] font-black uppercase tracking-widest flex-1 rounded-2xl hover:bg-slate-50" onClick={() => setEditingOrder(null)}>
                              Abort
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

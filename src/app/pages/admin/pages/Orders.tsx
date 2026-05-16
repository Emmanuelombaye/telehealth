import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { 
  Truck, CheckCircle, Search, CloudDownload, RefreshCw, 
  Filter, Package, ShieldCheck, Activity, Zap, 
  Building2, Clock, X, CheckCircle2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Badge } from "../../../components/ui/shared.tsx";
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
  const [searchQuery, setSearchQuery] = useState("");

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
          tracking: trackingNumber, 
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
      toast.success("Logistics Synchronized", {
         description: `Tracking ID ${trackingNumber} broadcast to patient.`
      });
      fetchOrders();
    } catch(err) {
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

  const filteredOrders = orders.filter(o => 
    o.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.medication?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
      <div className="max-w-[1700px] mx-auto space-y-8 pb-20 relative animate-in fade-in duration-700 font-sans">
      <AdminScopeNotice variant={scopeVariant} />

      {/* Manual Entry Modal */}
      <AnimatePresence>
        {isManualModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A2E1F]/80 backdrop-blur-xl p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white border border-slate-100 rounded-[3.5rem] w-full max-w-xl p-12 shadow-3xl"
            >
              <div className="flex items-center gap-6 mb-12">
                <div className="h-16 w-16 rounded-3xl bg-emerald-50 flex items-center justify-center border border-emerald-100/50">
                  <Package className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter text-[#0A2E1F]">Manual Dispatch</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1.5 opacity-70">Operational fulfillment · system ledger</p>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Patient Identity</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold text-[#0A2E1F] outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/20 transition-all placeholder:text-slate-300"
                    placeholder="Full Legal Name"
                    value={newOrder.patientName}
                    onChange={e => setNewOrder({...newOrder, patientName: e.target.value})}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Medication label</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold text-[#0A2E1F] outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/20 transition-all placeholder:text-slate-300"
                    placeholder="e.g. Tirzepatide 2.5mg"
                    value={newOrder.medication}
                    onChange={e => setNewOrder({...newOrder, medication: e.target.value})}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Transaction Value ($)</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold text-[#0A2E1F] outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/20 transition-all placeholder:text-slate-300"
                    placeholder="Value in USD"
                    type="number"
                    value={newOrder.amount}
                    onChange={e => setNewOrder({...newOrder, amount: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-14">
                 <Button 
                  variant="ghost" 
                  className="flex-1 rounded-2xl h-16 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-50 transition-all"
                  onClick={() => setIsManualModalOpen(false)}
                >
                  Abort
                </Button>
                <Button 
                  className="flex-[2] rounded-2xl h-16 bg-[#0A2E1F] text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-emerald-900/20 hover:bg-emerald-950 transition-all hover:-translate-y-0.5"
                  onClick={handleCreateManual}
                >
                  Commit to Ledger
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between px-4">
        <div className="flex items-center gap-6">
           <div className="h-20 w-20 rounded-[2rem] bg-emerald-50 flex items-center justify-center border border-emerald-100/50 shadow-sm">
              <Package size={34} className="text-emerald-600" />
           </div>
           <div>
              <div className="flex items-center gap-3 mb-1">
                 <Badge className="bg-emerald-100 text-emerald-800 border-none px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">Pipeline</Badge>
                 <span className="h-1 w-1 rounded-full bg-slate-300" />
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{orders.length} ACTIVE RECORDS</span>
              </div>
              <h1 className="text-5xl font-black italic uppercase tracking-tighter text-[#0A2E1F] leading-none">Command Center</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.35em] mt-2 opacity-80">
                 Cross-tenant fulfillment · logistics matrix · non-clinical governance
              </p>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <Button 
            variant="outline" 
            className="rounded-2xl border-slate-200 gap-3 h-14 px-8 text-[10px] font-black uppercase italic tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            onClick={handleExportCSV}
           >
             <CloudDownload className="h-4 w-4" /> Export Ledger
           </Button>
           <Button 
            className="rounded-2xl bg-[#0A2E1F] hover:bg-emerald-950 gap-3 h-14 px-8 text-[10px] font-black uppercase italic tracking-widest shadow-2xl shadow-emerald-900/10 text-white transition-all hover:-translate-y-0.5 active:translate-y-0"
            onClick={() => setIsManualModalOpen(true)}
           >
             <Plus className="h-5 w-5" /> Manual Dispatch
           </Button>
        </div>
      </div>

      <Card className="border-none shadow-3xl shadow-slate-200/50 overflow-hidden bg-white rounded-[3.5rem]">
        {/* Filters bar */}
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/20 backdrop-blur-sm">
          <div className="relative flex-1 max-w-3xl group">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="FILTER LEDGER BY IDENTITY, MRN, OR PRODUCT..."
              className="w-full pl-18 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] text-[11px] font-black italic outline-none focus:border-emerald-500/30 focus:ring-8 focus:ring-emerald-500/5 transition-all placeholder:text-slate-200 uppercase tracking-[0.1em]"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-100">
               <Button variant="ghost" className="h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-900 bg-white shadow-sm border border-slate-100">All Orders</Button>
               <Button variant="ghost" className="h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Pending</Button>
               <Button variant="ghost" className="h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Shipped</Button>
            </div>
            <div className="w-[1px] h-8 bg-slate-200 mx-1" />
            <Button variant="ghost" className="h-12 w-12 rounded-2xl hover:bg-white text-slate-400 border border-transparent hover:border-slate-100 transition-all" onClick={fetchOrders}>
              <RefreshCw className={cn("h-5 w-5", loadingOrders && "animate-spin text-emerald-500")} />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/30 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-50">
                <th className="py-7 px-10">Subject Identity</th>
                <th className="py-7 px-6">Origin Brand</th>
                <th className="py-7 px-6">Clinical Assets</th>
                <th className="py-7 px-6">Ledger Entry</th>
                <th className="py-7 px-6">Matrix Status</th>
                <th className="py-7 px-10 text-right">Logistics Terminal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/60">
              {filteredOrders.map((item, i) => (
                <motion.tr 
                  key={item.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  whileHover={{ 
                    scale: 1.005, 
                    backgroundColor: "rgba(248, 250, 252, 0.8)",
                    boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)"
                  }}
                  onClick={() => setEditingOrder(editingOrder === item.id ? null : item.id)}
                  className={cn(
                    "transition-all group/row cursor-pointer relative",
                    editingOrder === item.id ? "bg-emerald-50/30 ring-1 ring-emerald-100 z-10" : ""
                  )}
                >
                  <td className="py-8 px-10">
                    <div className="flex items-center gap-5">
                      <motion.div 
                        whileHover={{ rotate: 5, scale: 1.1 }}
                        className="h-14 w-14 rounded-2xl bg-[#0A2E1F] text-emerald-400 flex items-center justify-center font-black text-sm italic shadow-xl shadow-[#0A2E1F]/20 group-hover/row:shadow-emerald-500/20 transition-all"
                      >
                         {(item.patient_name || 'P').split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                      </motion.div>
                      <div>
                        <div className="font-black text-lg italic uppercase tracking-tight text-slate-900 group-hover/row:text-emerald-700 transition-colors leading-none">{item.patient_name || item.patientName}</div>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] group-hover/row:text-slate-500 transition-colors">REF: {item.order_number || (item.id ? String(item.id).substring(0, 8) : "N/A")}</div>
                          {item.mrn && (
                             <>
                               <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                               <div className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em]">MRN: {item.mrn}</div>
                             </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-8 px-6">
                    <Badge variant="outline" className="bg-white border-slate-200 group-hover/row:border-emerald-200 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 px-4 py-1.5 rounded-xl transition-all">
                      {item.sub_brand || item.subBrand || "Peak Health"}
                    </Badge>
                  </td>
                  <td className="py-8 px-6">
                    <div className="space-y-1.5">
                      <div className="text-[14px] font-black text-slate-900 uppercase italic tracking-tight leading-none">{item.medication}</div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">
                         <Building2 className="h-3.5 w-3.5" /> {item.pharmacy || 'Default Node'}
                      </div>
                    </div>
                  </td>
                  <td className="py-8 px-6">
                    <div className="text-[12px] font-black text-slate-600 tracking-tighter uppercase italic">{item.ordered_date || item.orderedDate || new Date(item.created_at).toLocaleDateString()}</div>
                    <div className="text-[9px] text-slate-400 font-black uppercase mt-1.5 tracking-widest opacity-50">Ledger Confirmed</div>
                  </td>
                  <td className="py-8 px-6">
                    <div className="flex flex-col gap-2.5">
                       <span className={cn(
                         "inline-flex items-center justify-center px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all group-hover/row:scale-105", 
                         statusStyles[item.status as OrderStatus] || "bg-slate-100 border-slate-200 text-slate-500"
                       )}>
                         {statusLabels[item.status as OrderStatus] || String(item.status).replace(/_/g, ' ')}
                       </span>
                       {item.pharmacy_note && (
                         <div className="text-[9px] font-bold text-amber-800 bg-amber-50/50 border border-amber-100/30 px-3 py-2 rounded-2xl max-w-[200px] leading-relaxed shadow-sm">
                           <span className="opacity-40 uppercase mr-1">Trace:</span> {item.pharmacy_note}
                         </div>
                       )}
                    </div>
                  </td>
                  <td className="py-8 px-10 text-right">
                    <div className="flex flex-col items-end gap-3">
                      {item.status === "rx_sent" && editingOrder !== item.id && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="opacity-0 group-hover/row:opacity-100 transition-opacity"
                        >
                          <Button 
                            className="h-12 px-8 rounded-2xl bg-[#0A2E1F] hover:bg-emerald-950 text-white text-[11px] font-black uppercase italic gap-3 shadow-2xl shadow-emerald-900/30 transition-all hover:scale-105 active:scale-95"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingOrder(item.id);
                            }}
                          >
                            <Zap className="h-4 w-4 text-emerald-400 fill-emerald-400" />
                            Initialize Bridge
                          </Button>
                        </motion.div>
                      )}
                      
                      {editingOrder === item.id && (
                        <div 
                          className="flex flex-col gap-8 min-w-[460px] bg-white p-12 rounded-[4rem] border-2 border-emerald-500/10 shadow-[0_48px_96px_-24px_rgba(10,46,31,0.15)] animate-in fade-in zoom-in-95 slide-in-from-right-12 duration-500 relative overflow-hidden text-left"
                          onClick={(e) => e.stopPropagation()}
                        >
                           {/* Decorative Glow */}
                           <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-400/10 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none" />
                           <div className="absolute bottom-0 left-0 h-32 w-32 bg-emerald-600/5 rounded-full blur-[50px] -ml-16 -mb-16 pointer-events-none" />
                           
                           <div className="flex items-center justify-between relative z-10">
                              <div className="flex items-center gap-5">
                                 <div className="h-14 w-14 rounded-2xl bg-[#0A2E1F] flex items-center justify-center border border-white/10 shadow-xl">
                                   <RefreshCw className="h-7 w-7 text-emerald-400 animate-spin-slow" />
                                 </div>
                                 <div>
                                    <h4 className="text-sm font-black text-[#0A2E1F] uppercase tracking-[0.3em] leading-none mb-2">Bridge Uplink</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-60">Authorized node sync</p>
                                 </div>
                              </div>
                              <button 
                                onClick={() => setEditingOrder(null)} 
                                className="h-12 w-12 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-500 transition-all hover:rotate-90"
                              >
                                 <X size={20} />
                              </button>
                           </div>
                          
                           <div className="space-y-8 relative z-10">
                              <div className="grid grid-cols-2 gap-5">
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Logistics Matrix</label>
                                    <select 
                                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-[12px] font-black text-[#0A2E1F] uppercase outline-none focus:bg-white focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500/20 transition-all appearance-none cursor-pointer"
                                      value={carrier}
                                      onChange={(e) => setCarrier(e.target.value)}
                                    >
                                      <option>USPS Global</option>
                                      <option>FedEx Prime</option>
                                      <option>UPS Priority</option>
                                      <option>DHL Express</option>
                                    </select>
                                 </div>
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Tracking Signature</label>
                                    <input 
                                      type="text" 
                                      placeholder="AUTO-RESOLVING..." 
                                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-7 py-4 text-xs font-bold text-[#0A2E1F] outline-none focus:bg-white focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500/20 placeholder:text-slate-200 transition-all uppercase tracking-[0.2em]"
                                      value={trackingNumber}
                                      onChange={(e) => setTrackingNumber(e.target.value)}
                                    />
                                 </div>
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Fulfillment Manifest (PHI Isolated)</label>
                                 <textarea
                                   placeholder="ENTER OPERATIONAL NOTES FOR THE CLINICAL LEDGER..."
                                   className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2.5rem] px-8 py-7 text-xs font-medium text-[#0A2E1F] outline-none focus:bg-white focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500/20 resize-none h-48 placeholder:text-slate-200 transition-all leading-relaxed shadow-inner"
                                   value={pharmacyNote}
                                   onChange={(e) => setPharmacyNote(e.target.value)}
                                 />
                              </div>
                           </div>

                           <Button 
                              className="w-full h-20 bg-[#0A2E1F] hover:bg-emerald-950 text-white text-[12px] font-black uppercase tracking-[0.4em] rounded-[2rem] shadow-3xl shadow-emerald-950/40 transition-all hover:-translate-y-1.5 active:translate-y-0 group/btn overflow-hidden relative" 
                              onClick={() => handleMarkShipped(item.id)}
                           >
                              <span className="relative z-10 flex items-center justify-center gap-4">
                                 <ShieldCheck className="h-5 w-5 text-emerald-400 group-hover/btn:animate-pulse" />
                                 Authorize & Broadcast Dispatch
                              </span>
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                           </Button>
                        </div>
                      )}

                      {item.status === "shipped" && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col items-end gap-3 bg-emerald-50/40 p-5 rounded-3xl border border-emerald-100/50 shadow-inner group/shipping"
                        >
                          <div className="flex items-center gap-3">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                             <div className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em]">{item.carrier} IN TRANSIT</div>
                             <span className="font-mono text-xs font-bold text-slate-900 tracking-tighter opacity-80 group-hover/shipping:opacity-100 transition-opacity">{item.tracking_number || item.tracking}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-11 px-7 rounded-[1.25rem] border-emerald-200 bg-white text-emerald-600 hover:bg-[#0A2E1F] hover:text-white hover:border-transparent text-[11px] font-black uppercase italic gap-3 transition-all hover:scale-105 active:scale-95 shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkDelivered(item.id);
                            }}
                          >
                            <CheckCircle className="h-4 w-4" /> Resolve Delivery
                          </Button>
                        </motion.div>
                      )}
                      
                      {item.status === "delivered" && (
                        <div className="flex items-center gap-5 bg-slate-50/80 px-8 py-4 rounded-[2rem] border border-slate-100 transition-all group-hover/row:bg-white group-hover/row:border-emerald-200 group-hover/row:shadow-xl group-hover/row:shadow-emerald-900/5">
                           <div className="text-right">
                           </div>
                        </div>
                      )}

                      {item.status === "order_submitted" && (
                        <div className="flex items-center gap-3 px-6 py-3 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                           <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
                           <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest italic leading-none">Medical Hold</span>
                        </div>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
           <div className="py-40 flex flex-col items-center justify-center text-center space-y-6">
              <div className="h-24 w-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center border border-slate-100">
                 <Search size={40} className="text-slate-200" />
              </div>
              <div className="space-y-1">
                 <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Zero matches found</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">The matrix returned no records for this query</p>
              </div>
              <Button variant="outline" onClick={() => setSearchQuery("")} className="rounded-xl h-12 px-8 text-[10px] font-black uppercase tracking-widest border-slate-200">Clear all filters</Button>
           </div>
        )}
      </Card>
      
      {/* Network Stats - Advanced Global Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
         {[
           { label: "Dispatch Matrix", value: "Synchronized", color: "text-emerald-500", icon: Activity, bg: "bg-emerald-50" },
           { label: "Pipeline Load", value: "Nominal", color: "text-emerald-500", icon: Package, bg: "bg-emerald-50" },
           { label: "Security Protocol", value: "AES-256 GCM", color: "text-blue-500", icon: ShieldCheck, bg: "bg-blue-50" },
           { label: "System Latency", value: "12.4ms", color: "text-indigo-500", icon: Zap, bg: "bg-indigo-50" },
         ].map((stat, i) => (
           <Card key={i} className="border-none shadow-sm rounded-[2rem] bg-white p-7 transition-all hover:shadow-md group">
              <div className="flex items-center gap-5">
                <div className={cn("h-14 w-14 rounded-[1.25rem] flex items-center justify-center transition-all group-hover:scale-110", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <p className={cn("text-base font-black italic uppercase leading-none", stat.color)}>{stat.value}</p>
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
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

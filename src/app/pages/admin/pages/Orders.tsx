import { useState, useEffect } from "react";
import { Truck, CheckCircle, Edit2 } from "lucide-react";
import { Button } from "../../../components/ui/shared.tsx";
import { AdminDataTable, StatusText } from "../../../components/ui/tables/AdminDataTable";
import { OrderStatus } from "../../../../lib/patient-store";
import { supabase } from "../../../../lib/supabaseClient";

const statusStyles: Record<OrderStatus, string> = {
  "order_submitted": "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200",
  "doctor_reviewing": "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-200",
  "rx_sent": "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200",
  "shipped": "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200",
  "delivered": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200"
};

const statusLabels: Record<OrderStatus, string> = {
  "order_submitted": "Pending Intake",
  "doctor_reviewing": "In Review",
  "rx_sent": "Sent to Pharmacy",
  "shipped": "Shipped",
  "delivered": "Delivered"
};

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

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
        console.error("Error fetching orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    }
    fetchOrders();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("USPS");

  const handleMarkShipped = async (orderId: string) => {
    try {
      await supabase
        .from('orders')
        .update({ status: 'shipped', tracking: trackingNumber, carrier: carrier })
        .eq('id', orderId);
      
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'shipped', tracking: trackingNumber, carrier } : o));
      setEditingOrder(null);
      setTrackingNumber("");
    } catch(err) {
      console.error(err);
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', orderId);
      
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'delivered' } : o));
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto font-sans space-y-6">
      <h1 className="text-2xl font-semibold">Orders Overview</h1>

      <Card className="border-border/60 shadow-sm overflow-hidden bg-background">
        <div className="p-4 border-b border-border/60 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-2xl flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by order number, MRN, patient name, or id"
                className="w-full pl-9 pr-4 py-2 bg-transparent border-none text-[14px] outline-none placeholder:text-muted-foreground/70"
              />
            </div>
            
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <button className="p-2 hover:bg-muted rounded-md transition-colors"><Printer className="h-[18px] w-[18px]" /></button>
              <button className="p-2 hover:bg-muted rounded-md transition-colors"><ArrowDownUp className="h-[18px] w-[18px]" /></button>
              <button className="p-2 hover:bg-muted rounded-md transition-colors"><Columns className="h-[18px] w-[18px]" /></button>
              <button className="p-2 hover:bg-muted rounded-md transition-colors"><CloudDownload className="h-[18px] w-[18px]" /></button>
              <button className="p-2 hover:bg-muted rounded-md transition-colors"><RefreshCw className="h-[18px] w-[18px]" /></button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              {[ "Status", "Product", "Pharmacies"].map((filter) => (
                <button key={filter} className="flex items-center gap-1.5 px-3.5 py-1.5 border border-border/80 rounded-full text-[13px] font-medium hover:bg-muted/50 transition-colors">
                  {filter} <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>
            <button className="text-[13px] font-medium border border-border/80 bg-muted/20 px-4 py-1.5 rounded-full hover:bg-muted/50 transition-colors">
              Reset Filters
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/20 border-b border-border/60 text-muted-foreground text-[13px]">
              <tr>
                <th className="font-medium py-3.5 px-6">Patient Name</th>
                <th className="font-medium py-3.5 px-4">Brand</th>
                <th className="font-medium py-3.5 px-4">Product</th>
                <th className="font-medium py-3.5 px-4">Order Date</th>
                <th className="font-medium py-3.5 px-4">Status</th>
                <th className="font-medium py-3.5 px-4">Manual Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {orders.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="font-medium">{item.patient_name || item.patientName}</div>
                    <div className="text-xs text-muted-foreground">MRN: {item.id.substring(0, 8)}</div>
                  </td>
                  <td className="py-4 px-4 text-foreground/80">{item.sub_brand || item.subBrand || "Peak Health"}</td>
                  <td className="py-4 px-4 text-foreground/80">
                    <div>{item.medication}</div>
                    <div className="text-xs text-muted-foreground">{item.pharmacy || 'Default Pharmacy'}</div>
                  </td>
                  <td className="py-4 px-4 text-foreground/80">{item.ordered_date || item.orderedDate || new Date(item.created_at).toLocaleDateString()}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusStyles[item.status]}`}>
                      {statusLabels[item.status]}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {/* Manual Status Overrides for Pharmacies without APIs */}
                    {item.status === "rx_sent" && editingOrder !== item.id && (
                       <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => setEditingOrder(item.id)}>
                         <Truck className="h-3 w-3" /> Mark Shipped
                       </Button>
                    )}
                    
                    {editingOrder === item.id && (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <input 
                          type="text" 
                          placeholder="Tracking Number" 
                          className="border px-2 py-1 text-xs rounded"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                        />
                        <div className="flex gap-1">
                          <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 flex-1" onClick={() => handleMarkShipped(item.id)}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingOrder(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {item.status === "shipped" && (
                      <div className="flex flex-col gap-1">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                           <Truck className="h-3 w-3" /> {item.carrier}: {item.tracking}
                        </div>
                        <Button size="sm" variant="outline" className="h-8 gap-1 w-full" onClick={() => handleMarkDelivered(item.id)}>
                          <CheckCircle className="h-3 w-3" /> Mark Delivered
                        </Button>
                      </div>
                    )}
                    
                    {item.status === "delivered" && (
                      <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Delivered
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

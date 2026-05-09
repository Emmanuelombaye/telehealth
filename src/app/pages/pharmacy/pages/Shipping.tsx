import { useEffect, useState } from "react";
import { Truck, Printer, ExternalLink, Loader2, Package, CheckCircle2, Search } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";

type ShipOrder = {
  id: string;
  order_number: string;
  patient_name: string;
  medication: string;
  status: string;
  tracking_number: string | null;
  carrier: string | null;
  tracking_url: string | null;
  shipped_date: string | null;
  delivered_date: string | null;
  estimated_delivery: string | null;
};

const carrierUrl = (carrier: string | null, tn: string | null) => {
  if (!tn) return null;
  const c = (carrier || '').toLowerCase();
  if (c.includes('ups')) return `https://www.ups.com/track?tracknum=${encodeURIComponent(tn)}`;
  if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(tn)}`;
  if (c.includes('usps')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(tn)}`;
  return null;
};

export function PharmacyShippingPage() {
  const [orders, setOrders] = useState<ShipOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function fetchData() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, patient_name, medication, status, tracking_number, carrier, tracking_url, shipped_date, delivered_date, estimated_delivery')
        .in('status', ['shipped', 'delivered'])
        .order('shipped_date', { ascending: false });
      if (error) throw error;
      setOrders((data as any) || []);
    } catch (err) {
      console.error("Shipping fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const ch = supabase.channel('pharmacy-shipping')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function markDelivered(id: string) {
    setUpdatingId(id);
    try {
      await supabase.from('orders').update({
        status: 'delivered',
        delivered_date: new Date().toLocaleDateString()
      }).eq('id', id);
      await fetchData();
    } finally { setUpdatingId(null); }
  }

  const filtered = orders.filter(o =>
    !search ||
    o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
    o.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.tracking_number?.toLowerCase().includes(search.toLowerCase())
  );

  const inTransit = filtered.filter(o => o.status === 'shipped').length;
  const delivered = filtered.filter(o => o.status === 'delivered').length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Truck className="h-6 w-6 text-primary" /> Shipping Queue</h1>
          <p className="text-sm text-muted-foreground">Track outbound shipments and confirm deliveries.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> {inTransit} in transit</Badge>
          <Badge variant="outline" className="gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {delivered} delivered</Badge>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order, patient, or tracking #"
          className="w-full pl-9 pr-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary" />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed border-2"><CardContent className="p-12 text-center text-muted-foreground">
          <Package className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No shipments yet.</p>
        </CardContent></Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Medication</th>
                <th className="px-4 py-3">Tracking</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const url = o.tracking_url || carrierUrl(o.carrier, o.tracking_number);
                return (
                  <tr key={o.id} className="border-b border-border/40 hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{o.order_number}</td>
                    <td className="px-4 py-3 font-semibold">{o.patient_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.medication}</td>
                    <td className="px-4 py-3">
                      {o.tracking_number ? (
                        <span className="font-mono text-xs">{o.tracking_number}</span>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn("text-[10px] font-bold",
                        o.status === 'delivered' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                      )}>{o.status === 'delivered' ? 'DELIVERED' : 'IN TRANSIT'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        {url && <a href={url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="h-8 text-xs gap-1"><ExternalLink className="h-3 w-3" /> Track</Button>
                        </a>}
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => window.print()}>
                          <Printer className="h-3 w-3" /> Label
                        </Button>
                        {o.status === 'shipped' && (
                          <Button size="sm" className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => markDelivered(o.id)} disabled={updatingId === o.id}>
                            {updatingId === o.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} Delivered
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

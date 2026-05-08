import { useState, useEffect } from "react";
import { TestTube, Clock, CheckCircle2, AlertCircle, Plus, Loader2, Search, FlaskConical, X } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";

const statusConfig = {
  "results-ready": { color: "text-emerald-600", bg: "bg-emerald-100", icon: CheckCircle2, label: "Results Ready" },
  "pending":       { color: "text-amber-600",   bg: "bg-amber-100",   icon: Clock,        label: "Pending" },
  "in-progress":   { color: "text-violet-600",  bg: "bg-violet-100",  icon: TestTube,     label: "In Progress" },
};

const priorityColors = {
  routine: "bg-muted text-muted-foreground",
  urgent:  "bg-amber-100 text-amber-700",
  stat:    "bg-red-100 text-red-700",
};

const commonTests = ["CBC", "CMP", "HbA1c", "Lipid Panel", "TSH", "Free T4", "BNP", "Troponin", "Urinalysis", "eGFR", "LFTs", "Ferritin", "Vitamin D", "PSA"];

export function DoctorLabsPage() {
  const { user } = useAuthStore();
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  // New lab order form state
  const [form, setForm] = useState({
    patient_id: "",
    patient_name: "",
    tests: [] as string[],
    priority: "routine",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchLabOrders();
    fetchPatients();

    const ch = supabase.channel('lab-orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lab_orders' }, fetchLabOrders)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  async function fetchLabOrders() {
    try {
      const { data, error } = await supabase
        .from('lab_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setLabOrders(data || []);
    } catch (err) {
      console.error("Lab orders fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPatients() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('user_id, patient_name')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Deduplicate
      const seen = new Set();
      const unique = (data || []).filter((p: any) => {
        if (seen.has(p.patient_name)) return false;
        seen.add(p.patient_name);
        return true;
      });
      setPatients(unique);
    } catch (err) {
      console.error("Patient fetch error:", err);
    }
  }

  async function handleSubmitOrder() {
    if (!user || !form.patient_name || form.tests.length === 0) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('lab_orders').insert({
        doctor_id: user.id,
        patient_name: form.patient_name,
        patient_id: form.patient_id || null,
        tests: form.tests,
        priority: form.priority,
        notes: form.notes,
        status: 'pending',
        ordered_by: `Dr. ${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
        ordered_date: new Date().toLocaleDateString(),
      });
      if (error) throw error;
      setShowNewOrder(false);
      setForm({ patient_id: "", patient_name: "", tests: [], priority: "routine", notes: "" });
      await fetchLabOrders();
    } catch (err) {
      console.error("Lab order submit error:", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkReady(id: string) {
    await supabase.from('lab_orders').update({ status: 'results-ready' }).eq('id', id);
    await fetchLabOrders();
  }

  const toggleTest = (t: string) => {
    setForm(f => ({
      ...f,
      tests: f.tests.includes(t) ? f.tests.filter(x => x !== t) : [...f.tests, t]
    }));
  };

  const filtered = labOrders.filter(o =>
    !search || o.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.tests?.join(' ').toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    ready: labOrders.filter(o => o.status === 'results-ready').length,
    pending: labOrders.filter(o => o.status === 'pending').length,
    inProgress: labOrders.filter(o => o.status === 'in-progress').length,
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Lab Requests</h1>
        <Button size="sm" className="rounded-full gap-1.5 text-xs" onClick={() => setShowNewOrder(true)}>
          <Plus className="h-3.5 w-3.5" /> New Order
        </Button>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Results Ready", count: counts.ready, color: "text-emerald-600" },
          { label: "Pending", count: counts.pending, color: "text-amber-600" },
          { label: "In Progress", count: counts.inProgress, color: "text-violet-600" },
        ].map((s, i) => (
          <Card key={i} className="border-none bg-muted/50">
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-extrabold ${s.color}`}>{s.count}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New order form */}
      {showNewOrder && (
        <Card className="border-primary/30 border-2">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm flex items-center gap-2"><FlaskConical className="h-4 w-4 text-primary" /> New Lab Order</p>
              <button onClick={() => setShowNewOrder(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Patient</label>
              <select
                value={form.patient_name}
                onChange={e => {
                  const p = patients.find(p => p.patient_name === e.target.value);
                  setForm(f => ({ ...f, patient_name: e.target.value, patient_id: p?.user_id || "" }));
                }}
                className="w-full mt-1 border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary">
                <option value="">Select patient...</option>
                {patients.map((p, i) => (
                  <option key={i} value={p.patient_name}>{p.patient_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Tests to Order</label>
              <div className="flex flex-wrap gap-2">
                {commonTests.map(t => (
                  <button key={t} onClick={() => toggleTest(t)}
                    className={cn("text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition-all",
                      form.tests.includes(t)
                        ? "bg-primary border-primary text-white"
                        : "border-border text-muted-foreground hover:border-primary/50")}>
                    {t}
                  </button>
                ))}
              </div>
              {form.tests.length > 0 && (
                <p className="text-xs text-primary mt-2 font-semibold">Selected: {form.tests.join(", ")}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="w-full mt-1 border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary">
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="stat">STAT</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Notes (Optional)</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Clinical context..."
                  className="w-full mt-1 border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary" />
              </div>
            </div>

            <Button className="w-full rounded-xl gap-2" onClick={handleSubmitOrder}
              disabled={submitting || !form.patient_name || form.tests.length === 0}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
              {submitting ? "Submitting..." : "Submit Lab Order"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      {labOrders.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Search by patient or test..." />
        </div>
      )}

      {/* Lab orders list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl text-muted-foreground">
          <TestTube className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">{search ? "No orders match your search" : "No lab orders yet"}</p>
          {!search && <p className="text-xs mt-1">Click "New Order" to order labs for a patient.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const cfg = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
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
                        <p className="font-bold text-sm">{order.patient_name}</p>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize", priorityColors[order.priority as keyof typeof priorityColors])}>
                          {order.priority}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(order.tests || []).join(", ")} · Ordered {order.ordered_date || new Date(order.created_at).toLocaleDateString()}
                      </p>
                      {order.notes && <p className="text-xs text-muted-foreground italic mt-0.5">"{order.notes}"</p>}
                      <Badge variant="outline" className={cn("text-[10px] mt-1.5", cfg.color)}>{cfg.label}</Badge>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {order.status === "results-ready" && (
                        <Button size="sm" className="rounded-xl text-xs h-8">Review</Button>
                      )}
                      {order.status === "pending" && (
                        <Button size="sm" variant="outline" className="rounded-xl text-xs h-8"
                          onClick={() => handleMarkReady(order.id)}>
                          Mark Ready
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

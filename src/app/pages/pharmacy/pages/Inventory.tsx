import { useEffect, useMemo, useState } from "react";
import { Boxes, AlertTriangle, Loader2, Search, Plus, Save, X } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";

type Item = {
  id: string;
  sku: string;
  name: string;
  strength: string | null;
  form: string | null;
  on_hand: number;
  reorder_threshold: number;
  unit_cost: number | null;
  supplier: string | null;
  updated_at: string;
};

const empty: Omit<Item, 'id' | 'updated_at'> = {
  sku: "", name: "", strength: "", form: "tablet", on_hand: 0, reorder_threshold: 10, unit_cost: 0, supplier: "",
};

export function PharmacyInventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingTable, setMissingTable] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<typeof empty>(empty);
  const [busy, setBusy] = useState(false);

  async function fetchItems() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('pharmacy_inventory').select('*').order('name');
      if (error) {
        if (error.code === '42P01') { setMissingTable(true); setItems([]); return; }
        throw error;
      }
      setItems((data as any) || []);
    } catch (err) { console.error("Inventory fetch:", err); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    fetchItems();
    const ch = supabase.channel('pharmacy-inventory-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pharmacy_inventory' }, fetchItems)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => items.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase())
  ), [items, search]);

  const lowStock = items.filter(i => i.on_hand <= i.reorder_threshold).length;
  const totalValue = items.reduce((s, i) => s + (i.on_hand * (i.unit_cost || 0)), 0);

  async function saveDraft() {
    setBusy(true);
    try {
      if (editingId) await supabase.from('pharmacy_inventory').update(draft).eq('id', editingId);
      else await supabase.from('pharmacy_inventory').insert(draft);
      setEditingId(null); setAdding(false); setDraft(empty);
      await fetchItems();
    } catch (err: any) { alert(err.message || "Save failed"); }
    finally { setBusy(false); }
  }

  function beginEdit(i: Item) {
    setEditingId(i.id); setAdding(false);
    setDraft({ sku: i.sku, name: i.name, strength: i.strength, form: i.form, on_hand: i.on_hand, reorder_threshold: i.reorder_threshold, unit_cost: i.unit_cost, supplier: i.supplier });
  }
  function beginAdd() { setAdding(true); setEditingId(null); setDraft(empty); }
  function cancel() { setAdding(false); setEditingId(null); setDraft(empty); }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Boxes className="h-6 w-6 text-primary" /> Inventory & Compounding</h1>
          <p className="text-sm text-muted-foreground">Real-time SKU stock levels and reorder thresholds.</p>
        </div>
        <Button className="rounded-xl" onClick={beginAdd}><Plus className="h-4 w-4 mr-2" /> Add SKU</Button>
      </div>

      {missingTable && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-900">
            <p className="font-bold mb-1">Inventory table not yet provisioned.</p>
            <p>Apply <code className="font-mono bg-white px-2 py-0.5 rounded">supabase_pharmacy_inventory.sql</code> in your Supabase SQL editor.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardContent className="p-5"><p className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Total SKUs</p><p className="text-2xl font-bold mt-1">{items.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Low Stock</p><p className="text-2xl font-bold mt-1 text-amber-600">{lowStock}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Inventory Value</p><p className="text-2xl font-bold mt-1">${totalValue.toFixed(2)}</p></CardContent></Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SKU or name"
          className="w-full pl-9 pr-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary" />
      </div>

      {(adding || editingId) && (
        <Card><CardContent className="p-4 grid md:grid-cols-7 gap-3 items-end">
          <Field label="SKU"><input value={draft.sku} onChange={e => setDraft({ ...draft, sku: e.target.value })} className={fieldCls} /></Field>
          <Field label="Name" wide><input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} className={fieldCls} /></Field>
          <Field label="Strength"><input value={draft.strength || ""} onChange={e => setDraft({ ...draft, strength: e.target.value })} className={fieldCls} /></Field>
          <Field label="On hand"><input type="number" value={draft.on_hand} onChange={e => setDraft({ ...draft, on_hand: +e.target.value })} className={fieldCls} /></Field>
          <Field label="Reorder"><input type="number" value={draft.reorder_threshold} onChange={e => setDraft({ ...draft, reorder_threshold: +e.target.value })} className={fieldCls} /></Field>
          <Field label="Unit $"><input type="number" step="0.01" value={draft.unit_cost || 0} onChange={e => setDraft({ ...draft, unit_cost: +e.target.value })} className={fieldCls} /></Field>
          <div className="flex gap-2 md:col-span-7 justify-end">
            <Button variant="outline" className="rounded-xl" onClick={cancel}><X className="h-4 w-4 mr-1" /> Cancel</Button>
            <Button className="rounded-xl" onClick={saveDraft} disabled={busy || !draft.sku || !draft.name}>
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save
            </Button>
          </div>
        </CardContent></Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">SKU</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Strength</th>
              <th className="px-4 py-3 text-right">On Hand</th><th className="px-4 py-3 text-right">Reorder</th>
              <th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">No inventory items.</td></tr>}
            {filtered.map(i => {
              const low = i.on_hand <= i.reorder_threshold;
              return (
                <tr key={i.id} className="border-b border-border/40 hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs">{i.sku}</td>
                  <td className="px-4 py-3 font-semibold">{i.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{i.strength || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono">{i.on_hand}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{i.reorder_threshold}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn("text-[10px] font-bold", low ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
                      {low && <AlertTriangle className="h-3 w-3 mr-1 inline" />}
                      {low ? "REORDER" : "IN STOCK"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => beginEdit(i)}>Edit</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

const fieldCls = "w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:border-primary";
function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <div className={wide ? "md:col-span-2" : ""}><label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</label>{children}</div>;
}

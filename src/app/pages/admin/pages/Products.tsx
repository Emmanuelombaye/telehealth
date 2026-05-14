import { useState, useEffect } from "react";
import { Plus, PackageSearch, RefreshCw, X, Check, Loader2, TrendingUp, Layers, Box, Pill } from "lucide-react";
import { Card, Button, Input, cn } from "../../../components/ui/shared.tsx";
import { AdminDataTable, StatusText } from "../../../components/ui/tables/AdminDataTable";
import { supabase } from "../../../../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

export function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [routingSaving, setRoutingSaving] = useState(false);
  const [routeForm, setRouteForm] = useState({
    requires_video: false,
    video_states: "",
    scheduling_embed_url: "",
    bmi_min: "",
    age_min: "",
    answer_triggers_json: "",
  });
  
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Weight Loss",
    price_usd: "",
    description: "",
    active: true
  });

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!editingProduct) return;
    const f =
      editingProduct.features &&
      typeof editingProduct.features === "object" &&
      !Array.isArray(editingProduct.features)
        ? editingProduct.features
        : {};
    const vc = (f as any).video_clinical_rules || {};
    const triggers = vc.answerTriggers || vc.answer_triggers;
    setRouteForm({
      requires_video: !!(f as any).requires_video_consult,
      video_states: Array.isArray((f as any).video_required_states)
        ? (f as any).video_required_states.join(", ")
        : "",
      scheduling_embed_url: typeof (f as any).scheduling_embed_url === "string" ? (f as any).scheduling_embed_url : "",
      bmi_min: vc.bmiMin != null ? String(vc.bmiMin) : vc.bmi_min != null ? String(vc.bmi_min) : "",
      age_min: vc.ageMin != null ? String(vc.ageMin) : vc.age_min != null ? String(vc.age_min) : "",
      answer_triggers_json: triggers ? JSON.stringify(triggers, null, 2) : "",
    });
  }, [editingProduct]);

  async function saveProductRouting(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProduct) return;
    setRoutingSaving(true);
    try {
      const prev =
        editingProduct.features &&
        typeof editingProduct.features === "object" &&
        !Array.isArray(editingProduct.features)
          ? { ...editingProduct.features }
          : {};
      const states = routeForm.video_states
        .split(/[,;\s]+/)
        .map((s) => s.trim().toUpperCase())
        .filter((s) => /^[A-Z]{2}$/.test(s));
      const next: Record<string, unknown> = { ...prev };
      next.requires_video_consult = routeForm.requires_video;
      next.video_required_states = states.length ? states : [];
      if (routeForm.scheduling_embed_url.trim().startsWith("https://")) {
        next.scheduling_embed_url = routeForm.scheduling_embed_url.trim();
      } else {
        delete next.scheduling_embed_url;
      }
      const vc: Record<string, unknown> = {};
      if (routeForm.bmi_min.trim()) vc.bmiMin = Number(routeForm.bmi_min);
      if (routeForm.age_min.trim()) vc.ageMin = Number(routeForm.age_min);
      if (routeForm.answer_triggers_json.trim()) {
        try {
          const parsed = JSON.parse(routeForm.answer_triggers_json);
          if (Array.isArray(parsed)) vc.answerTriggers = parsed;
        } catch {
          alert("Answer triggers must be valid JSON array.");
          setRoutingSaving(false);
          return;
        }
      }
      if (Object.keys(vc).length) next.video_clinical_rules = vc;
      else delete next.video_clinical_rules;

      const { error } = await supabase.from("products").update({ features: next }).eq("id", editingProduct.id);
      if (error) throw error;
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Save failed — check console / RLS.");
    } finally {
      setRoutingSaving(false);
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('products').insert([{
        ...newProduct,
        price_usd: parseFloat(newProduct.price_usd)
      }]);
      if (error) throw error;
      
      setShowAddModal(false);
      setNewProduct({ name: "", category: "Weight Loss", price_usd: "", description: "", active: true });
      fetchProducts();
    } catch (err) {
      alert("Error adding product. Check console.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto font-sans space-y-8 animate-fade-in-up p-4 md:p-0">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Inventory Command</span>
           </div>
           <h1 className="text-4xl font-black text-[#0A2E1F] tracking-tight">Clinical Protocols</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest border-slate-200 h-12 px-6 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
            onClick={() => window.open('/explore-treatments', '_blank')}
          >
            <PackageSearch className="h-4 w-4" /> Browse Catalog
          </Button>
          <Button 
            className="bg-[#0A2E1F] hover:bg-emerald-950 text-white rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-emerald-900/20 h-12 px-8 transition-all hover:-translate-y-0.5 active:translate-y-0"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-4 w-4" /> Add Protocol
          </Button>
        </div>
      </div>

      {/* EXECUTIVE METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Active Protocols", val: products.filter(p => p.active).length, icon: Pill, sub: "Live clinical offerings" },
          { label: "Drug Groups", val: "12", icon: Layers, sub: "Categorized therapeutics" },
          { label: "Protocol Revenue", val: "$128,420", icon: TrendingUp, sub: "Monthly platform volume", highlight: true },
        ].map((m, i) => (
          <Card key={i} className={cn(
            "relative overflow-hidden border-none shadow-2xl shadow-slate-200/60 p-8 group transition-all hover:shadow-emerald-900/5",
            m.highlight ? "bg-[#0A2E1F] text-white" : "bg-white text-[#0A2E1F]"
          )}>
            <div className={cn(
              "absolute top-0 right-0 w-32 h-32 blur-3xl -mr-16 -mt-16 opacity-20",
              m.highlight ? "bg-emerald-400" : "bg-emerald-100"
            )} />
            <div className="relative z-10 space-y-4">
               <div className={cn(
                 "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500",
                 m.highlight ? "bg-white/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"
               )}>
                  <m.icon className="h-5 w-5" />
               </div>
               <div>
                  <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", m.highlight ? "text-emerald-300" : "text-slate-400")}>{m.label}</p>
                  <h2 className="text-4xl font-black tracking-tighter mt-1">{m.val}</h2>
                  <p className={cn("text-[10px] font-bold mt-2", m.highlight ? "text-emerald-400" : "text-slate-300")}>{m.sub}</p>
               </div>
            </div>
          </Card>
        ))}
      </div>

      {/* DATA TABLE SECTION */}
      <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-emerald-600">
                 <Box className="h-5 w-5" />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Inventory</p>
                 <h3 className="text-lg font-black text-[#0A2E1F]">Protocol Repository</h3>
              </div>
           </div>
           <Button variant="ghost" className="h-10 w-10 rounded-xl hover:bg-white" onClick={fetchProducts}>
              <RefreshCw className={cn("h-4 w-4 text-slate-400", loading && "animate-spin")} />
           </Button>
        </div>
        
        <div className="p-2">
          <AdminDataTable 
            data={products.map(p => ({
              id: p.id.substring(0, 8),
              name: p.name,
              category: p.category,
              price: `$${p.price_usd}`,
              status: p.active ? "Active" : "Archived",
              updated: new Date(p.created_at).toLocaleDateString()
            }))} 
            columns={[
              { header: "ID", accessorKey: "id", cell: (item: any) => <span className="text-[10px] font-black text-slate-300">#{item.id}</span> },
              { header: "Protocol Name", accessorKey: "name", cell: (item: any) => <span className="font-black text-[#0A2E1F] text-sm uppercase tracking-tight">{item.name}</span> },
              { header: "Category", accessorKey: "category", cell: (item: any) => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.category}</span> },
              { header: "MSRP", accessorKey: "price", cell: (item: any) => <span className="font-black text-emerald-600">{item.price}</span> },
              { header: "Status", accessorKey: "status", cell: (item: any) => <StatusText status={item.status} /> },
              { header: "Deployed", accessorKey: "updated", cell: (item: any) => <span className="text-[11px] font-bold text-slate-400">{item.updated}</span> },
              {
                header: "",
                accessorKey: "actions",
                cell: (item: any) => {
                  const prod = products.find((p) => p.id.substring(0, 8) === item.id);
                  return (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 rounded-lg text-[10px] font-black uppercase"
                      onClick={() => prod && setEditingProduct(prod)}
                    >
                      Video rules
                    </Button>
                  );
                },
              },
            ]} 
            searchPlaceholder="Search repository by name or category..." 
          />
        </div>
      </div>

      {/* ADD PRODUCT MODAL - EXECUTIVE EMERALD EDITION */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0A2E1F]/40 backdrop-blur-md"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[48px] shadow-3xl overflow-hidden border border-white/20"
            >
              <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-[#0A2E1F] text-white">
                 <div>
                    <div className="flex items-center gap-2 mb-2">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                       <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">Clinical Creation</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight">Deploy New Protocol</h2>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    <X size={20} />
                 </button>
              </div>

              <form onSubmit={handleAddProduct} className="p-10 space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Protocol Designation</label>
                    <Input 
                      required 
                      placeholder="e.g. Semaglutide (GLP-1)" 
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      className="rounded-2xl border-slate-200 h-14 font-bold focus:ring-emerald-500/10"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Biological Domain</label>
                       <select 
                         className="flex h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer"
                         value={newProduct.category}
                         onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                       >
                          <option>Weight Loss</option>
                          <option>Sexual Wellness</option>
                          <option>Hair Loss</option>
                          <option>Anti-Aging</option>
                          <option>Longevity</option>
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Target MSRP ($)</label>
                       <Input 
                         required 
                         type="number" 
                         placeholder="199" 
                         value={newProduct.price_usd}
                         onChange={e => setNewProduct({...newProduct, price_usd: e.target.value})}
                         className="rounded-2xl border-slate-200 h-14 font-bold focus:ring-emerald-500/10"
                       />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Clinical Narrative</label>
                    <textarea 
                      className="flex min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                      placeholder="Describe the therapeutic mechanism..."
                      value={newProduct.description}
                      onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                    />
                 </div>

                 <Button 
                   disabled={submitting}
                   className="w-full h-16 bg-[#0A2E1F] hover:bg-emerald-950 text-white rounded-[24px] font-black uppercase text-[11px] tracking-[0.3em] shadow-3xl shadow-emerald-900/30 mt-6 transition-all hover:-translate-y-1 active:translate-y-0"
                 >
                    {submitting ? <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-400" /> : "Authorize Deployment"}
                 </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0A2E1F]/40 backdrop-blur-md"
              onClick={() => setEditingProduct(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[32px] shadow-2xl border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">Sync video routing</p>
                  <h2 className="text-xl font-black text-[#0A2E1F] mt-1">{editingProduct.name}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={saveProductRouting} className="p-8 space-y-5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-emerald-600"
                    checked={routeForm.requires_video}
                    onChange={(e) => setRouteForm((f) => ({ ...f, requires_video: e.target.checked }))}
                  />
                  <span className="text-sm font-bold text-[#0A2E1F]">Always require sync video for this protocol</span>
                </label>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Video if ship-to state (comma, 2-letter)</label>
                  <Input
                    placeholder="e.g. CA, NY"
                    value={routeForm.video_states}
                    onChange={(e) => setRouteForm((f) => ({ ...f, video_states: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scheduling embed URL (https)</label>
                  <Input
                    placeholder="https://calendly.com/... or Cal.com embed"
                    value={routeForm.scheduling_embed_url}
                    onChange={(e) => setRouteForm((f) => ({ ...f, scheduling_embed_url: e.target.value }))}
                    className="rounded-xl text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">BMI ≥ triggers video</label>
                    <Input
                      type="number"
                      placeholder="e.g. 40"
                      value={routeForm.bmi_min}
                      onChange={(e) => setRouteForm((f) => ({ ...f, bmi_min: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Age ≥ triggers video</label>
                    <Input
                      type="number"
                      placeholder="e.g. 65"
                      value={routeForm.age_min}
                      onChange={(e) => setRouteForm((f) => ({ ...f, age_min: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Answer triggers (JSON array)</label>
                  <textarea
                    className="w-full min-h-[100px] rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono"
                    placeholder='[{"questionId":"q_x","values":["Yes"]}]'
                    value={routeForm.answer_triggers_json}
                    onChange={(e) => setRouteForm((f) => ({ ...f, answer_triggers_json: e.target.value }))}
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Global state list for <strong>all</strong> protocols: set <code className="text-[10px] bg-slate-100 px-1 rounded">VITE_VIDEO_REQUIRED_STATES</code> in env.
                  Cross-product rules (e.g. GLP-1 + CA + BMI): use Supabase table <code className="text-[10px] bg-slate-100 px-1 rounded">consult_routing_rules</code> — run <code className="text-[10px] bg-slate-100 px-1 rounded">supabase_consult_routing_rules.sql</code>.
                </p>
                <Button
                  type="submit"
                  disabled={routingSaving}
                  className="w-full h-12 bg-[#0A2E1F] hover:bg-emerald-950 text-white rounded-xl font-black uppercase text-[10px] tracking-widest"
                >
                  {routingSaving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Save routing"}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

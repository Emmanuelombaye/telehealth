import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router";
import {
  Plus,
  PackageSearch,
  RefreshCw,
  X,
  Loader2,
  TrendingUp,
  Layers,
  Box,
  Pill,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  Video,
} from "lucide-react";
import { Card, Button, Input, cn } from "../../../components/ui/shared.tsx";
import { AdminDataTable, StatusText } from "../../../components/ui/tables/AdminDataTable";
import { supabase } from "../../../../lib/supabaseClient";
import {
  DEFAULT_PRODUCT_GATEWAYS,
  GATEWAY_DISPLAY,
  normalizeProductGateways,
  sortGateways,
} from "../../../../lib/productGateways";
import { motion, AnimatePresence } from "framer-motion";

export function AdminProductsPage() {
  const location = useLocation();
  const isSuperAdminRoute = location.pathname.includes("/superadmin/");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [routingSaving, setRoutingSaving] = useState(false);
  const [paymentGatewaysSelected, setPaymentGatewaysSelected] = useState<string[]>([]);
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
    fetchProducts();
  }, []);

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
    setPaymentGatewaysSelected(normalizeProductGateways((f as any).gateways));
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

      if (!paymentGatewaysSelected.length) {
        alert("Select at least one payment method for this protocol.");
        setRoutingSaving(false);
        return;
      }
      next.gateways = sortGateways(paymentGatewaysSelected);

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
        price_usd: parseFloat(newProduct.price_usd),
        features: {
          gateways: [...DEFAULT_PRODUCT_GATEWAYS],
        },
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

  const stats = useMemo(() => {
    const active = products.filter((p) => p.active).length;
    const categoryCount = new Set(products.map((p) => p.category).filter(Boolean)).size;
    const listTotalUsd = products.reduce((s, p) => s + (Number(p.price_usd) || 0), 0);
    return { active, categoryCount, listTotalUsd };
  }, [products]);

  const formatUsd = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const metricCards = [
    {
      label: "Active protocols",
      val: stats.active,
      icon: Pill,
      sub: "Live in checkout & routing",
      accent: "from-emerald-500/25 to-teal-400/10",
      iconBg: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/20",
    },
    {
      label: "Care verticals",
      val: stats.categoryCount,
      icon: Layers,
      sub: "Distinct catalog categories",
      accent: "from-violet-500/20 to-fuchsia-400/10",
      iconBg: "bg-violet-500/15 text-violet-700 ring-violet-500/20",
    },
    {
      label: "Listed catalog value",
      val: formatUsd(stats.listTotalUsd),
      icon: TrendingUp,
      sub: "Sum of protocol list prices",
      accent: "from-amber-500/25 to-orange-400/10",
      iconBg: "bg-amber-500/15 text-amber-800 ring-amber-500/25",
      wide: true,
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden font-sans">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(16,185,129,0.12),transparent_50%),radial-gradient(ellipse_80%_50%_at_100%_0%,rgba(139,92,246,0.08),transparent_45%),radial-gradient(ellipse_60%_40%_at_0%_100%,rgba(14,165,233,0.08),transparent_40%)]"
        aria-hidden
      />
      <div className="mx-auto max-w-[1440px] space-y-10 px-4 py-8 md:px-6 md:py-10 animate-fade-in-up">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.25)] ring-1 ring-slate-900/5 backdrop-blur-xl md:rounded-[2.5rem]">
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background:
                "linear-gradient(135deg, rgba(6,78,59,0.92) 0%, rgba(17,24,39,0.88) 42%, rgba(76,29,149,0.55) 78%, rgba(14,116,144,0.45) 100%)",
            }}
            aria-hidden
          />
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl" aria-hidden />
          <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" aria-hidden />
          <div className="absolute right-1/3 top-1/2 h-48 w-48 rounded-full bg-cyan-400/15 blur-2xl" aria-hidden />

          <div className="relative z-10 flex flex-col gap-10 p-8 md:flex-row md:items-end md:justify-between md:p-12 lg:p-14">
            <div className="max-w-2xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200/95 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                {isSuperAdminRoute ? "Superadmin · Protocol OS" : "Admin · Protocol OS"}
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl lg:text-[3.25rem] lg:leading-[1.05]">
                Clinical protocols,{" "}
                <span className="bg-gradient-to-r from-emerald-300 via-cyan-200 to-violet-200 bg-clip-text text-transparent">
                  orchestrated beautifully
                </span>
              </h1>
              <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-200/90 md:text-[15px]">
                Curate the therapeutic catalog, tune checkout gateways, and align sync-video rules in one calm surface.
                {isSuperAdminRoute ? " Full-fidelity control for platform operators." : ""}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold text-emerald-100/90">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                  Supabase-backed inventory
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold text-violet-100/90">
                  <Video className="h-3.5 w-3.5 text-violet-300" />
                  Checkout + video routing
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
              <Button
                variant="outline"
                className="h-12 gap-2 rounded-2xl border-white/25 bg-white/10 px-6 font-black text-[10px] uppercase tracking-[0.2em] text-white shadow-lg shadow-black/20 backdrop-blur-md transition hover:bg-white/15 hover:text-white"
                onClick={() => window.open("/explore-treatments", "_blank")}
              >
                <PackageSearch className="h-4 w-4" />
                Browse catalog
                <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
              </Button>
              <Button
                className="h-12 gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 px-8 font-black text-[10px] uppercase tracking-[0.2em] text-slate-950 shadow-xl shadow-emerald-900/30 transition hover:brightness-105 active:scale-[0.99]"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-4 w-4" />
                Add protocol
              </Button>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {metricCards.map((m, i) => (
            <Card
              key={i}
              className={cn(
                "group relative overflow-hidden border border-slate-200/80 bg-white/90 p-7 shadow-lg shadow-slate-200/40 ring-1 ring-slate-900/[0.03] backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-xl",
                m.wide && "md:col-span-1",
              )}
            >
              <div
                className={cn(
                  "pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-gradient-to-br opacity-70 blur-2xl transition group-hover:opacity-100",
                  m.accent,
                )}
              />
              <div className="relative z-10 flex flex-col gap-4">
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-inset transition group-hover:scale-105",
                    m.iconBg,
                  )}
                >
                  <m.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{m.label}</p>
                  <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">{m.val}</h2>
                  <p className="mt-2 text-[11px] font-semibold text-slate-500">{m.sub}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Table shell */}
        <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-[0_28px_100px_-32px_rgba(15,23,42,0.2)] ring-1 ring-slate-900/[0.04] backdrop-blur-md md:rounded-[2.25rem]">
          <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-emerald-50/30 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/25">
                <Box className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Live inventory</p>
                <h3 className="text-xl font-black tracking-tight text-slate-900">Protocol repository</h3>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  {products.length} row{products.length === 1 ? "" : "s"}
                  {loading ? " · refreshing…" : ""}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="h-11 gap-2 self-start rounded-xl border-slate-200 font-bold text-slate-700 md:self-auto"
              onClick={fetchProducts}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Sync
            </Button>
          </div>

          <div className="relative p-2 md:p-4">
            {loading && products.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 py-16">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                <p className="text-sm font-semibold text-slate-500">Loading protocols…</p>
              </div>
            ) : (
              <AdminDataTable
                data={products.map((p) => ({
                  id: p.id.substring(0, 8),
                  name: p.name,
                  category: p.category,
                  price: `$${p.price_usd}`,
                  status: p.active ? "Active" : "Archived",
                  updated: new Date(p.created_at).toLocaleDateString(),
                }))}
                columns={[
                  {
                    header: "ID",
                    accessorKey: "id",
                    cell: (item: any) => <span className="font-mono text-[10px] font-bold text-slate-400">#{item.id}</span>,
                  },
                  {
                    header: "Protocol",
                    accessorKey: "name",
                    cell: (item: any) => (
                      <span className="text-sm font-black uppercase tracking-tight text-slate-900">{item.name}</span>
                    ),
                  },
                  {
                    header: "Category",
                    accessorKey: "category",
                    cell: (item: any) => (
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.category}</span>
                    ),
                  },
                  {
                    header: "MSRP",
                    accessorKey: "price",
                    cell: (item: any) => <span className="font-black text-emerald-600">{item.price}</span>,
                  },
                  { header: "Status", accessorKey: "status", cell: (item: any) => <StatusText status={item.status} /> },
                  {
                    header: "Deployed",
                    accessorKey: "updated",
                    cell: (item: any) => <span className="text-[11px] font-bold text-slate-400">{item.updated}</span>,
                  },
                  {
                    header: "",
                    accessorKey: "actions",
                    cell: (item: any) => {
                      const prod = products.find((p) => p.id.substring(0, 8) === item.id);
                      return (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 rounded-xl border-violet-200 bg-gradient-to-r from-violet-50 to-emerald-50 text-[10px] font-black uppercase text-slate-800 shadow-sm transition hover:border-violet-300 hover:from-violet-100 hover:to-emerald-50"
                          onClick={() => prod && setEditingProduct(prod)}
                        >
                          Checkout & video
                        </Button>
                      );
                    },
                  },
                ]}
                searchPlaceholder="Search by name or category…"
              />
            )}
          </div>
        </div>

      {/* ADD PRODUCT MODAL - EXECUTIVE EMERALD EDITION */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-md"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/15 bg-white shadow-[0_40px_120px_-24px_rgba(15,23,42,0.5)]"
            >
              <div className="relative flex items-center justify-between overflow-hidden border-b border-white/10 p-8 text-white md:p-10">
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(6,78,59,0.95) 0%, rgba(17,24,39,0.92) 55%, rgba(76,29,149,0.75) 100%)",
                  }}
                  aria-hidden
                />
                <div className="relative z-10">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-300">New protocol</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight md:text-3xl">Deploy to catalog</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="p-8 space-y-6 md:p-10 md:space-y-8">
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
                   className="mt-4 h-14 w-full rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-violet-600 font-black uppercase tracking-[0.2em] text-[11px] text-white shadow-xl shadow-emerald-900/25 transition hover:brightness-105"
                 >
                    {submitting ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-white" /> : "Authorize deployment"}
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
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-md"
              onClick={() => setEditingProduct(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-white/15 bg-white shadow-[0_40px_120px_-24px_rgba(15,23,42,0.5)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative flex items-center justify-between overflow-hidden border-b border-white/10 p-8 text-white">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(30,27,75,0.95) 0%, rgba(6,78,59,0.9) 50%, rgba(14,116,144,0.85) 100%)",
                  }}
                  aria-hidden
                />
                <div className="relative z-10 min-w-0 pr-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-violet-200">Checkout & sync video</p>
                  <h2 className="mt-1 truncate text-xl font-black">{editingProduct.name}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={saveProductRouting} className="p-8 space-y-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Payment methods (shop checkout)
                  </p>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Per-protocol options stored as <code className="text-[10px] bg-slate-100 px-1 rounded">features.gateways</code>.
                    The shop shows every method you enable here. Card uses Stripe Elements; enable{" "}
                    <code className="text-[10px] bg-slate-100 px-1 rounded">VITE_ENABLE_DEMO_ALT_GATEWAYS=true</code> on
                    staging to exercise wallet flows without live APIs.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_PRODUCT_GATEWAYS.map((gw) => {
                      const on = paymentGatewaysSelected.includes(gw);
                      const meta = GATEWAY_DISPLAY[gw];
                      return (
                        <label
                          key={gw}
                          className={cn(
                            "flex items-center gap-2 cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold transition-colors",
                            on ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                          )}
                        >
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 accent-emerald-600"
                            checked={on}
                            onChange={() => {
                              setPaymentGatewaysSelected((prev) =>
                                prev.includes(gw) ? prev.filter((x) => x !== gw) : sortGateways([...prev, gw]),
                              );
                            }}
                          />
                          <span>{meta?.icon}</span>
                          <span>{meta?.label ?? gw}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
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
                    placeholder="https://calendly.com/… or https://cal.com/your-org/visit"
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
                  <p className="text-[10px] text-amber-800/90 leading-relaxed rounded-lg border border-amber-200/80 bg-amber-50/80 px-2.5 py-2">
                    Enrollment routing ignores questionnaire answers. Use product flags, state lists, BMI/age, and{" "}
                    <code className="text-[9px] bg-white/80 px-1 rounded">consult_routing_rules</code> instead.
                    Answer triggers apply only to legacy in-app consult flows, not patient shop step 8.
                  </p>
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
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 via-emerald-600 to-teal-600 font-black uppercase tracking-widest text-[10px] text-white shadow-lg transition hover:brightness-105"
                >
                  {routingSaving ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Save checkout & video"}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

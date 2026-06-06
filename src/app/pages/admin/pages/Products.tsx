import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router";
import { toast } from "sonner";
import {
  Plus,
  PackageSearch,
  RefreshCw,
  X,
  Loader2,
  TrendingUp,
  Trash2,
  Save,
  Layers,
  Box,
  Pill,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  Video,
  FileText,
} from "lucide-react";
import { Card, Button, Input, cn } from "../../../components/ui/shared.tsx";
import { AdminDataTable, StatusText } from "../../../components/ui/tables/AdminDataTable";
import { ProductRoutingBadge, ProductRoutingProfileCard } from "../../../components/admin/ProductRoutingBadge";
import { ConsultRoutingRulesPanel } from "../../../components/admin/ConsultRoutingRulesPanel";
import { supabase } from "../../../../lib/supabaseClient";
import {
  countProductsByRoutingMode,
  getProductRoutingProfile,
} from "../../../../lib/productRoutingProfile";
import {
  DEFAULT_PRODUCT_GATEWAYS,
  GATEWAY_DISPLAY,
  normalizeProductGateways,
  sortGateways,
} from "../../../../lib/productGateways";
import { motion, AnimatePresence } from "framer-motion";
import { AdminScopeNotice } from "../../../components/admin/AdminScopeNotice.tsx";
import { useAuthStore } from "../../../../lib/auth-store";

export function AdminProductsPage() {
  const location = useLocation();
  const isSuperAdminRoute = location.pathname.includes("/superadmin/");
  const role = useAuthStore((s) => s.role);
  const scopeNoticeVariant =
    role === "super_admin" || isSuperAdminRoute ? "platform" : "brand";
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [routingSaving, setRoutingSaving] = useState(false);
  const [coreSaving, setCoreSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [coreForm, setCoreForm] = useState({ name: "", category: "", price_usd: "", active: true });
  const [paymentGatewaysSelected, setPaymentGatewaysSelected] = useState<string[]>([]);
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [routeForm, setRouteForm] = useState({
    requires_video: false,
    video_states: "",
    scheduling_embed_url: "",
    bmi_min: "",
    age_min: "",
    answer_triggers_json: "",
    questionnaire_id: "",
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

    async function fetchQuestionnaires() {
      try {
        const { data, error } = await supabase
          .from("admin_questionnaires")
          .select("id, name, questions, status")
          .order("name", { ascending: true });
        if (error) throw error;
        setQuestionnaires(data || []);
      } catch (err) {
        console.error("Error fetching questionnaires:", err);
      }
    }
    fetchQuestionnaires();
  }, []);

  useEffect(() => {
    if (!editingProduct) return;
    setCoreForm({
      name: editingProduct.name || "",
      category: editingProduct.category || "",
      price_usd: String(editingProduct.price_usd || ""),
      active: editingProduct.active !== false,
    });
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
      questionnaire_id: typeof (f as any).questionnaire_id === "string" ? (f as any).questionnaire_id : "",
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

      // Link selected questionnaire to product features
      if (routeForm.questionnaire_id) {
        next.questionnaire_id = routeForm.questionnaire_id;
        const selectedQ = questionnaires.find((q) => q.id === routeForm.questionnaire_id);
        if (selectedQ) {
          next.questionnaire = selectedQ.questions;
        }
      } else {
        delete next.questionnaire_id;
        delete next.questionnaire;
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
      toast.success("Checkout & routing configurations updated successfully!");
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Save failed — check console / RLS.");
    } finally {
      setRoutingSaving(false);
    }
  }

  const handleSaveCoreFields = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setCoreSaving(true);
    try {
      const { error } = await supabase.from("products").update({
        name: coreForm.name,
        category: coreForm.category,
        price_usd: parseFloat(coreForm.price_usd),
        active: coreForm.active,
      }).eq("id", editingProduct.id);
      if (error) throw error;
      toast.success("Protocol updated", { description: `${coreForm.name} — $${coreForm.price_usd}` });
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error("Save failed — check console / RLS.");
    } finally {
      setCoreSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!editingProduct) return;
    if (!window.confirm(`Permanently delete "${editingProduct.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("products").delete().eq("id", editingProduct.id);
      if (error) throw error;
      toast.success("Protocol deleted");
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed — check RLS.");
    } finally {
      setDeleting(false);
    }
  };

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
    const routing = countProductsByRoutingMode(products);
    const pathA = routing.path_a_always + routing.path_a_conditional;
    return { active, categoryCount, listTotalUsd, routing, pathA };
  }, [products]);

  const productOptions = useMemo(
    () => products.map((p) => ({ id: p.id, name: p.name as string })),
    [products],
  );

  const editingRoutingPreview = useMemo(() => {
    if (!editingProduct) return null;
    const states = routeForm.video_states
      .split(/[,;\s]+/)
      .map((s) => s.trim().toUpperCase())
      .filter((s) => /^[A-Z]{2}$/.test(s));
    const vc: Record<string, unknown> = {};
    if (routeForm.bmi_min.trim()) vc.bmiMin = Number(routeForm.bmi_min);
    if (routeForm.age_min.trim()) vc.ageMin = Number(routeForm.age_min);
    const previewFeatures: Record<string, unknown> = {
      requires_video_consult: routeForm.requires_video,
      video_required_states: states,
    };
    if (routeForm.scheduling_embed_url.trim().startsWith("https://")) {
      previewFeatures.scheduling_embed_url = routeForm.scheduling_embed_url.trim();
    }
    if (Object.keys(vc).length) previewFeatures.video_clinical_rules = vc;
    return getProductRoutingProfile(previewFeatures);
  }, [editingProduct, routeForm]);

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
    },
    {
      label: "Video intake (Path A)",
      val: stats.pathA,
      icon: Video,
      sub: `${stats.routing.path_a_always} always · ${stats.routing.path_a_conditional} conditional`,
      accent: "from-emerald-500/20 to-cyan-400/10",
      iconBg: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/20",
    },
    {
      label: "Async intake (Path B)",
      val: stats.routing.path_b,
      icon: FileText,
      sub:
        stats.routing.calendar_only > 0
          ? `${stats.routing.calendar_only} with calendar URL only`
          : "No live video at step 8",
      accent: "from-slate-400/15 to-slate-300/10",
      iconBg: "bg-slate-500/10 text-slate-700 ring-slate-400/20",
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] min-w-0 font-sans">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(16,185,129,0.12),transparent_50%),radial-gradient(ellipse_80%_50%_at_100%_0%,rgba(139,92,246,0.08),transparent_45%),radial-gradient(ellipse_60%_40%_at_0%_100%,rgba(14,165,233,0.08),transparent_40%)]"
        aria-hidden
      />
      <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 md:px-6 md:py-8 animate-fade-in-up">
        {/* Compact header */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-lg ring-1 ring-slate-900/[0.04] backdrop-blur-xl md:rounded-[1.75rem]">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/[0.06] via-transparent to-violet-500/[0.04]" aria-hidden />
          <div className="relative z-10 px-5 py-4 md:px-7 md:py-5">
            {/* Top row: icon + title + buttons */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/20">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <h1 className="whitespace-nowrap text-base font-black tracking-tight text-slate-900 md:text-lg">
                    Protocol OS
                  </h1>
                  <p className="whitespace-nowrap text-[11px] font-medium text-slate-500">
                    {isSuperAdminRoute ? "Superadmin" : "Admin"} · {products.length} protocol{products.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 sm:inline-flex">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  Secure DB
                </span>
                <span className="hidden items-center gap-1 rounded-full border border-violet-100 bg-violet-50 px-2 py-0.5 text-[9px] font-bold text-violet-700 sm:inline-flex">
                  <Video className="h-2.5 w-2.5" />
                  Video
                </span>
                <Button
                  variant="outline"
                  className="h-8 gap-1 rounded-lg border-slate-200 px-3 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:border-slate-300"
                  onClick={() => window.open("/explore-treatments", "_blank")}
                >
                  <PackageSearch className="h-3 w-3" />
                  Catalog
                  <ArrowUpRight className="h-2.5 w-2.5 opacity-50" />
                </Button>
                <Button
                  className="h-8 gap-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 text-[9px] font-black uppercase tracking-widest text-white shadow-sm shadow-emerald-900/15 transition hover:brightness-105"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="h-3 w-3" />
                  Add protocol
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Metrics — compact row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {metricCards.map((m, i) => (
            <Card
              key={i}
              className="group relative overflow-hidden border border-slate-200/60 bg-white/90 px-4 py-4 shadow-sm ring-1 ring-slate-900/[0.02] backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className={cn(
                  "pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-50 blur-2xl transition group-hover:opacity-80",
                  m.accent,
                )}
              />
              <div className="relative z-10 flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition group-hover:scale-105",
                    m.iconBg,
                  )}
                >
                  <m.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{m.label}</p>
                  <h2 className="text-xl font-black tracking-tight text-slate-900">{m.val}</h2>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Table shell — horizontal scroll so full protocol repo stays visible */}
        <div className="min-w-0 overflow-x-auto rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-[0_28px_100px_-32px_rgba(15,23,42,0.2)] ring-1 ring-slate-900/[0.04] backdrop-blur-md md:rounded-[2.25rem]">
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
                data={products.map((p) => {
                  const routingProfile = getProductRoutingProfile(p.features);
                  return {
                    id: p.id.substring(0, 8),
                    fullId: p.id,
                    name: p.name,
                    category: p.category,
                    price: `$${p.price_usd}`,
                    status: p.active ? "Active" : "Archived",
                    updated: new Date(p.created_at).toLocaleDateString(),
                    routingProfile,
                  };
                })}
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
                    header: "Enrollment path",
                    accessorKey: "routingProfile",
                    cell: (item: any) => (
                      <ProductRoutingBadge profile={item.routingProfile} size="sm" />
                    ),
                  },
                  {
                    header: "Deployed",
                    accessorKey: "updated",
                    cell: (item: any) => <span className="text-[11px] font-bold text-slate-400">{item.updated}</span>,
                  },
                  {
                    header: "",
                    accessorKey: "actions",
                    cell: (item: any) => {
                      const prod = products.find((p) => p.id === item.fullId);
                      return (
                        <div className="flex justify-end opacity-0 transition-all duration-300 group-hover:opacity-100 pr-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 rounded-xl border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-[10px] font-black uppercase text-emerald-800 shadow-sm transition hover:border-emerald-400 hover:from-emerald-100 hover:to-teal-100"
                            onClick={(e) => {
                              e.stopPropagation(); // prevent double click if row is clicked
                              if (prod) setEditingProduct(prod);
                            }}
                          >
                            Edit Protocol
                          </Button>
                        </div>
                      );
                    },
                  },
                ]}
                onRowClick={(item: any) => {
                  const prod = products.find((p) => p.id === item.fullId);
                  if (prod) setEditingProduct(prod);
                }}
                searchPlaceholder="Search by name or category…"
              />
            )}
          </div>
        </div>

        {isSuperAdminRoute ? (
          <ConsultRoutingRulesPanel productOptions={productOptions} />
        ) : null}

      {/* ADD PRODUCT MODAL - EXECUTIVE EMERALD EDITION */}
      {typeof document !== "undefined" && createPortal(
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
                className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/15 bg-white shadow-[0_40px_120px_-24px_rgba(15,23,42,0.5)] text-slate-900 staff-admin-surface"
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
        </AnimatePresence>,
        document.body
      )}

      {typeof document !== "undefined" && createPortal(
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
                className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-white/15 bg-white shadow-[0_40px_120px_-24px_rgba(15,23,42,0.5)] text-slate-900 staff-admin-surface"
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
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-violet-200">Edit Protocol</p>
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
              {/* ── CORE DETAILS ── */}
              <form onSubmit={handleSaveCoreFields} className="p-6 space-y-4 border-b border-slate-100 bg-slate-50/60">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">Core Details</p>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Protocol Name</label>
                  <input
                    required
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    value={coreForm.name}
                    onChange={e => setCoreForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Category</label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 appearance-none"
                      value={coreForm.category}
                      onChange={e => setCoreForm(f => ({ ...f, category: e.target.value }))}
                    >
                      <option>Weight Loss</option>
                      <option>Sexual Wellness</option>
                      <option>Hair Loss</option>
                      <option>Anti-Aging</option>
                      <option>Longevity</option>
                      <option>Skincare</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">MSRP ($)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      value={coreForm.price_usd}
                      onChange={e => setCoreForm(f => ({ ...f, price_usd: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-emerald-600"
                      checked={coreForm.active}
                      onChange={e => setCoreForm(f => ({ ...f, active: e.target.checked }))}
                    />
                    <span className="text-sm font-bold text-slate-700">Active (visible in checkout)</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDeleteProduct}
                      disabled={deleting}
                      className="flex h-9 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-[10px] font-black uppercase tracking-widest text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Delete
                    </button>
                    <button
                      type="submit"
                      disabled={coreSaving}
                      className="flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {coreSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save
                    </button>
                  </div>
                </div>
              </form>

              {/* ── ROUTING & VIDEO ── */}
              <form onSubmit={saveProductRouting} className="p-6 space-y-5">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">Checkout &amp; Routing</p>
                {editingRoutingPreview ? (
                  <ProductRoutingProfileCard profile={editingRoutingPreview} />
                ) : null}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Payment methods (shop checkout)
                  </p>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Per-protocol options stored as <code className="text-[10px] bg-slate-100 px-1 rounded">features.gateways</code>.
                    The shop shows every method you enable here. Card uses Stripe Elements; alternate wallet methods can be tested on staging without live payment APIs.
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
                {/* ── QUESTIONNAIRE ASSOCIATION ── */}
                <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700">
                      <FileText className="h-4 w-4" />
                    </div>
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-900">
                      Intake Questionnaire Link
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    Assign a published questionnaire template to this product. When patients select this treatment in the checkout flow, they will answer this questionnaire.
                  </p>
                  <select
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                    value={routeForm.questionnaire_id}
                    onChange={(e) => setRouteForm((f) => ({ ...f, questionnaire_id: e.target.value }))}
                  >
                    <option value="">-- Use default questions --</option>
                    {questionnaires.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.name} ({Array.isArray(q.questions) ? q.questions.length : 0} questions)
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-3 cursor-pointer pt-2">
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
                  <p className="text-[10px] text-emerald-900/90 leading-relaxed rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-2">
                    Tied to this product&apos;s intake questionnaire: when an answer matches, enrollment can require video,
                    show a warning, block submit, or flag manual review. Use the question <code className="text-[9px] bg-white/80 px-1 rounded">id</code> from
                    the linked questionnaire. Optional fields: <code className="text-[9px] bg-white/80 px-1 rounded">message</code>,{" "}
                    <code className="text-[9px] bg-white/80 px-1 rounded">blockSubmit</code>,{" "}
                    <code className="text-[9px] bg-white/80 px-1 rounded">flagManualReview</code>.
                  </p>
                  <textarea
                    className="w-full min-h-[100px] rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900"
                    placeholder='[{"questionId":"q_pregnant","values":["Yes"],"requireVideo":true,"message":"Live visit required.","flagManualReview":true}]'
                    value={routeForm.answer_triggers_json}
                    onChange={(e) => setRouteForm((f) => ({ ...f, answer_triggers_json: e.target.value }))}
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Global state list for <strong>all</strong> protocols: set{" "}
                  <code className="text-[10px] bg-slate-100 px-1 rounded">VITE_VIDEO_REQUIRED_STATES</code> in env.
                  {isSuperAdminRoute
                    ? " Cross-product rules: use the Global Path A panel below this table."
                    : " Cross-product rules: Superadmin → Products → Global Path A triggers."}
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
      </AnimatePresence>,
      document.body
    )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, DollarSign, Search, Globe, Users, Activity,
  ChevronRight, ToggleLeft, ToggleRight, Edit2, ExternalLink,
  Stethoscope, Package, CreditCard, BarChart3, ArrowLeft,
  CheckCircle2, Clock, AlertTriangle, Settings, X, Loader2, Rocket,
  ShieldCheck, Zap, Globe2, Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, cn } from "../../../components/ui/shared.tsx";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "../../../../lib/supabaseClient";
import { SuperAdminShell, saPanel } from "../../../components/superadmin/SuperAdminShell.tsx";

const mockBrands = [
  {
    id: "1", name: "Brand A", slug: "brand-a", domain: "branda.health",
    country: "🇺🇸 United States", timezone: "America/New_York",
    patients: 18420, doctors: 142, staff: 38, mrr: 128400, growth: 24,
    status: "active", plan: "Enterprise", since: "Jan 2025",
    products: ["Weight Loss", "ED Treatment", "Hair Loss", "Anxiety & Sleep"],
    gateways: ["Stripe", "PayPal", "Apple Pay"],
    languages: ["English", "Spanish"],
    revenueData: [
      { month: "Nov", v: 88000 }, { month: "Dec", v: 95000 }, { month: "Jan", v: 102000 },
      { month: "Feb", v: 110000 }, { month: "Mar", v: 118000 }, { month: "Apr", v: 124000 }, { month: "May", v: 128400 },
    ],
    orders: { total: 4820, pending: 34, shipped: 210, completed: 4576 },
    compliance: { hipaa: true, gdpr: true, soc2: true },
  }
];

export function SuperAdminBrandsPage() {
  const [selected, setSelected] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [dbBrands, setDbBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  
  const [newBrand, setNewBrand] = useState({
    name: "",
    domain: "",
    country: "🇺🇸 United States",
    plan: "Enterprise"
  });

  async function fetchBrands() {
    try {
      const { data, error } = await supabase.from('brands').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      const mappedData = (data || []).map(d => ({
        id: d.id, name: d.name, slug: d.slug, domain: d.domain,
        country: d.country, timezone: d.timezone, status: d.status,
        plan: d.plan, since: d.since_date, patients: d.patients_count,
        doctors: d.doctors_count, staff: d.staff_count, mrr: Number(d.mrr),
        growth: Number(d.growth), products: d.products || [],
        gateways: d.gateways || [], languages: d.languages || [],
        revenueData: d.revenue_data || [], orders: d.orders_data || {},
        compliance: d.compliance || {}
      }));
      setDbBrands(mappedData);
    } catch (err) {
      console.error("Error fetching brands:", err);
      setDbBrands([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBrands();
    const channel = supabase.channel('brands-sync-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brands' }, () => {
        fetchBrands();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisioning(true);
    
    // Simulate Infrastructure Provisioning Progress
    await new Promise(r => setTimeout(r, 2000));
    
    try {
      const slug = newBrand.name.toLowerCase().replace(/ /g, '-');
      const { error } = await supabase.from('brands').insert([{
        name: newBrand.name,
        slug,
        domain: newBrand.domain,
        country: newBrand.country,
        plan: newBrand.plan,
        status: 'active',
        since_date: new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
        patients_count: 0,
        doctors_count: 0,
        staff_count: 0,
        mrr: 0,
        growth: 0,
        products: ["Weight Loss"],
        gateways: ["Stripe"],
        languages: ["English"],
        revenue_data: [],
        orders_data: { total: 0, pending: 0, shipped: 0, completed: 0 },
        compliance: { hipaa: true, gdpr: true, soc2: false }
      }]);
      
      if (error) throw error;
      
      setShowProvisionModal(false);
      setNewBrand({ name: "", domain: "", country: "🇺🇸 United States", plan: "Enterprise" });
      fetchBrands();
    } catch (err) {
      console.error("Provisioning error:", err);
      alert("Database Synchronization Error: Ensure 'brands' table exists.");
    } finally {
      setProvisioning(false);
    }
  };

  const filtered = dbBrands.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.domain?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <SuperAdminShell eyebrow="Brands" title="White-label brands" description="Loading directory…">
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
        </div>
      </SuperAdminShell>
    );
  }

  if (selected) {
    return (
      <SuperAdminShell
        eyebrow="Brand"
        title={selected.name}
        description={`${selected.domain} · ${selected.country} · Plan ${selected.plan}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="h-9 rounded-lg" onClick={() => setSelected(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              All brands
            </Button>
            <Button size="sm" className="h-9 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800">
              Configuration
            </Button>
            <Button variant="outline" size="sm" className="h-9 w-9 rounded-lg p-0" type="button" aria-label="Open domain">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {[
            { label: "Monthly revenue", val: `$${(selected.mrr / 1000).toFixed(1)}k`, icon: DollarSign, tone: "text-emerald-700", bg: "bg-emerald-50" },
            { label: "Patients", val: selected.patients.toLocaleString(), icon: Users, tone: "text-slate-800", bg: "bg-slate-100" },
            { label: "Doctors", val: String(selected.doctors), icon: Stethoscope, tone: "text-blue-700", bg: "bg-blue-50" },
            { label: "Growth", val: `+${selected.growth}%`, icon: BarChart3, tone: "text-amber-700", bg: "bg-amber-50" },
          ].map((m, i) => (
            <Card key={i} className={saPanel}>
              <CardContent className="p-4">
                <div className={cn("mb-2 flex h-9 w-9 items-center justify-center rounded-lg", m.bg, m.tone)}>
                  <m.icon className="h-4 w-4" />
                </div>
                <p className="text-xl font-semibold tabular-nums text-slate-900">{m.val}</p>
                <p className="text-xs font-medium text-slate-500">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className={saPanel}>
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">Revenue trend</h2>
              <Badge variant="outline" className="text-[10px] font-normal text-slate-600">
                {selected.status}
              </Badge>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selected.revenueData}>
                  <defs>
                    <linearGradient id="brandRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "none",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(v: any) => [`$${(v / 1000).toFixed(1)}k`, "Revenue"]}
                  />
                  <Area type="monotone" dataKey="v" stroke="#059669" strokeWidth={2} fill="url(#brandRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </SuperAdminShell>
    );
  }

  return (
    <>
      <SuperAdminShell
        eyebrow="Brands"
        title="White-label brands"
        actions={
          <Button
            type="button"
            onClick={() => setShowProvisionModal(true)}
            size="sm"
            className="h-9 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            New brand
          </Button>
        }
      >
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none ring-emerald-500/20 focus:ring-2 placeholder:text-slate-400"
          placeholder="Search by name or domain…"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {[
          { label: "Aggregate MRR", value: `$${(dbBrands.reduce((sum, b) => sum + (b.mrr || 0), 0) / 1000).toFixed(1)}k`, icon: DollarSign },
          { label: "Patients", value: dbBrands.reduce((sum, b) => sum + (b.patients || 0), 0).toLocaleString(), icon: Users },
          { label: "Doctors", value: dbBrands.reduce((sum, b) => sum + (b.doctors || 0), 0), icon: Stethoscope },
          { label: "Uptime SLA", value: "99.98%", icon: Activity },
        ].map((s, i) => (
          <Card key={i} className={saPanel}>
            <CardContent className="space-y-2 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <s.icon className="h-4 w-4" />
              </div>
              <p className="text-xl font-semibold tabular-nums text-slate-900">{s.value}</p>
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((brand, i) => (
          <motion.div
            key={brand.id || i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.25) }}
            onClick={() => setSelected(brand)}
            className="cursor-pointer"
          >
            <Card className={cn(saPanel, "h-full transition-shadow hover:shadow-md")}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-emerald-400">
                    {brand.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-slate-900">{brand.name}</h3>
                      <Badge variant="outline" className="text-[10px] font-normal capitalize">
                        {brand.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500">
                      <Globe2 className="h-3.5 w-3.5 shrink-0" />
                      {brand.domain}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Patients</p>
                    <p className="text-sm font-semibold text-slate-900">{brand.patients.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">MRR</p>
                    <p className="text-sm font-semibold text-emerald-700">${(brand.mrr / 1000).toFixed(0)}k</p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span>{brand.plan}</span>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      </SuperAdminShell>

      {/* PROVISIONING MODAL - EXECUTIVE EDITION */}
      <AnimatePresence>
        {showProvisionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0A2E1F]/60 backdrop-blur-md"
              onClick={() => setShowProvisionModal(false)}
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
                       <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">Infrastructure Provisioning</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight">Provision New Brand</h2>
                 </div>
                 <button onClick={() => setShowProvisionModal(false)} className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    <X size={20} />
                 </button>
              </div>

              <form onSubmit={handleProvision} className="p-10 space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Brand Designation</label>
                    <Input 
                      required 
                      placeholder="e.g. Peak Wellness" 
                      value={newBrand.name}
                      onChange={e => setNewBrand({...newBrand, name: e.target.value})}
                      className="rounded-2xl border-slate-200 h-14 font-bold focus:ring-emerald-500/10"
                    />
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Operational Domain</label>
                    <Input 
                      required 
                      placeholder="e.g. peak-wellness.health" 
                      value={newBrand.domain}
                      onChange={e => setNewBrand({...newBrand, domain: e.target.value})}
                      className="rounded-2xl border-slate-200 h-14 font-bold focus:ring-emerald-500/10"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Region</label>
                       <select 
                         className="flex h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer"
                         value={newBrand.country}
                         onChange={e => setNewBrand({...newBrand, country: e.target.value})}
                       >
                          <option>🇺🇸 United States</option>
                          <option>🇬🇧 United Kingdom</option>
                          <option>🇦🇪 UAE</option>
                          <option>🇧🇷 Brazil</option>
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Service Plan</label>
                       <select 
                         className="flex h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer"
                         value={newBrand.plan}
                         onChange={e => setNewBrand({...newBrand, plan: e.target.value})}
                       >
                          <option>Enterprise</option>
                          <option>Growth</option>
                          <option>Starter</option>
                       </select>
                    </div>
                 </div>

                 <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 space-y-4">
                    <div className="flex items-center gap-4">
                       <ShieldCheck className="h-8 w-8 text-emerald-600" />
                       <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-relaxed">
                          Provisioning will automatically deploy HIPAA-compliant vault-alpha nodes for this instance.
                       </p>
                    </div>
                    {provisioning && (
                       <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
                          <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: "100%" }}
                               transition={{ duration: 2 }}
                               className="h-full bg-emerald-600"
                             />
                          </div>
                          <p className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.3em] text-center">Allocating AWS Resources...</p>
                       </div>
                    )}
                 </div>

                 <Button 
                   disabled={provisioning}
                   className="w-full h-16 bg-[#0A2E1F] hover:bg-emerald-950 text-white rounded-[24px] font-black uppercase text-[11px] tracking-[0.3em] shadow-3xl shadow-emerald-900/30 mt-6 transition-all hover:-translate-y-1 active:translate-y-0"
                 >
                    {provisioning ? <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-400" /> : "Authorize Infrastructure"}
                 </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

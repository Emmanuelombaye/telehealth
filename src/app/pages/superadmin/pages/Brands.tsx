import { useState, useEffect } from "react";
import {
  Building2, Search, Globe, Users, Activity, DollarSign,
  ChevronRight, ToggleLeft, ToggleRight, Edit2, ExternalLink,
  Stethoscope, Package, CreditCard, BarChart3, ArrowLeft,
  CheckCircle2, Clock, AlertTriangle, Settings, X, Loader2, Rocket,
  ShieldCheck, Zap, Globe2, Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, cn } from "../../../components/ui/shared.tsx";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "../../../../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

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
      
      if (data && data.length > 0) {
        const mappedData = data.map(d => ({
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
      } else {
        setDbBrands(mockBrands);
      }
    } catch (err) {
      console.error("Error fetching brands:", err);
      setDbBrands(mockBrands);
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
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6">
         <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />
         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-800 animate-pulse">Establishing Live Brand Matrix...</p>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#0A2E1F] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Global Infrastructure List
        </button>

        {/* Brand Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white p-10 rounded-[48px] shadow-2xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
           
           <div className="flex items-center gap-8 relative z-10">
              <div className="h-24 w-24 rounded-[32px] bg-gradient-to-br from-[#0A2E1F] to-[#051810] flex items-center justify-center font-black text-emerald-400 text-4xl shadow-2xl shadow-emerald-900/20 border border-emerald-500/20">
                 {selected.name.charAt(0)}
              </div>
              <div>
                 <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-4xl font-black text-[#0A2E1F] tracking-tight">{selected.name}</h1>
                    <Badge className="bg-emerald-500 text-white border-none font-black uppercase tracking-widest text-[9px] px-3">{selected.status}</Badge>
                 </div>
                 <p className="text-slate-400 font-bold text-lg flex items-center gap-3">
                   <Globe className="h-5 w-5 text-emerald-600" /> {selected.domain} <span className="h-1.5 w-1.5 rounded-full bg-slate-200"></span> {selected.country}
                 </p>
              </div>
           </div>

           <div className="flex gap-4 relative z-10">
              <Button className="h-14 rounded-2xl bg-[#0A2E1F] text-white px-8 font-black uppercase tracking-widest text-[10px]">
                 Enterprise Configuration
              </Button>
              <Button variant="outline" className="h-14 rounded-2xl border-slate-200 px-6">
                 <ExternalLink className="h-5 w-5" />
              </Button>
           </div>
        </div>

        {/* Brand Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[
             { label: "Monthly Revenue", val: `$${(selected.mrr / 1000).toFixed(1)}k`, icon: DollarSign, color: "text-emerald-600" },
             { label: "Active Patients", val: selected.patients.toLocaleString(), icon: Users, color: "text-[#0A2E1F]" },
             { label: "Clinical Staff", val: selected.doctors, icon: Stethoscope, color: "text-blue-600" },
             { label: "Performance Growth", val: `+${selected.growth}%`, icon: BarChart3, color: "text-amber-600" },
           ].map((m, i) => (
             <Card key={i} className="border-none shadow-xl shadow-slate-100/50 rounded-[40px] bg-white p-8 group hover:shadow-emerald-900/5 transition-all">
                <div className={cn("h-14 w-14 rounded-[20px] mb-6 flex items-center justify-center bg-slate-50", m.color)}>
                   <m.icon className="h-7 w-7" />
                </div>
                <h3 className="text-3xl font-black text-[#0A2E1F] tracking-tighter">{m.val}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{m.label}</p>
             </Card>
           ))}
        </div>

        {/* Detailed Chart Area */}
        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[56px] bg-white overflow-hidden p-12">
           <div className="flex items-center justify-between mb-12">
              <h3 className="text-3xl font-black text-[#0A2E1F] tracking-tighter">Revenue Trajectory</h3>
              <Badge className="bg-emerald-50 text-emerald-700 border-none px-4 py-2 font-black text-[10px] uppercase tracking-widest">Live Sync</Badge>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={selected.revenueData}>
                    <defs>
                       <linearGradient id="brandRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#cbd5e1", fontWeight: 900 }} />
                    <YAxis hide />
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#0A2E1F', border: 'none', borderRadius: '24px', color: '#fff', padding: '20px' }}
                       formatter={(v: any) => [`$${(v/1000).toFixed(1)}k`, "REVENUE"]}
                    />
                    <Area type="monotone" dataKey="v" stroke="#10b981" fill="url(#brandRev)" strokeWidth={5} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white p-10 rounded-[48px] shadow-2xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-700">Platform Brands Matrix</h1>
          </div>
          <h2 className="text-4xl font-black text-[#0A2E1F] tracking-tight">
            {dbBrands.length} active instances on infrastructure
          </h2>
        </div>
        
        <Button 
          onClick={() => setShowProvisionModal(true)}
          className="h-16 rounded-[28px] bg-[#0A2E1F] hover:bg-emerald-950 text-white px-10 font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-emerald-900/20 group relative z-10 transition-all hover:-translate-y-1"
        >
          <Plus className="h-5 w-5 mr-3 group-hover:rotate-90 transition-transform" /> Provision New Brand
        </Button>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
        <input 
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-16 pr-8 py-6 bg-white border border-slate-100 rounded-[32px] text-lg font-bold text-[#0A2E1F] focus:outline-none focus:ring-4 focus:ring-emerald-500/5 shadow-xl shadow-slate-100/50 transition-all placeholder:text-slate-300"
          placeholder="Search global brand infrastructure..." 
        />
      </div>

      {/* Global Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Aggregate MRR", value: `$${(dbBrands.reduce((sum, b) => sum + (b.mrr || 0), 0) / 1000).toFixed(1)}k`, icon: Wallet },
          { label: "Total Patients", value: dbBrands.reduce((sum, b) => sum + (b.patients || 0), 0).toLocaleString(), icon: Users },
          { label: "Total Doctors", value: dbBrands.reduce((sum, b) => sum + (b.doctors || 0), 0), icon: Stethoscope },
          { label: "Infrastructure Health", value: "99.98%", icon: Activity },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-100/50 rounded-[40px] bg-white p-8 group hover:shadow-emerald-900/5 transition-all">
            <div className="h-12 w-12 rounded-[20px] mb-6 flex items-center justify-center bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
               <s.icon size={24} />
            </div>
            <h3 className="text-3xl font-black text-[#0A2E1F] tracking-tighter">{s.value}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Brand List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.map((brand, i) => (
          <motion.div 
            key={brand.id || i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setSelected(brand)}
            className="group cursor-pointer"
          >
            <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[48px] bg-white p-10 hover:shadow-emerald-900/10 hover:-translate-y-2 transition-all border border-transparent hover:border-emerald-100 overflow-hidden relative h-full">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-125 transition-all duration-1000">
                 <Building2 size={180} />
              </div>
              
              <div className="flex items-center gap-6 mb-8 relative z-10">
                 <div className="h-20 w-20 rounded-[28px] bg-[#0A2E1F] flex items-center justify-center font-black text-emerald-400 text-3xl group-hover:rotate-6 transition-transform">
                   {brand.name.charAt(0)}
                 </div>
                 <div>
                    <div className="flex items-center gap-3 mb-1">
                       <h3 className="text-2xl font-black text-[#0A2E1F] tracking-tight">{brand.name}</h3>
                       <Badge className="bg-emerald-50 text-emerald-700 border-none text-[8px] font-black uppercase tracking-widest px-2">{brand.status}</Badge>
                    </div>
                    <p className="text-slate-400 font-bold text-sm flex items-center gap-2">
                       <Globe2 className="h-4 w-4" /> {brand.domain}
                    </p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                 <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:border-emerald-100 transition-all">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Patients</p>
                    <p className="text-xl font-black text-[#0A2E1F]">{brand.patients.toLocaleString()}</p>
                 </div>
                 <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:border-emerald-100 transition-all">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Monthly RR</p>
                    <p className="text-xl font-black text-emerald-600">${(brand.mrr / 1000).toFixed(0)}k</p>
                 </div>
              </div>
              
              <div className="mt-8 flex items-center justify-between relative z-10">
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Instance Plan:</span>
                    <span className="text-[10px] font-black text-[#0A2E1F] uppercase tracking-widest">{brand.plan}</span>
                 </div>
                 <ArrowRight className="h-5 w-5 text-slate-200 group-hover:text-emerald-600 group-hover:translate-x-2 transition-all" />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

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
    </div>
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

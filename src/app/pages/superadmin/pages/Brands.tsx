import { useState } from "react";
import {
  Building2, Plus, Search, Globe, Users, Activity, DollarSign,
  ChevronRight, ToggleLeft, ToggleRight, Edit2, ExternalLink,
  Stethoscope, Package, CreditCard, BarChart3, ArrowLeft,
  CheckCircle2, Clock, AlertTriangle, Settings
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, cn } from "../../../components/ui/shared";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const brands = [
  {
    id: 1, name: "Brand A", slug: "brand-a", domain: "branda.health",
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
  },
  {
    id: 2, name: "Brand B", slug: "brand-b", domain: "brandb.care",
    country: "🇬🇧 United Kingdom", timezone: "Europe/London",
    patients: 11230, doctors: 98, staff: 24, mrr: 94200, growth: 18,
    status: "active", plan: "Growth", since: "Mar 2025",
    products: ["Weight Loss", "Mental Health", "Dermatology"],
    gateways: ["Stripe", "PayPal", "SEPA"],
    languages: ["English", "French"],
    revenueData: [
      { month: "Nov", v: 62000 }, { month: "Dec", v: 68000 }, { month: "Jan", v: 74000 },
      { month: "Feb", v: 80000 }, { month: "Mar", v: 86000 }, { month: "Apr", v: 91000 }, { month: "May", v: 94200 },
    ],
    orders: { total: 2940, pending: 18, shipped: 142, completed: 2780 },
    compliance: { hipaa: false, gdpr: true, soc2: true },
  },
  {
    id: 3, name: "Brand C", slug: "brand-c", domain: "brandc.med",
    country: "🇦🇪 UAE", timezone: "Asia/Dubai",
    patients: 7840, doctors: 61, staff: 15, mrr: 61000, growth: 9,
    status: "active", plan: "Growth", since: "Jun 2025",
    products: ["General Consult", "Weight Loss"],
    gateways: ["Stripe", "Apple Pay"],
    languages: ["English", "Arabic"],
    revenueData: [
      { month: "Nov", v: 42000 }, { month: "Dec", v: 46000 }, { month: "Jan", v: 50000 },
      { month: "Feb", v: 54000 }, { month: "Mar", v: 57000 }, { month: "Apr", v: 59000 }, { month: "May", v: 61000 },
    ],
    orders: { total: 1820, pending: 12, shipped: 88, completed: 1720 },
    compliance: { hipaa: false, gdpr: true, soc2: false },
  },
  {
    id: 4, name: "Brand D", slug: "brand-d", domain: "brandd.clinic",
    country: "🇧🇷 Brazil", timezone: "America/Sao_Paulo",
    patients: 3210, doctors: 28, staff: 8, mrr: 35000, growth: 5,
    status: "trial", plan: "Starter", since: "Apr 2026",
    products: ["General Consult"],
    gateways: ["Stripe"],
    languages: ["Portuguese"],
    revenueData: [
      { month: "Jan", v: 0 }, { month: "Feb", v: 0 }, { month: "Mar", v: 0 },
      { month: "Apr", v: 12000 }, { month: "May", v: 35000 },
    ],
    orders: { total: 640, pending: 8, shipped: 32, completed: 600 },
    compliance: { hipaa: false, gdpr: false, soc2: false },
  },
];

type Brand = typeof brands[0];

export function SuperAdminBrandsPage() {
  const [selected, setSelected] = useState<Brand | null>(null);
  const [search, setSearch] = useState("");

  const filtered = brands.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.domain.toLowerCase().includes(search.toLowerCase())
  );

  if (selected) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Brands
        </button>

        {/* Brand header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center font-bold text-white text-2xl shrink-0">
              {selected.name.split(" ")[1]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{selected.name}</h1>
                <Badge variant={selected.status === "active" ? "success" : "secondary"}>{selected.status}</Badge>
                <Badge variant="outline" className="text-[10px]">{selected.plan}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{selected.domain} · {selected.country} · Since {selected.since}</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs">
              <ExternalLink className="h-3.5 w-3.5" /> Visit
            </Button>
            <Button size="sm" className="rounded-xl gap-1.5 text-xs bg-violet-600 hover:bg-violet-700">
              <Settings className="h-3.5 w-3.5" /> Configure
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "MRR", value: `$${(selected.mrr / 1000).toFixed(0)}k`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
            { label: "Patients", value: selected.patients.toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" },
            { label: "Doctors", value: selected.doctors, icon: Stethoscope, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
            { label: "Growth", value: `+${selected.growth}%`, icon: BarChart3, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue chart */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selected.revenueData}>
                  <defs>
                    <linearGradient id="brev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", fontSize: 12 }}
                    formatter={(v: any) => [`$${(v / 1000).toFixed(0)}k`]} />
                  <Area type="monotone" dataKey="v" stroke="#7c3aed" fill="url(#brev)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Orders */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Orders</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 grid grid-cols-2 gap-3">
              {[
                { label: "Total", value: selected.orders.total, color: "text-primary" },
                { label: "Pending", value: selected.orders.pending, color: "text-amber-600" },
                { label: "Shipped", value: selected.orders.shipped, color: "text-blue-600" },
                { label: "Completed", value: selected.orders.completed, color: "text-emerald-600" },
              ].map((o, i) => (
                <div key={i} className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className={`text-xl font-extrabold ${o.color}`}>{o.value.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{o.label}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Config */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> Configuration</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Products</p>
                <div className="flex flex-wrap gap-1">
                  {selected.products.map(p => <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>)}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Payment Gateways</p>
                <div className="flex flex-wrap gap-1">
                  {selected.gateways.map(g => <Badge key={g} variant="outline" className="text-[10px]">{g}</Badge>)}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Languages</p>
                <div className="flex flex-wrap gap-1">
                  {selected.languages.map(l => <Badge key={l} variant="outline" className="text-[10px]">{l}</Badge>)}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Compliance</p>
                <div className="flex gap-2">
                  {Object.entries(selected.compliance).map(([k, v]) => (
                    <span key={k} className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                      v ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40" : "bg-red-100 text-red-700 dark:bg-red-950/40")}>
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Brands</h1>
          <p className="text-sm text-muted-foreground">{brands.length} brands on platform</p>
        </div>
        <Button size="sm" className="rounded-full gap-1.5 text-xs bg-violet-600 hover:bg-violet-700">
          <Plus className="h-3.5 w-3.5" /> New Brand
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
          placeholder="Search brands..." />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total MRR", value: "$318,600", color: "text-emerald-600" },
          { label: "Total Patients", value: "40,700", color: "text-blue-600" },
          { label: "Total Doctors", value: "329", color: "text-violet-600" },
          { label: "Active Brands", value: "3 / 4", color: "text-amber-600" },
        ].map((s, i) => (
          <Card key={i} className="border-none bg-muted/50">
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(brand => (
          <Card key={brand.id} className="hover:border-violet-400/50 transition-all cursor-pointer hover:shadow-md"
            onClick={() => setSelected(brand)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center font-bold text-white text-lg shrink-0">
                  {brand.name.split(" ")[1]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm">{brand.name}</p>
                    <span className="text-sm">{brand.country.split(" ")[0]}</span>
                    <Badge variant={brand.status === "active" ? "success" : "secondary"} className="text-[9px]">{brand.status}</Badge>
                    <Badge variant="outline" className="text-[9px]">{brand.plan}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{brand.domain} · Since {brand.since}</p>
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{brand.patients.toLocaleString()} patients</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Stethoscope className="h-3 w-3" />{brand.doctors} doctors</span>
                    <span className="text-xs font-bold text-emerald-600">${(brand.mrr / 1000).toFixed(0)}k MRR</span>
                    <span className="text-[10px] font-bold text-emerald-600">+{brand.growth}%</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

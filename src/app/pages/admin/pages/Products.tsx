import { useState } from "react";
import {
  Package, Plus, Edit2, Trash2, Search, ChevronRight,
  ClipboardList, CreditCard, Globe, CheckCircle2, X, ToggleLeft, ToggleRight
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared";

const questionnaires = [
  { id: 1, name: "General Health Intake" },
  { id: 2, name: "Weight Loss Assessment" },
  { id: 3, name: "Mental Health Screening (PHQ-9)" },
  { id: 4, name: "ED / Men's Health Intake" },
  { id: 5, name: "Hair Loss Assessment" },
];

const gatewayOptions = [
  { key: "stripe", label: "Stripe", flag: "💳", regions: "Global" },
  { key: "paypal", label: "PayPal", flag: "🅿️", regions: "Global" },
  { key: "apple_pay", label: "Apple Pay", flag: "🍎", regions: "US, UK, EU, AU" },
  { key: "google_pay", label: "Google Pay", flag: "🔵", regions: "Global" },
  { key: "sepa", label: "SEPA Direct Debit", flag: "🇪🇺", regions: "EU" },
  { key: "ideal", label: "iDEAL", flag: "🇳🇱", regions: "Netherlands" },
  { key: "klarna", label: "Klarna", flag: "🛍️", regions: "EU, US, UK" },
  { key: "alipay", label: "Alipay", flag: "🇨🇳", regions: "China, Global" },
];

type Product = {
  id: number; name: string; category: string; price: string; stock: number;
  status: string; questionnaireId: number | null; gateways: string[]; active: boolean;
};

const initialProducts: Product[] = [
  { id: 1, name: "Weight Loss Program (Semaglutide)", category: "GLP-1 / Metabolic", price: "$199/mo", stock: 450, status: "in-stock", questionnaireId: 2, gateways: ["stripe", "paypal", "apple_pay"], active: true },
  { id: 2, name: "ED Treatment (Sildenafil/Tadalafil)", category: "Men's Health", price: "$49/mo", stock: 320, status: "in-stock", questionnaireId: 4, gateways: ["stripe", "paypal"], active: true },
  { id: 3, name: "Hair Loss Treatment", category: "Dermatology", price: "$39/mo", stock: 85, status: "in-stock", questionnaireId: 5, gateways: ["stripe", "apple_pay", "google_pay"], active: true },
  { id: 4, name: "Anxiety & Sleep Program", category: "Mental Health", price: "$79/mo", stock: 12, status: "low-stock", questionnaireId: 3, gateways: ["stripe", "paypal", "google_pay"], active: true },
  { id: 5, name: "Vitamin D3 5000 IU", category: "Supplement", price: "$15.99", stock: 0, status: "out-of-stock", questionnaireId: null, gateways: ["stripe"], active: false },
];

const stockColors = {
  "in-stock": "text-emerald-600",
  "low-stock": "text-amber-600",
  "out-of-stock": "text-red-600",
};

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editing, setEditing] = useState<Product | null>(null);

  const toggleActive = (id: number) => {
    setProducts(ps => ps.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const toggleGateway = (gw: string) => {
    if (!editing) return;
    setEditing(e => e ? ({
      ...e,
      gateways: e.gateways.includes(gw) ? e.gateways.filter(g => g !== gw) : [...e.gateways, gw]
    }) : null);
  };

  const saveEdit = () => {
    if (!editing) return;
    setProducts(ps => ps.map(p => p.id === editing.id ? editing : p));
    setEditing(null);
  };

  if (editing) {
    return (
      <div className="space-y-5 max-w-xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Edit Product</h1>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => setEditing(null)}>
              <X className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
            <Button size="sm" className="rounded-xl text-xs" onClick={saveEdit}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Save
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product Name</label>
              <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}
                className="w-full mt-1 border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</label>
                <input value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })}
                  className="w-full mt-1 border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price</label>
                <input value={editing.price} onChange={e => setEditing({ ...editing, price: e.target.value })}
                  className="w-full mt-1 border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questionnaire assignment */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-bold flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" /> Assigned Questionnaire
            </p>
            <select
              value={editing.questionnaireId ?? ""}
              onChange={e => setEditing({ ...editing, questionnaireId: e.target.value ? Number(e.target.value) : null })}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary">
              <option value="">No questionnaire</option>
              {questionnaires.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
            <p className="text-xs text-muted-foreground">Patients must complete this form before checkout</p>
          </CardContent>
        </Card>

        {/* Payment gateways */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-bold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" /> Payment Gateways
            </p>
            <div className="grid grid-cols-2 gap-2">
              {gatewayOptions.map(gw => {
                const active = editing.gateways.includes(gw.key);
                return (
                  <button key={gw.key} onClick={() => toggleGateway(gw.key)}
                    className={cn("flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all",
                      active ? "border-primary bg-primary/5" : "border-border hover:bg-accent")}>
                    <span className="text-lg">{gw.flag}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{gw.label}</p>
                      <p className="text-[10px] text-muted-foreground">{gw.regions}</p>
                    </div>
                    {active && <CheckCircle2 className="h-4 w-4 text-primary ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Products</h1>
        <Button size="sm" className="rounded-full gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Add Product</Button>
      </div>

      <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl px-4 py-3">
        <Globe className="h-4 w-4 text-blue-600 shrink-0" />
        <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">
          Each product can have its own intake questionnaire and payment gateways for international markets
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Search products..." />
      </div>

      <div className="space-y-2">
        {products.map(p => {
          const qName = questionnaires.find(q => q.id === p.questionnaireId)?.name;
          return (
            <Card key={p.id} className={cn("hover:border-primary/40 transition-colors", !p.active && "opacity-60")}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-sm">{p.name}</p>
                      <span className="font-bold text-primary text-sm shrink-0">{p.price}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
                      <span className={cn("text-[10px] font-semibold", stockColors[p.status as keyof typeof stockColors])}>
                        {p.status === "out-of-stock" ? "Out of Stock" : p.status === "low-stock" ? `Low (${p.stock})` : `In Stock (${p.stock})`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {qName ? (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <ClipboardList className="h-3 w-3 text-primary" />
                          <span className="truncate max-w-[140px]">{qName}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-amber-600">No questionnaire</span>
                      )}
                      <div className="flex items-center gap-1">
                        {p.gateways.slice(0, 3).map(gw => (
                          <span key={gw} className="text-sm" title={gw}>
                            {gatewayOptions.find(g => g.key === gw)?.flag}
                          </span>
                        ))}
                        {p.gateways.length > 3 && <span className="text-[10px] text-muted-foreground">+{p.gateways.length - 3}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => toggleActive(p.id)}>
                      {p.active
                        ? <ToggleRight className="h-6 w-6 text-primary" />
                        : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                    </button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl" onClick={() => setEditing(p)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

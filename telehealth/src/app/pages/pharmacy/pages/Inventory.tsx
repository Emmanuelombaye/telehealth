import { Package, Search, AlertTriangle, TrendingDown, Plus, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../../../components/ui/shared";

export function PharmacyInventoryPage() {
  const items = [
    { name: "Lisinopril 10mg", sku: "RX-1021", stock: 1240, reorder: 200, status: "ok", category: "Cardiovascular" },
    { name: "Metformin 500mg", sku: "RX-2045", stock: 87, reorder: 200, status: "low", category: "Diabetes" },
    { name: "Amoxicillin 500mg", sku: "RX-3012", stock: 560, reorder: 100, status: "ok", category: "Antibiotics" },
    { name: "Atorvastatin 20mg", sku: "RX-4088", stock: 14, reorder: 150, status: "critical", category: "Cardiovascular" },
    { name: "Sertraline 50mg", sku: "RX-5003", stock: 320, reorder: 100, status: "ok", category: "Psychiatry" },
    { name: "Omeprazole 20mg", sku: "RX-6071", stock: 45, reorder: 150, status: "low", category: "Gastroenterology" },
    { name: "Levothyroxine 25mcg", sku: "RX-7034", stock: 890, reorder: 100, status: "ok", category: "Endocrinology" },
    { name: "Amlodipine 5mg", sku: "RX-8002", stock: 220, reorder: 200, status: "ok", category: "Cardiovascular" },
  ];

  const statusConfig: Record<string, { label: string; className: string }> = {
    ok: { label: "In Stock", className: "bg-emerald-100 text-emerald-700" },
    low: { label: "Low Stock", className: "bg-amber-100 text-amber-700" },
    critical: { label: "Critical", className: "bg-red-100 text-red-700" },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6 text-teal-500" /> Drug Inventory</h1>
          <p className="text-sm text-muted-foreground">Real-time stock levels and reorder alerts.</p>
        </div>
        <Button className="rounded-xl bg-teal-500 hover:bg-teal-600"><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total SKUs", value: "1,284", icon: Package, color: "text-teal-500" },
          { label: "Low Stock Alerts", value: "23", icon: AlertTriangle, color: "text-amber-500" },
          { label: "Critical Items", value: "4", icon: TrendingDown, color: "text-red-500" },
        ].map((stat, i) => (
          <Card key={i}><CardContent className="p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-muted ${stat.color}`}><stat.icon className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground font-semibold">{stat.label}</p><p className="text-2xl font-bold">{stat.value}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Stock Levels</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:border-teal-500" placeholder="Search drug name or SKU..." />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>{["Drug Name", "SKU", "Category", "Stock Qty", "Reorder At", "Status", "Action"].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-semibold">{item.name}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{item.sku}</td>
                  <td className="px-5 py-3 text-muted-foreground">{item.category}</td>
                  <td className={`px-5 py-3 font-bold ${item.status === "critical" ? "text-red-500" : item.status === "low" ? "text-amber-500" : ""}`}>{item.stock.toLocaleString()}</td>
                  <td className="px-5 py-3 text-muted-foreground">{item.reorder}</td>
                  <td className="px-5 py-3"><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusConfig[item.status].className}`}>{statusConfig[item.status].label}</span></td>
                  <td className="px-5 py-3"><Button variant="outline" size="sm" className="h-7 text-xs gap-1"><RefreshCw className="h-3 w-3" /> Reorder</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

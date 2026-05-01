import { Package, Plus, Edit2, Trash2, Search } from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../../components/ui/shared";

const products = [
  { id: 1, name: "Lisinopril 10mg (30 tabs)", category: "Medication", price: "$12.99", stock: 450, status: "in-stock" },
  { id: 2, name: "Metformin 500mg (60 tabs)", category: "Medication", price: "$8.49", stock: 320, status: "in-stock" },
  { id: 3, name: "Blood Pressure Monitor", category: "Device", price: "$49.99", stock: 85, status: "in-stock" },
  { id: 4, name: "Glucose Test Strips (50ct)", category: "Supplies", price: "$24.99", stock: 12, status: "low-stock" },
  { id: 5, name: "Vitamin D3 5000 IU", category: "Supplement", price: "$15.99", stock: 0, status: "out-of-stock" },
];

const stockColors = { "in-stock": "text-emerald-600", "low-stock": "text-amber-600", "out-of-stock": "text-red-600" };

export function AdminProductsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Products</h1>
        <Button size="sm" className="rounded-full gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Add Product</Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Search products..." />
      </div>
      <div className="space-y-2">
        {products.map(p => (
          <Card key={p.id} className="hover:border-primary/40 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Package className="h-5 w-5 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
                    <span className={`text-[10px] font-semibold ${stockColors[p.status as keyof typeof stockColors]}`}>
                      {p.status === "out-of-stock" ? "Out of Stock" : p.status === "low-stock" ? `Low Stock (${p.stock})` : `In Stock (${p.stock})`}
                    </span>
                    <span className="text-xs font-bold text-primary">{p.price}</span>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl"><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

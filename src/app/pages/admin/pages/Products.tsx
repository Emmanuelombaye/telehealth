import { useState, useEffect } from "react";
import { Plus, PackageSearch, RefreshCw } from "lucide-react";
import { Card, Button } from "../../../components/ui/shared";
import { AdminDataTable, StatusText } from "../../../components/ui/shared/AdminDataTable";
import { supabase } from "../../../../lib/supabaseClient";

const filterTabs = ["Ungrouped Product", "Drug Group", "Digital Product", "Bundle", "Lab Test", "Active", "Archived"];

export function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
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
    fetchProducts();
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto font-sans space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-lg gap-2">
            <PackageSearch className="h-4 w-4" /> Browse products
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-lg gap-2">
            <Plus className="h-4 w-4" /> Add new
          </Button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-border/60">
          <div className="p-5 flex flex-col justify-center">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Active Products</p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-800">{products.filter(p => p.active).length}</h2>
          </div>
        </Card>
        <Card className="shadow-sm border-border/60">
          <div className="p-5 flex flex-col justify-center">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Active Product Bundles</p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">0</h2>
          </div>
        </Card>
        <Card className="shadow-sm border-border/60">
          <div className="p-5 flex flex-col justify-center">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Orders</p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">441</h2>
          </div>
        </Card>
      </div>

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
          { header: "ID", accessorKey: "id" },
          { header: "Name", accessorKey: "name", cell: (item: any) => <span className="font-semibold text-slate-800">{item.name}</span> },
          { header: "Category", accessorKey: "category" },
          { header: "Price", accessorKey: "price" },
          { header: "Status", accessorKey: "status", cell: (item: any) => <StatusText status={item.status} /> },
          { header: "Added", accessorKey: "updated" }
        ]} 
        searchPlaceholder="Search by name, category, or ID" 
      />
    </div>
  );
}

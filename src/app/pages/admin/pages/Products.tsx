import { useState, useEffect } from "react";
import { Plus, PackageSearch, RefreshCw, X, Check, Loader2 } from "lucide-react";
import { Card, Button, Input, cn } from "../../../components/ui/shared.tsx";
import { AdminDataTable, StatusText } from "../../../components/ui/tables/AdminDataTable";
import { supabase } from "../../../../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

export function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // New Product State
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
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto font-sans space-y-6 animate-fade-in-up p-4 md:p-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Products</h1>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-xl gap-2 font-bold text-xs uppercase tracking-widest border-slate-200"
            onClick={() => window.open('/explore-treatments', '_blank')}
          >
            <PackageSearch className="h-4 w-4 text-emerald-600" /> Browse Catalog
          </Button>
          <Button 
            className="bg-[#0A2E1F] hover:bg-emerald-950 text-white rounded-xl gap-2 font-bold text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/10"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-4 w-4" /> Add New Protocol
          </Button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-xl shadow-slate-200/50 border-none bg-white p-6 flex flex-col justify-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Protocols</p>
            <h2 className="text-4xl font-black tracking-tighter text-[#0A2E1F]">{products.filter(p => p.active).length}</h2>
        </Card>
        <Card className="shadow-xl shadow-slate-200/50 border-none bg-white p-6 flex flex-col justify-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Drug Groups</p>
            <h2 className="text-4xl font-black tracking-tighter text-[#0A2E1F]">0</h2>
        </Card>
        <Card className="shadow-xl shadow-slate-200/50 border-none bg-white p-6 flex flex-col justify-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Platform Revenue</p>
            <h2 className="text-4xl font-black tracking-tighter text-[#0A2E1F]">$128.4k</h2>
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
          { header: "Name", accessorKey: "name", cell: (item: any) => <span className="font-bold text-slate-800">{item.name}</span> },
          { header: "Category", accessorKey: "category" },
          { header: "Price", accessorKey: "price" },
          { header: "Status", accessorKey: "status", cell: (item: any) => <StatusText status={item.status} /> },
          { header: "Added", accessorKey: "updated" }
        ]} 
        searchPlaceholder="Search by protocol name, category, or ID" 
      />

      {/* ADD PRODUCT MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0A0D14]/60 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                 <div>
                    <h2 className="text-2xl font-black text-slate-800">Add New Protocol</h2>
                    <p className="text-xs font-medium text-slate-400">Configure a new clinical offering for the platform.</p>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="h-10 w-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400">
                    <X size={20} />
                 </button>
              </div>

              <form onSubmit={handleAddProduct} className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Protocol Name</label>
                    <Input 
                      required 
                      placeholder="e.g. Semaglutide (GLP-1)" 
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      className="rounded-xl border-slate-200"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</label>
                       <select 
                         className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Price (USD)</label>
                       <Input 
                         required 
                         type="number" 
                         placeholder="199" 
                         value={newProduct.price_usd}
                         onChange={e => setNewProduct({...newProduct, price_usd: e.target.value})}
                         className="rounded-xl border-slate-200"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</label>
                    <textarea 
                      className="flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="Protocol clinical details..."
                      value={newProduct.description}
                      onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                    />
                 </div>

                 <Button 
                   disabled={submitting}
                   className="w-full h-14 bg-[#0A2E1F] hover:bg-emerald-950 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-emerald-900/10 mt-4"
                 >
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Deploy Protocol"}
                 </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

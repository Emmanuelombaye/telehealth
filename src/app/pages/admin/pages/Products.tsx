import { Search, Plus, Filter, PackageSearch } from "lucide-react";
import { Card, Button } from "../../../components/ui/shared";

const mockProducts = [
  { id: "7", name: "Tirzepatide", count: "22", type: "Drug Group", status: "Active", updated: "--" },
  { id: "57", name: "Hairloss", count: "3", type: "Drug Group", status: "Active", updated: "--" },
  { id: "50", name: "Methylene Blue", count: "1", type: "Drug Group", status: "Active", updated: "--" },
  { id: "5", name: "Glutathione", count: "1", type: "Drug Group", status: "Active", updated: "--" },
  { id: "49", name: "NAD+ Nasal Spray", count: "1", type: "Drug Group", status: "Active", updated: "--" },
];

const filterTabs = ["Ungrouped Product", "Drug Group", "Digital Product", "Bundle", "Lab Test", "Active", "Archived"];

export function AdminProductsPage() {
  return (
    <div className="max-w-[1400px] mx-auto font-sans space-y-6">
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
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Active Products</p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">133</h2>
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

      <Card className="border-border/60 shadow-sm overflow-hidden bg-background">
        <div className="p-4 border-b border-border/60 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-xl flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, id, product name, or product id"
                className="w-full pl-9 pr-4 py-2 bg-transparent border-none text-[14px] outline-none placeholder:text-muted-foreground/70"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3.5 py-1.5 border border-border/80 rounded-full text-[13px] font-medium hover:bg-muted/50 transition-colors">
              Filter <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {filterTabs.map((tab) => (
              <button key={tab} className="px-3 py-1.5 border border-border/80 rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/20 border-b border-border/60 text-muted-foreground text-[13px]">
              <tr>
                <th className="font-medium py-3.5 px-6">ID</th>
                <th className="font-medium py-3.5 px-4">Name</th>
                <th className="font-medium py-3.5 px-4">Pharmacy Products Count</th>
                <th className="font-medium py-3.5 px-4">Type</th>
                <th className="font-medium py-3.5 px-4">Status</th>
                <th className="font-medium py-3.5 px-4">Updated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {mockProducts.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors group cursor-pointer">
                  <td className="py-4 px-6 text-muted-foreground">{item.id}</td>
                  <td className="py-4 px-4 font-semibold text-foreground">{item.name}</td>
                  <td className="py-4 px-4 text-foreground/80">
                    <span className="bg-muted/50 px-2.5 py-1 rounded-md text-xs">{item.count}</span>
                  </td>
                  <td className="py-4 px-4 text-foreground/80">{item.type}</td>
                  <td className="py-4 px-4">
                    <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full text-[11px] font-bold">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground">{item.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
